import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/blogs — list all blog posts (admin)
export async function GET() {
  try {
    const blogs = await prisma.blog.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(blogs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

// POST /api/blogs — create a blog post
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      title, excerpt, content, image, altTag, author, category,
      readTime, status, metaTitle, metaDescription, metaKeywords,
    } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const published = status === "published";
    const blog = await prisma.blog.create({
      data: {
        title,
        slug: slugify(title),
        excerpt, content, image, altTag, author, category, readTime,
        status: published ? "published" : "draft",
        publishedAt: published ? new Date() : null,
        metaTitle, metaDescription, metaKeywords,
      },
    });
    return NextResponse.json(blog, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A blog with this title already exists" }, { status: 400 });
    }
    console.error("POST /api/blogs failed", error);
    return NextResponse.json(
      { error: "Failed to create blog", detail: String(error?.message ?? error), code: error?.code },
      { status: 500 },
    );
  }
}
