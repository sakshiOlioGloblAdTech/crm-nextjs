import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const template = await prisma.notificationTemplate.update({
      where: { id: parseInt(id) },
      data: { subject: body.subject, emailBody: body.emailBody, smsBody: body.smsBody, isActive: body.isActive },
    });
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
