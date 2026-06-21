import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.$queryRaw`DELETE FROM product_tags WHERE id=${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { name, color } = await req.json();
    const result = await prisma.$queryRaw`
      UPDATE product_tags SET name=${name}, color=${color}, "updatedAt"=NOW()
      WHERE id=${parseInt(id)} RETURNING *
    `;
    return NextResponse.json((result as any[])[0]);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}