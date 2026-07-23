import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/blogs/:id
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch {
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 });
  }
}

// PUT /api/blogs/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      title, excerpt, content, image, altTag, author, category,
      readTime, status, metaTitle, metaDescription, metaKeywords,
    } = body;

    const existing = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const published = status === "published";
    // Stamp publishedAt the first time it goes live; keep it once set.
    const publishedAt = published ? existing.publishedAt ?? new Date() : null;

    const blog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug: title ? slugify(title) : existing.slug,
        excerpt, content, image, altTag, author, category, readTime,
        status: published ? "published" : "draft",
        publishedAt,
        metaTitle, metaDescription, metaKeywords,
      },
    });
    return NextResponse.json(blog);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A blog with this title already exists" }, { status: 400 });
    }
    console.error("PUT /api/blogs/[id] failed", error);
    return NextResponse.json(
      { error: "Could not update the blog. Please try again." },
      { status: 500 },
    );
  }
}

// DELETE /api/blogs/:id
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.blog.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}
