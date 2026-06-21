import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q            = searchParams.get("q") ?? "";
    const categoryId   = searchParams.get("categoryId");
    const subcategoryId= searchParams.get("subcategoryId");
    const minPrice     = searchParams.get("minPrice");
    const maxPrice     = searchParams.get("maxPrice");
    const inStock      = searchParams.get("inStock");
    const tags         = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const page         = parseInt(searchParams.get("page") ?? "1");
    const limit        = parseInt(searchParams.get("limit") ?? "12");
    const sort         = searchParams.get("sort") ?? "newest";

    const where: any = { status: true };

    if (q) {
      where.OR = [
        { productName:      { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { description:      { contains: q, mode: "insensitive" } },
        { productId:        { contains: q, mode: "insensitive" } },
      ];
    }

    if (subcategoryId) where.subcategoryId = parseInt(subcategoryId);
    else if (categoryId) where.subcategory = { categoryId: parseInt(categoryId) };

    if (inStock === "true") where.variations = { some: { stock: { gt: 0 } } };

    if (tags.length > 0) where.tags = { some: { tag: { slug: { in: tags } } } };

    // Price filter on variations
    if (minPrice || maxPrice) {
      where.variations = {
        ...where.variations,
        some: {
          OR: [
            { specialPrice: {
              gte: minPrice ? parseFloat(minPrice) : undefined,
              lte: maxPrice ? parseFloat(maxPrice) : undefined,
            }},
            { price: {
              gte: minPrice ? parseFloat(minPrice) : undefined,
              lte: maxPrice ? parseFloat(maxPrice) : undefined,
            }},
          ],
        },
      };
    }

    const orderBy: any =
      sort === "price_asc"  ? { variations: { _min: { price: "asc" } } } :
      sort === "price_desc" ? { variations: { _min: { price: "desc" } } } :
      sort === "name"       ? { productName: "asc" } :
      { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          subcategory: { include: { category: { select: { id: true, name: true } } } },
          variations:  { orderBy: { orderSort: "asc" }, take: 1 },
          tags:        { include: { tag: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        variations: p.variations.map((v) => ({
          ...v,
          price:        Number(v.price),
          specialPrice: v.specialPrice ? Number(v.specialPrice) : null,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
