import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlogForm from "@/components/shared/BlogForm";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
  if (!blog) notFound();

  const safe = {
    id: blog.id,
    title: blog.title,
    excerpt: blog.excerpt ?? "",
    content: blog.content ?? "",
    image: blog.image ?? "",
    altTag: blog.altTag ?? "",
    author: blog.author ?? "",
    category: blog.category ?? "",
    readTime: blog.readTime ?? "",
    status: blog.status,
    metaTitle: blog.metaTitle ?? "",
    metaDescription: blog.metaDescription ?? "",
    metaKeywords: blog.metaKeywords ?? "",
  };

  return <BlogForm mode="edit" initial={safe} />;
}
