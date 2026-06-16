import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/shared/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      variations: { orderBy: { orderSort: "asc" } },
    },
  });
  if (!product) notFound();

  // Convert Decimal to plain number so React doesn't complain
  const safe = {
    ...product,
    variations: product.variations.map((v) => ({
      ...v,
      price: Number(v.price),
      specialPrice: v.specialPrice ? Number(v.specialPrice) : null,
      weight: Number(v.weight),
      length: Number(v.length),
      width: Number(v.width),
      height: Number(v.height),
    })),
  };

  return <ProductForm mode="edit" initial={safe} />;
}