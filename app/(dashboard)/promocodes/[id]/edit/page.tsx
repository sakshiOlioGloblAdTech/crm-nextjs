import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromoForm from "@/components/shared/PromoForm";

export default async function EditPromoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promo = await prisma.promocode.findUnique({ where: { id: parseInt(id) } });
  if (!promo) notFound();
  return <PromoForm mode="edit" initial={promo} />;
}
