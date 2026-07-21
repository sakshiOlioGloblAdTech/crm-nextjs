import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/customer-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Matches the storefront's CART_MAX_PER_ITEM. */
export const CART_MAX_PER_ITEM = 10;

export type CartOwner =
  | { customerId: number; guestToken?: undefined }
  | { customerId?: undefined; guestToken: string };

/**
 * Resolve who a cart belongs to: a signed-in customer (Bearer token) wins,
 * otherwise the guest token from the `X-Guest-Token` header. Null if neither.
 */
export async function resolveCartOwner(
  req: NextRequest,
): Promise<CartOwner | null> {
  const customer = await getCustomerFromRequest(req);
  if (customer) return { customerId: customer.id };
  const guestToken = req.headers.get("x-guest-token")?.trim();
  if (guestToken) return { guestToken };
  return null;
}

/** Prisma `where` fragment for the owner's rows. */
export function ownerWhere(owner: CartOwner) {
  return owner.customerId != null
    ? { customerId: owner.customerId }
    : { guestToken: owner.guestToken };
}

function toNumber(value: unknown): number {
  return value == null ? 0 : Number(value);
}

function firstImage(product: any, variation: any): string {
  const imgs = Array.isArray(product?.images) ? product.images : [];
  return variation?.variationImage || imgs[0] || "";
}

/** Include needed to shape a cart row for the storefront. */
export const cartRowInclude = {
  product: true,
  variation: true,
};

/** Shape a cart row (with product + variation) for the storefront. */
export function shapeCartItem(row: any) {
  const v = row.variation;
  const base = toNumber(v.specialPrice ?? v.price);
  const compareAt = v.specialPrice != null ? toNumber(v.price) : undefined;
  const personalization = (row.personalization as any) ?? null;
  const fee = personalization?.fee != null ? toNumber(personalization.fee) : 0;
  return {
    id: row.id, // cart row id
    productId: row.product.urlSlug, // storefront product id (slug)
    variationId: row.variationId,
    name: row.product.productName,
    href: `/products/${row.product.urlSlug}`,
    image: firstImage(row.product, v),
    price: base + fee, // unit price incl. personalization fee
    compareAtPrice: compareAt != null ? compareAt + fee : undefined,
    quantity: row.quantity,
    personalization,
  };
}

/**
 * Resolve a product (by urlSlug, productId fallback) and the variation to use.
 * Defaults to the first variation by orderSort when none is specified.
 */
export async function resolveProductVariation(
  productSlug: string,
  variationId?: number,
) {
  const product = await prisma.product.findFirst({
    where: {
      status: true,
      OR: [{ urlSlug: productSlug }, { productId: productSlug }],
    },
    include: { variations: { orderBy: { orderSort: "asc" } } },
  });
  if (!product || product.variations.length === 0) return null;

  const variation =
    variationId != null
      ? product.variations.find((v) => v.id === variationId)
      : product.variations[0];
  if (!variation) return null;

  return { product, variation };
}
