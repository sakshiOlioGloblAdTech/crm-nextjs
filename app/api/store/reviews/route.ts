import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

const schema = z.object({
  productSlug: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(1),
});

/** POST /api/store/reviews — submit a product review (signed-in customers). */
export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) return storeJson({ error: "Not signed in" }, 401);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return storeJson({ error: "Invalid review." }, 400);
    const { productSlug, rating, title, body } = parsed.data;

    const product = await prisma.product.findFirst({
      where: { OR: [{ urlSlug: productSlug }, { productId: productSlug }] },
      select: { id: true },
    });
    if (!product) return storeJson({ error: "Product not found." }, 404);

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        rating,
        title,
        body,
      },
    });
    return storeJson({ ok: true, id: review.id });
  } catch (error) {
    console.error("POST /api/store/reviews failed", error);
    return storeJson({ error: "Could not submit your review." }, 500);
  }
}
