import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")   ?? "1");
    const limit  = parseInt(searchParams.get("limit")  ?? "10");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { name:         { contains: search, mode: "insensitive" } },
        { email:        { contains: search, mode: "insensitive" } },
        { mobileNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status !== null && status !== "") where.status = status === "true";

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: "desc" },
        select: {
          id:           true,
          name:         true,
          email:        true,
          mobileNumber: true,
          gender:       true,
          status:       true,
          createdAt:    true,
          _count: {
            select: { orders: true, wishlists: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
