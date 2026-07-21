import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  storeJson,
  handleOptions,
  storeProductInclude,
  shapeProductCard,
} from "@/lib/store";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

/** The customer's wishlist as storefront product cards. */
async function listWishlist(customerId: number) {
  const rows = await prisma.wishlist.findMany({
    where: { customerId },
    include: { product: { include: storeProductInclude } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => shapeProductCard(r.product));
}

/** GET /api/store/wishlist — the signed-in customer's saved products. */
export async function GET(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);
  return storeJson({ items: await listWishlist(customer.id) });
}

const schema = z.object({ productSlug: z.string().min(1) });

/** POST /api/store/wishlist — save a product (idempotent). */
export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) return storeJson({ error: "Not signed in" }, 401);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return storeJson({ error: "Invalid product." }, 400);

    const product = await prisma.product.findFirst({
      where: {
        status: true,
        OR: [
          { urlSlug: parsed.data.productSlug },
          { productId: parsed.data.productSlug },
        ],
      },
      select: { id: true },
    });
    if (!product) return storeJson({ error: "Product not available." }, 404);

    const existing = await prisma.wishlist.findFirst({
      where: { customerId: customer.id, productId: product.id },
    });
    if (!existing) {
      await prisma.wishlist.create({
        data: { customerId: customer.id, productId: product.id },
      });
    }

    return storeJson({ items: await listWishlist(customer.id) });
  } catch (error) {
    console.error("POST /api/store/wishlist failed", error);
    return storeJson({ error: "Could not update wishlist." }, 500);
  }
}
