import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// Helper — convert all Decimals to numbers so JSON serialises cleanly
function serializeOrder(order: any) {
  return {
    ...order,
    itemTotal:    Number(order.itemTotal),
    deliveryFee:  order.deliveryFee  ? Number(order.deliveryFee)  : null,
    gstCharges:   Number(order.gstCharges),
    cgst:         order.cgst  ? Number(order.cgst)  : null,
    sgst:         order.sgst  ? Number(order.sgst)  : null,
    igst:         order.igst  ? Number(order.igst)  : null,
    grandtotal:   Number(order.grandtotal),
    razorpayTransactionAmount: order.razorpayTransactionAmount
      ? Number(order.razorpayTransactionAmount) : null,
    orderDetails: order.orderDetails?.map((d: any) => ({
      ...d,
      unitPrice:    Number(d.unitPrice),
      priceWithGst: Number(d.priceWithGst),
      total:        Number(d.total),
      deliveryFee:  d.deliveryFee  ? Number(d.deliveryFee)  : null,
      gstCharges:   d.gstCharges   ? Number(d.gstCharges)   : null,
      cgst:         d.cgst         ? Number(d.cgst)         : null,
      sgst:         d.sgst         ? Number(d.sgst)         : null,
      igst:         d.igst         ? Number(d.igst)         : null,
    })),
  };
}

// GET /api/orders?type=current|past&page=1&search=&status=
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type    = searchParams.get("type") ?? "current";
    const page    = parseInt(searchParams.get("page")  ?? "1");
    const limit   = parseInt(searchParams.get("limit") ?? "10");
    const search  = searchParams.get("search") ?? "";
    const status  = searchParams.get("status") as OrderStatus | null;

    // Current = active orders, Past = completed/cancelled/refunded
    const currentStatuses: OrderStatus[] = ["PLACED", "PAYMENT_PENDING", "PROCESSING", "SHIPPED"];
    const pastStatuses:    OrderStatus[] = ["DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];

    const statusFilter = status
      ? [status]
      : type === "current" ? currentStatuses : pastStatuses;

    const where: any = { orderStatus: { in: statusFilter } };

    if (search) {
      where.OR = [
        { orderNumber:  { contains: search, mode: "insensitive" } },
        { custName:     { contains: search, mode: "insensitive" } },
        { custEmail:    { contains: search, mode: "insensitive" } },
        { custNumber:   { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.orderMaster.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        orderBy: { orderDate: "desc" },
        include: {
          orderDetails: {
            select: { id: true, productName: true, quantity: true, total: true, orderStatus: true },
          },
        },
      }),
      prisma.orderMaster.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map(serializeOrder),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
