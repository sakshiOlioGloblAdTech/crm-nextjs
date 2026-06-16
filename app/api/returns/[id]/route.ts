import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReturnStatus } from "@prisma/client";

function serialize(r: any) {
  return {
    ...r,
    refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
    orderDetail: r.orderDetail ? {
      ...r.orderDetail,
      unitPrice:    Number(r.orderDetail.unitPrice),
      priceWithGst: Number(r.orderDetail.priceWithGst),
      total:        Number(r.orderDetail.total),
    } : null,
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ret = await prisma.returnOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer:    { select: { id: true, name: true, email: true, mobileNumber: true } },
        orderDetail: {
          include: {
            orderMaster: {
              select: { id: true, orderNumber: true, grandtotal: true, paymentMode: true },
            },
          },
        },
      },
    });
    if (!ret) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serialize(ret));
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch return" }, { status: 500 });
  }
}

// PUT /api/returns/:id  — approve / reject / complete
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }                    = await params;
    const { status, refundAmount }  = await req.json();

    if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

    const updateData: any = { status: status as ReturnStatus };
    if (status === "APPROVED") updateData.returnAcceptedDate = new Date();
    if (refundAmount)          updateData.refundAmount = parseFloat(refundAmount);

    const updated = await prisma.returnOrder.update({
      where: { id: parseInt(id) },
      data:  updateData,
    });

    // If approved → also update order detail status to REFUNDED
    if (status === "COMPLETED") {
      await prisma.orderDetail.update({
        where: { id: updated.orderDetailId },
        data:  { orderStatus: "REFUNDED", refundDate: new Date(),
                 refundAmount: refundAmount ? parseInt(refundAmount) : null },
      });
    }

    return NextResponse.json({ success: true, status: updated.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update return" }, { status: 500 });
  }
}
