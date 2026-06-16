import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function serialize(r: any) {
  return {
    ...r,
    refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
    orderDetail: r.orderDetail ? {
      ...r.orderDetail,
      unitPrice:    Number(r.orderDetail.unitPrice),
      priceWithGst: Number(r.orderDetail.priceWithGst),
      total:        Number(r.orderDetail.total),
    } : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get("page")   ?? "1");
    const limit  = parseInt(searchParams.get("limit")  ?? "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";

    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];

    const [returns, total] = await Promise.all([
      prisma.returnOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer:    { select: { id: true, name: true, email: true } },
          orderDetail: {
            select: {
              id: true, productName: true, sku: true, quantity: true,
              unitPrice: true, priceWithGst: true, total: true, subOrderNumber: true,
            },
          },
        },
      }),
      prisma.returnOrder.count({ where }),
    ]);

    return NextResponse.json({
      returns: returns.map(serialize),
      total, page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}
