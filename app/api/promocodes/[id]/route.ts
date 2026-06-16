import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const promo = await prisma.promocode.findUnique({
      where: { id: parseInt(id) },
      include: {
        productPromocodes:     { include: { product: { select: { id: true, productName: true } } } },
        subcategoryPromocodes: { include: { subCategory: { select: { id: true, name: true } } } },
        customerPromocodes:    { select: { id: true, status: true, customer: { select: { id: true, name: true } } } },
      },
    });
    if (!promo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(promo);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const {
      promocode, shortDescription, description,
      discountType, discount, maximumCap,
      startDate, expiryDate, useTime,
      isFirstOrder, isProduct, isSubcategory, status,
    } = body;

    const updated = await prisma.promocode.update({
      where: { id: parseInt(id) },
      data: {
        promocode, shortDescription, description,
        discountType:  parseInt(discountType),
        discount:      parseFloat(discount),
        maximumCap:    parseInt(maximumCap ?? "0"),
        startDate:     new Date(startDate),
        expiryDate:    new Date(expiryDate),
        useTime:       parseInt(useTime ?? "2"),
        isFirstOrder, isProduct, isSubcategory, status,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.promocode.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
