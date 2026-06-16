import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");

    const where: any = {};
    if (search) where.OR = [
      { promocode:        { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
    if (status !== null && status !== "") where.status = status === "true";

    const promocodes = await prisma.promocode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { customerPromocodes: true } },
      },
    });
    return NextResponse.json(promocodes);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch promocodes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      promocode, shortDescription, description,
      discountType, discount, maximumCap,
      startDate, expiryDate, useTime,
      isFirstOrder, isProduct, isSubcategory,
      status, productIds, subCategoryIds,
    } = body;

    if (!promocode || !shortDescription || !discountType || !discount || !startDate || !expiryDate) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const created = await prisma.promocode.create({
      data: {
        promocode, shortDescription, description,
        discountType:  parseInt(discountType),
        discount:      parseFloat(discount),
        maximumCap:    parseInt(maximumCap ?? "0"),
        startDate:     new Date(startDate),
        expiryDate:    new Date(expiryDate),
        useTime:       parseInt(useTime ?? "2"),
        isFirstOrder:  isFirstOrder ?? false,
        isProduct:     isProduct    ?? false,
        isSubcategory: isSubcategory ?? false,
        status:        status ?? false,
        productPromocodes: productIds?.length ? {
          create: productIds.map((pid: number) => ({ productId: pid })),
        } : undefined,
        subcategoryPromocodes: subCategoryIds?.length ? {
          create: subCategoryIds.map((sid: number) => ({ subCategoryId: sid })),
        } : undefined,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to create" }, { status: 500 });
  }
}
