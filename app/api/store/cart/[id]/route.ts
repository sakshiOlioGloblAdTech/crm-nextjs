import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import {
  resolveCartOwner,
  ownerWhere,
  shapeCartItem,
  cartRowInclude,
  CART_MAX_PER_ITEM,
} from "@/lib/store-cart";

export const OPTIONS = handleOptions;

async function ownRow(req: NextRequest, id: number) {
  const owner = await resolveCartOwner(req);
  if (!owner) return null;
  const row = await prisma.cart.findFirst({
    where: { id, ...ownerWhere(owner) },
  });
  return row ? { owner, row } : null;
}

const patchSchema = z.object({ quantity: z.number().int().min(0) });

/** PATCH /api/store/cart/:id — set quantity (0 removes the line). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cartId = Number(id);
  if (!Number.isInteger(cartId)) return storeJson({ error: "Bad id." }, 400);

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return storeJson({ error: "Invalid quantity." }, 400);

  const found = await ownRow(req, cartId);
  if (!found) return storeJson({ error: "Item not found." }, 404);

  if (parsed.data.quantity === 0) {
    await prisma.cart.delete({ where: { id: cartId } });
  } else {
    await prisma.cart.update({
      where: { id: cartId },
      data: { quantity: Math.min(parsed.data.quantity, CART_MAX_PER_ITEM) },
    });
  }

  const rows = await prisma.cart.findMany({
    where: ownerWhere(found.owner),
    include: cartRowInclude,
    orderBy: { createdAt: "asc" },
  });
  return storeJson({ items: rows.map(shapeCartItem) });
}

/** DELETE /api/store/cart/:id — remove a line. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cartId = Number(id);
  if (!Number.isInteger(cartId)) return storeJson({ error: "Bad id." }, 400);

  const found = await ownRow(req, cartId);
  if (!found) return storeJson({ error: "Item not found." }, 404);

  await prisma.cart.delete({ where: { id: cartId } });

  const rows = await prisma.cart.findMany({
    where: ownerWhere(found.owner),
    include: cartRowInclude,
    orderBy: { createdAt: "asc" },
  });
  return storeJson({ items: rows.map(shapeCartItem) });
}
