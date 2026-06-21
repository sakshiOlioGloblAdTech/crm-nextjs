import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { name, rate, type, categoryId, description, isDefault, status } = await req.json();

    const result = await prisma.$queryRaw`
      UPDATE tax_rules
      SET name=${name}, rate=${parseFloat(rate)}, type=${type},
          "categoryId"=${categoryId ? parseInt(categoryId) : null},
          description=${description ?? null},
          "isDefault"=${isDefault ?? false},
          status=${status ?? true},
          "updatedAt"=NOW()
      WHERE id=${parseInt(id)}
      RETURNING *
    `;
    return NextResponse.json((result as any[])[0]);
  } catch (e: any) {
    console.error(e?.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.$queryRaw`DELETE FROM tax_rules WHERE id=${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e?.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}