import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";

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
      },
    });
  } catch (error) {
    console.error("GET /api/store/blogs/[slug] failed", error);
    return storeJson({ error: "Failed to load blog" }, 500);
  }
}
