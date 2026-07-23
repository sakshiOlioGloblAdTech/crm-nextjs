import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * Temporary diagnostic: attempts a blog create+delete on the deployed instance
 * and returns the real error if it fails. Protected by CRON_SECRET. Remove once
 * the blog-create issue is resolved.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") ??
    new URL(req.url).searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const title = "Diag Blog " + Math.random().toString(36).slice(2, 8);
  // Full form-shaped payload (matches BlogForm / POST /api/blogs).
  const status = "published";
  const published = status === "published";
  try {
    const blog = await prisma.blog.create({
      data: {
        title,
        slug: slugify(title),
        excerpt: "A short excerpt.",
        content: "## Heading\n\nA paragraph with an em–dash and \"quotes\".\n\n- one\n- two",
        image: "",
        altTag: "",
        author: "Team Plattera",
        category: "Test",
        readTime: "5 mins read",
        status: published ? "published" : "draft",
        publishedAt: published ? new Date() : null,
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
      },
    });
    await prisma.blog.delete({ where: { id: blog.id } });
    return NextResponse.json({ ok: true, createdId: blog.id, slug: slugify(title) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message, code: e?.code, meta: e?.meta, name: e?.name },
      { status: 500 },
    );
  }
}
