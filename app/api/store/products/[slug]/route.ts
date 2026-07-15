import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions, shapeProductDetail } from "@/lib/store";

export const OPTIONS = handleOptions;

/**
 * GET /api/store/products/[slug]
 * Full product detail for the storefront, looked up by urlSlug (falls back to
 * the productId/SKU). Only active products are returned.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: {
        status: true,
        OR: [{ urlSlug: slug }, { productId: slug }],
      },
      include: {
        variations: {
          orderBy: { orderSort: "asc" },
          include: { attributeValues: true },
        },
        subcategory: { include: { category: true } },
      },
    });

    if (!product) {
      return storeJson({ error: "Product not found" }, 404);
    }

    return storeJson({ product: shapeProductDetail(product) });
  } catch (error) {
    console.error("GET /api/store/products/[slug] failed", error);
    return storeJson({ error: "Failed to load product" }, 500);
  }
}
