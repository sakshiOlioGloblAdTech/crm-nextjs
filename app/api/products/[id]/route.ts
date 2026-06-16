import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        subcategory: { include: { category: true } },
        variations: {
          orderBy: { orderSort: "asc" },
          include: { attributeValues: { include: { attribute: true } } },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      subcategoryId, productName, urlSlug, productId,
      images, shortDescription, description, altTag,
      metaTitle, metaDescription, metaKeywords, productSchema,
      isFeatured, status, isNew, isBestSeller,
    } = body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        subcategoryId: parseInt(subcategoryId),
        productName, urlSlug, productId,
        images: images ?? [],
        shortDescription, description, altTag,
        metaTitle, metaDescription, metaKeywords, productSchema,
        isFeatured, status, isNew, isBestSeller,
      },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
