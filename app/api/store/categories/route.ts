import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";

export const OPTIONS = handleOptions;

/**
 * GET /api/store/categories
 * Active categories with their active subcategories — drives the storefront
 * nav dropdowns and listing filters.
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
      include: {
        subCategories: {
          where: { status: true },
          orderBy: { name: "asc" },
        },
      },
    });

    const shaped = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      isFeatured: c.isFeatured,
      subcategories: c.subCategories.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        image: s.image,
      })),
    }));

    return storeJson({ categories: shaped });
  } catch (error) {
    console.error("GET /api/store/categories failed", error);
    return storeJson({ error: "Failed to load categories" }, 500);
  }
}
