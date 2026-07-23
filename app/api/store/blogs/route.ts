import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";

export const OPTIONS = handleOptions;

/** Shape a blog for storefront cards / listing (no heavy body). */
function shapeCard(b: any) {
  return {
    id: b.slug,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt ?? null,
    image: b.image ?? null,
    author: b.author ?? null,
    category: b.category ?? null,
    readTime: b.readTime ?? null,
    publishedAt: b.publishedAt ?? b.createdAt,
  };
}

// GET /api/store/blogs — published posts, newest first
export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return storeJson({ blogs: blogs.map(shapeCard) });
  } catch (error) {
    console.error("GET /api/store/blogs failed", error);
    return storeJson({ error: "Failed to load blogs" }, 500);
  }
}
