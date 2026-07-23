import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import {
  shapeCartItem,
  cartRowInclude,
  CART_MAX_PER_ITEM,
} from "@/lib/store-cart";

export const OPTIONS = handleOptions;

const schema = z.object({ guestToken: z.string().min(1) });

/**
 * POST /api/store/cart/merge — fold a guest cart into the signed-in customer's
 * cart. Plain lines merge quantities; personalized lines carry over as-is.
 */
export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) return storeJson({ error: "Not signed in" }, 401);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return storeJson({ error: "Missing guest token." }, 400);

    const guestRows = await prisma.cart.findMany({
      where: { guestToken: parsed.data.guestToken },
    });

    for (const g of guestRows) {
      const plain = g.personalization == null;
      const match = plain
        ? await prisma.cart.findFirst({
            where: {
              customerId: customer.id,
              productId: g.productId,
              variationId: g.variationId,
              personalization: { equals: Prisma.DbNull },
            },
          })
        : null;

      if (match) {
        await prisma.cart.update({
          where: { id: match.id },
          data: {
            quantity: Math.min(match.quantity + g.quantity, CART_MAX_PER_ITEM),
          },
        });
        await prisma.cart.delete({ where: { id: g.id } });
      } else {
        await prisma.cart.update({
          where: { id: g.id },
          data: { customerId: customer.id, guestToken: null },
        });
      }
    }

    const rows = await prisma.cart.findMany({
      where: { customerId: customer.id },
      include: cartRowInclude,
      orderBy: { createdAt: "asc" },
    });
    return storeJson({ items: rows.map(shapeCartItem) });
  } catch (error) {
    console.error("POST /api/store/cart/merge failed", error);
    return storeJson({ error: "Could not merge cart." }, 500);
  }
}
