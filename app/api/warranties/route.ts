import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")  ?? "1");
    const limit  = parseInt(searchParams.get("limit") ?? "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";

    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { fullName:    { contains: search, mode: "insensitive" } },
      { email:       { contains: search, mode: "insensitive" } },
      { orderNumber: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];

    const [warranties, total] = await Promise.all([
      prisma.warrantyClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.warrantyClaim.count({ where }),
    ]);

    return NextResponse.json({
      warranties, total, page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch warranties" }, { status: 500 });
  }
}
