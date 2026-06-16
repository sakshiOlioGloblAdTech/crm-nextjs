import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let settings = await prisma.setting.findFirst();
    if (!settings) settings = await prisma.setting.create({ data: {} });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { email, email2, email3, deliveryFee, defaultDeliveryFee } = body;
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: { email, email2, email3, deliveryFee: parseFloat(deliveryFee ?? "0"), defaultDeliveryFee: parseFloat(defaultDeliveryFee ?? "0") } });
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: { email, email2, email3, deliveryFee: parseFloat(deliveryFee ?? "0"), defaultDeliveryFee: parseFloat(defaultDeliveryFee ?? "0") },
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
