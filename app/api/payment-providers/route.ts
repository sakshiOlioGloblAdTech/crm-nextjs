import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const providers = await prisma.$queryRaw`
      SELECT * FROM payment_providers ORDER BY name ASC
    `;
    return NextResponse.json(providers);
  } catch (e: any) {
    console.error("Payment providers error:", e?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, displayName, isActive, isDefault, config, description } = await req.json();
    const result = await prisma.$queryRaw`
      INSERT INTO payment_providers (name, "displayName", "isActive", "isDefault", config, description, "createdAt", "updatedAt")
      VALUES (${name}, ${displayName}, ${isActive}, ${isDefault}, ${JSON.stringify(config)}::jsonb, ${description ?? null}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json((result as any[])[0], { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes("unique")) return NextResponse.json({ error: "Provider already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}