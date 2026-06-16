import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// Valid status transitions — mirrors the PHP CRM logic
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYMENT_PENDING: ["PLACED", "CANCELLED"],
  PLACED:          ["PROCESSING", "CANCELLED"],
  PROCESSING:      ["SHIPPED", "CANCELLED"],
  SHIPPED:         ["DELIVERED"],
  DELIVERED:       ["COMPLETED", "REFUNDED"],
  COMPLETED:       ["REFUNDED"],
  CANCELLED:       [],
  REFUNDED:        [],
};

// PUT /api/orders/:id/status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status, cancellationReason } = await req.json();

    if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });

    // Fetch current order
    const order = await prisma.orderMaster.findUnique({
      where: { id: parseInt(id) },
      select: { orderStatus: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[order.orderStatus];
    if (!allowed.includes(status as OrderStatus)) {
      return NextResponse.json({
        error: `Cannot move from ${order.orderStatus} to ${status}`,
      }, { status: 400 });
    }

    // Build update payload
    const updateData: any = { orderStatus: status as OrderStatus };
    if (status === "CANCELLED") {
      updateData.cancelledDate     = new Date();
      updateData.cancellationReason = cancellationReason ?? null;
    }

    // Update order master + all order details together
    const [updatedOrder] = await prisma.$transaction([
      prisma.orderMaster.update({
        where: { id: parseInt(id) },
        data:  updateData,
      }),
      prisma.orderDetail.updateMany({
        where: { orderMasterId: parseInt(id) },
        data:  { orderStatus: status as OrderStatus,
                 ...(status === "CANCELLED" ? {
                   cancelledDate: new Date(),
                   cancellationReason: cancellationReason ?? null,
                 } : {}),
                 ...(status === "DELIVERED" ? { deliveredDate: new Date() } : {}),
               },
      }),
    ]);

    return NextResponse.json({ success: true, status: updatedOrder.orderStatus });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
