import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const attributes = await prisma.attribute.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(attributes);
  } catch {
    return NextResponse.json({ error: "Failed to fetch attributes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const attribute = await prisma.attribute.create({ data: { name: body.name, type: body.type } });
    return NextResponse.json(attribute, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create attribute" }, { status: 500 });
  }
}
