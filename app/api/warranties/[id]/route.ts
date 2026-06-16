import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WarrantyStatus } from "@prisma/client";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const claim = await prisma.warrantyClaim.findUnique({ where: { id: parseInt(id) } });
    if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(claim);
  } catch {
    return NextResponse.json({ error: "Failed to fetch warranty" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }     = await params;
    const { status } = await req.json();

    const updated = await prisma.warrantyClaim.update({
      where: { id: parseInt(id) },
      data: {
        status: status as WarrantyStatus,
        warrantyApproved: status === "APPROVED" ? new Date() : null,
      },
    });
    return NextResponse.json({ success: true, status: updated.status });
  } catch {
    return NextResponse.json({ error: "Failed to update warranty" }, { status: 500 });
  }
}
