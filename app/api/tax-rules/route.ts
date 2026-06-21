import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules = await prisma.$queryRaw`
      SELECT tr.*, c.name as category_name
      FROM tax_rules tr
      LEFT JOIN categories c ON tr."categoryId" = c.id
      ORDER BY tr."createdAt" DESC
    `;
    return NextResponse.json(rules);
  } catch (e: any) {
    console.error("Tax rules error:", e?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, rate, type, categoryId, description, isDefault, status } = await req.json();

    const result = await prisma.$queryRaw`
      INSERT INTO tax_rules (name, rate, type, "categoryId", description, "isDefault", status, "createdAt", "updatedAt")
      VALUES (
        ${name},
        ${parseFloat(rate)},
        ${type ?? "GLOBAL"},
        ${categoryId ? parseInt(categoryId) : null},
        ${description ?? null},
        ${isDefault ?? false},
        ${status ?? true},
        NOW(), NOW()
      )
      RETURNING *
    `;
    return NextResponse.json((result as any[])[0], { status: 201 });
  } catch (e: any) {
    console.error("Tax rules POST error:", e?.message);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}