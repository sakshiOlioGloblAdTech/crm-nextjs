import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }  = await params;
    const body    = await req.json();
    const { name, displayName, isActive, isDefault, config, description } = body;

    const result = await prisma.$queryRaw`
      UPDATE payment_providers
      SET
        "isActive"    = ${isActive},
        "isDefault"   = ${isDefault},
        "displayName" = ${displayName},
        config        = ${JSON.stringify(config ?? {})}::jsonb,
        description   = ${description ?? null},
        "updatedAt"   = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return NextResponse.json((result as any[])[0]);
  } catch (e: any) {
    console.error("Payment provider PUT error:", e?.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
