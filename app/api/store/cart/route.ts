import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import {
  resolveCartOwner,
  ownerWhere,
  shapeCartItem,
  cartRowInclude,
  resolveProductVariation,
  CART_MAX_PER_ITEM,
} from "@/lib/store-cart";

export const OPTIONS = handleOptions;

/** GET /api/store/cart — the current owner's cart (customer or guest). */
export async function GET(req: NextRequest) {
  const owner = await resolveCartOwner(req);
  if (!owner) return storeJson({ items: [] });

  const rows = await prisma.cart.findMany({
    where: ownerWhere(owner),
    include: cartRowInclude,
    orderBy: { createdAt: "asc" },
  });
  return storeJson({ items: rows.map(shapeCartItem) });
}

const addSchema = z.object({
  productSlug: z.string().min(1),
  variationId: z.number().int().optional(),
  quantity: z.number().int().min(1).max(CART_MAX_PER_ITEM).default(1),
  personalization: z
    .object({
      text: z.string().optional(),
      font: z.string().optional(),
      image: z.string().optional(),
      fee: z.number().optional(),
    })
    .nullish(),
});

/** POST /api/store/cart — add an item (increments a matching line). */
export async function POST(req: NextRequest) {
  try {
    const owner = await resolveCartOwner(req);
    if (!owner) {
      return storeJson({ error: "No cart session." }, 400);
    }

    const parsed = addSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return storeJson({ error: "Invalid cart item." }, 400);
    }
    const { productSlug, variationId, quantity, personalization } = parsed.data;

    const resolved = await resolveProductVariation(productSlug, variationId);
    if (!resolved) {
      return storeJson({ error: "Product not available." }, 404);
    }

    const hasPersonalization = Boolean(
      personalization && (personalization.text || personalization.image),
    );

    // Personalized lines are always unique; plain lines increment an existing
    // matching row.
    const existing = hasPersonalization
      ? null
      : await prisma.cart.findFirst({
          where: {
            ...ownerWhere(owner),
            productId: resolved.product.id,
            variationId: resolved.variation.id,
            // Plain lines store SQL NULL; DbNull matches it ({ equals: null }
            // looks for a JSON null value and never matches, causing duplicates).
            personalization: { equals: Prisma.DbNull },
          },
        });

    if (existing) {
      await prisma.cart.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min(existing.quantity + quantity, CART_MAX_PER_ITEM),
        },
      });
    } else {
      await prisma.cart.create({
        data: {
          ...ownerWhere(owner),
          productId: resolved.product.id,
          variationId: resolved.variation.id,
          quantity,
          personalization: hasPersonalization
            ? (personalization as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });
    }

    const rows = await prisma.cart.findMany({
      where: ownerWhere(owner),
      include: cartRowInclude,
      orderBy: { createdAt: "asc" },
    });
    return storeJson({ items: rows.map(shapeCartItem) });
  } catch (error) {
    console.error("POST /api/store/cart failed", error);
    return storeJson({ error: "Could not add to cart." }, 500);
  }
}
