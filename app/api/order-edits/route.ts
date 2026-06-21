import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderMasterId, reason, items } = await req.json();
    if (!orderMasterId || !reason || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = parseInt(session.user.id as string);

    const orderEdit = await prisma.orderEdit.create({
      data: {
        orderMasterId: parseInt(orderMasterId),
        editedBy: userId,
        reason,
        items: {
          create: items.map((item: any) => ({
            orderDetailId: parseInt(item.orderDetailId),
            originalQty:   parseInt(item.originalQty),
            newQty:        parseInt(item.newQty),
            originalPrice: parseFloat(item.originalPrice),
            newPrice:      parseFloat(item.newPrice),
          })),
        },
      },
      include: { items: { include: { orderDetail: true } } },
    });

    return NextResponse.json(orderEdit, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create order edit" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const edits = await prisma.orderEdit.findMany({
      where: orderId ? { orderMasterId: parseInt(orderId) } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        editedByUser: { select: { id: true, name: true } },
        items: { include: { orderDetail: { select: { productName: true, sku: true } } } },
      },
    });
    return NextResponse.json(edits);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
