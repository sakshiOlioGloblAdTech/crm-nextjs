import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/shared/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id: parseInt(id) } });
  if (!category) notFound();

  // Convert all values to plain types
  const safe = {
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    image: category.image ?? "",
    altTag: category.altTag ?? "",
    metaTitle: category.metaTitle ?? "",
    metaDescription: category.metaDescription ?? "",
    metaKeywords: category.metaKeywords ?? "",
    isFeatured: category.isFeatured,
    status: category.status,
    hsnCode: category.hsnCode ?? "",
    gst: category.gst ? Number(category.gst) : null,
  };

  return <CategoryForm mode="edit" initial={safe} />;
}