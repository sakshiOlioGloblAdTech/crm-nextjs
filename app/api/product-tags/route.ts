import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const tags = await prisma.$queryRaw`
      SELECT pt.*, COUNT(ptm.id)::int as product_count
      FROM product_tags pt
      LEFT JOIN product_tag_maps ptm ON pt.id = ptm."tagId"
      GROUP BY pt.id
      ORDER BY pt.name ASC
    `;
    return NextResponse.json(tags);
  } catch (e: any) {
    console.error("Product tags error:", e?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const result = await prisma.$queryRaw`
      INSERT INTO product_tags (name, slug, color, "createdAt", "updatedAt")
      VALUES (${name}, ${slugify(name)}, ${color ?? "#6B7280"}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json((result as any[])[0], { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes("unique")) return NextResponse.json({ error: "Tag already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}