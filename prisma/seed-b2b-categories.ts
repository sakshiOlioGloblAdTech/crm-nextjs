import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Signed-off B2B category taxonomy — added alongside the existing categories.
const CATEGORIES = [
  "Hampers & Gift Boxes",
  "Awards & Recognition",
  "Drinkware",
  "Leather & Accessories",
  "Apparel & Merch",
  "Tech & Gadgets",
  "Gourmet & Edibles",
  "Stationery & Notebooks",
  "Eco-Friendly / Sustainable",
  "Plants & Wellness",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { status: true }, // ensure active if it already exists
      create: { name, slug, status: true },
    });
    console.log(`✓ ${cat.slug} — ${cat.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
