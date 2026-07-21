import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  storeJson,
  handleOptions,
  storeProductInclude,
  shapeProductCard,
} from "@/lib/store";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

/** DELETE /api/store/wishlist/:slug — remove a saved product. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);

  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ urlSlug: slug }, { productId: slug }] },
    select: { id: true },
  });

  if (product) {
    await prisma.wishlist.deleteMany({
      where: { customerId: customer.id, productId: product.id },
    });
  }

  const rows = await prisma.wishlist.findMany({
    where: { customerId: customer.id },
    include: { product: { include: storeProductInclude } },
    orderBy: { createdAt: "desc" },
  });
  return storeJson({ items: rows.map((r) => shapeProductCard(r.product)) });
}
