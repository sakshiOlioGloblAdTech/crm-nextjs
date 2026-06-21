import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ShipmentStatus } from "@prisma/client";

export async function GET(_: NextRequest, { params }: { params: Promise<{ orderDetailId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orderDetailId } = await params;
    const shipment = await prisma.shipment.findUnique({
      where: { orderDetailId: parseInt(orderDetailId) },
      include: { trackingEvents: { orderBy: { eventTime: "desc" } } },
    });
    return NextResponse.json(shipment ?? null);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orderDetailId: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orderDetailId } = await params;
    const { status, location, description } = await req.json();

    const statusDateMap: Record<string, any> = {
      PICKED_UP:        { pickedUpAt: new Date() },
      IN_TRANSIT:       { shippedAt: new Date() },
      OUT_FOR_DELIVERY: { outForDeliveryAt: new Date() },
      DELIVERED:        { deliveredAt: new Date() },
    };

    const shipment = await prisma.shipment.update({
      where: { orderDetailId: parseInt(orderDetailId) },
      data: {
        currentStatus: status as ShipmentStatus,
        ...statusDateMap[status],
        trackingEvents: {
          create: { status, location, description, eventTime: new Date() },
        },
      },
      include: { trackingEvents: { orderBy: { eventTime: "desc" } } },
    });
    return NextResponse.json(shipment);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
