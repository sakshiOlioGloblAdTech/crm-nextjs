import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { status } = await req.json();

    const edit = await prisma.orderEdit.update({
      where: { id: parseInt(id) },
      data: {
        status,
        confirmedAt: status === "CONFIRMED" ? new Date() : null,
        cancelledAt: status === "CANCELLED" ? new Date() : null,
      },
    });

    // If confirmed — apply qty changes to actual order details
    if (status === "CONFIRMED") {
      const fullEdit = await prisma.orderEdit.findUnique({
        where: { id: parseInt(id) },
        include: { items: true },
      });
      for (const item of fullEdit?.items ?? []) {
        await prisma.orderDetail.update({
          where: { id: item.orderDetailId },
          data: { quantity: item.newQty, total: item.newPrice },
        });
      }
    }

    return NextResponse.json(edit);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
