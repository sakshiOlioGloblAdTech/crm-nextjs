import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orderDetailId, awbNumber, courierName, courierCode, trackingUrl, estimatedDelivery } = await req.json();
    if (!orderDetailId) return NextResponse.json({ error: "orderDetailId required" }, { status: 400 });

    const shipment = await prisma.shipment.upsert({
      where: { orderDetailId: parseInt(orderDetailId) },
      update: { awbNumber, courierName, courierCode, trackingUrl,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        currentStatus: "PICKED_UP", pickedUpAt: new Date(),
      },
      create: { orderDetailId: parseInt(orderDetailId), awbNumber, courierName,
        courierCode, trackingUrl,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        currentStatus: "PICKED_UP", pickedUpAt: new Date(),
      },
    });

    // Also update order detail with awb
    await prisma.orderDetail.update({
      where: { id: parseInt(orderDetailId) },
      data: { awbNumber, courierName, labelUrl: trackingUrl,
        estimatedDeliveryDate: estimatedDelivery ? new Date(estimatedDelivery) : null,
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
