import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SubCategoryForm from "@/components/shared/SubCategoryForm";

export default async function EditSubCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await prisma.subCategory.findUnique({ where: { id: parseInt(id) } });
  if (!sub) notFound();
  return <SubCategoryForm mode="edit" initial={{ ...sub, categoryId: sub.categoryId }} />;
}
