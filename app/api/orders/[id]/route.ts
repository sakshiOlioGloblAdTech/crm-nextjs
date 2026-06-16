import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

// GET /api/orders/:id  — full order detail
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const order = await prisma.orderMaster.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: { select: { id: true, name: true, email: true, mobileNumber: true } },
        orderDetails: {
          include: {
            product:   { select: { id: true, productName: true, images: true } },
            variation: { select: { id: true, sku: true, variationImage: true } },
            returnOrder: { select: { id: true, status: true, returnReason: true } },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(serializeOrder(order));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
