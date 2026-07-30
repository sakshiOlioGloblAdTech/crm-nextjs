import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  storeJson,
  handleOptions,
  storeProductInclude,
  shapeProductCard,
} from "@/lib/store";

export const OPTIONS = handleOptions;

// GET /api/store/blogs/:slug — a single published post (full body)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const b = await prisma.blog.findFirst({
      where: { slug, status: "published" },
    });
    if (!b) return storeJson({ error: "Blog not found" }, 404);

    // Resolve the featured product slugs to storefront cards (active only),
    // preserving the author's order. Shown as "Buy Now" cards on the post.
    const slugs = Array.isArray(b.products) ? (b.products as string[]) : [];
    let products: ReturnType<typeof shapeProductCard>[] = [];
    if (slugs.length) {
      const rows = await prisma.product.findMany({
        where: { urlSlug: { in: slugs }, status: true },
        include: storeProductInclude,
      });
      const cards = rows.map(shapeProductCard);
      const bySlug = new Map(cards.map((c) => [c.id, c]));
      products = slugs.map((s) => bySlug.get(s)).filter(Boolean) as typeof cards;
    }

    return storeJson({
      blog: {
        id: b.slug,
        title: b.title,
        slug: b.slug,
        excerpt: b.excerpt ?? null,
        content: b.content ?? "",
        image: b.image ?? null,
        altTag: b.altTag ?? null,
        author: b.author ?? null,
        category: b.category ?? null,
        readTime: b.readTime ?? null,
        publishedAt: b.publishedAt ?? b.createdAt,
        metaTitle: b.metaTitle ?? null,
        metaDescription: b.metaDescription ?? null,
        products,
      },
    });
  } catch (error) {
    console.error("GET /api/store/blogs/[slug] failed", error);
    return storeJson({ error: "Failed to load blog" }, 500);
  }
}
