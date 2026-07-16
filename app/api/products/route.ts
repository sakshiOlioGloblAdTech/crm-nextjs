import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const subcategoryId = searchParams.get("subcategoryId");

    const where: any = {};
    if (search) where.productName = { contains: search, mode: "insensitive" };
    if (status !== null && status !== "") where.status = status === "true";
    if (subcategoryId) where.subcategoryId = parseInt(subcategoryId);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          subcategory: {
            include: { category: { select: { id: true, name: true } } },
          },
          variations: { orderBy: { orderSort: "asc" } },
          _count: { select: { variations: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      subcategoryId, productName, urlSlug, productId,
      images, shortDescription, description, altTag,
      metaTitle, metaDescription, metaKeywords, productSchema,
      isFeatured, status, isNew, isBestSeller, variations,
      personalizationEnabled, personalizationPrice,
    } = body;

    if (!subcategoryId || !productName) {
      return NextResponse.json({ error: "Subcategory and product name are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        subcategoryId: parseInt(subcategoryId),
        productName, urlSlug, productId,
        images: images ?? [],
        shortDescription, description, altTag,
        metaTitle, metaDescription, metaKeywords, productSchema,
        isFeatured: isFeatured ?? false,
        status: status ?? false,
        isNew: isNew ?? false,
        isBestSeller: isBestSeller ?? false,
        personalizationEnabled: personalizationEnabled ?? false,
        personalizationPrice:
          personalizationPrice === "" || personalizationPrice == null
            ? null
            : parseFloat(personalizationPrice),
        variations: variations?.length
          ? {
            create: variations.map((v: any, i: number) => ({
              sku: v.sku,
              price: parseFloat(v.price),
              specialPrice: v.specialPrice ? parseFloat(v.specialPrice) : null,
              stock: parseInt(v.stock),
              variationImage: v.variationImage ?? null,
              weightUnit: v.weightUnit ?? "kg",
              weight: parseFloat(v.weight) || 0,
              dimensionUnit: v.dimensionUnit ?? "cm",
              length: parseFloat(v.length) || 0,
              width: parseFloat(v.width) || 0,
              height: parseFloat(v.height) || 0,
              orderSort: i,
            })),
          }
          : undefined,
      },
      include: { variations: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create product" }, { status: 500 });
  }
}
