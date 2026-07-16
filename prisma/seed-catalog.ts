import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Catalogue seed — categories, subcategories, products and variations.
 *
 * The other seed files cover admin/settings/orders but never create a
 * catalogue, which is why /api/store/products returned an empty list. This
 * mirrors the storefront's taxonomy (the 10 nav categories) and its demo
 * products, so the site can be wired to the live API 1:1 and swapped for the
 * client's real Excel data later.
 *
 * Idempotent: categories/subcategories upsert by slug, products are skipped if
 * their urlSlug already exists.
 *
 * Run:  npx ts-node prisma/seed-catalog.ts
 */

// category name -> its single subcategory name
const CATEGORIES: { name: string; slug: string; sub: string; subSlug: string }[] = [
  { name: "Hampers & Gift Boxes", slug: "hampers-gift-boxes", sub: "Curated Hampers", subSlug: "curated-hampers" },
  { name: "Awards & Recognition", slug: "awards-recognition", sub: "Trophies & Plaques", subSlug: "trophies-plaques" },
  { name: "Drinkware", slug: "drinkware", sub: "Mugs & Bottles", subSlug: "mugs-bottles" },
  { name: "Leather & Accessories", slug: "leather-accessories", sub: "Leather Goods", subSlug: "leather-goods" },
  { name: "Apparel & Merch", slug: "apparel-merch", sub: "Branded Apparel", subSlug: "branded-apparel" },
  { name: "Tech & Gadgets", slug: "tech-gadgets", sub: "Desk Tech", subSlug: "desk-tech" },
  { name: "Gourmet & Edibles", slug: "gourmet-edibles", sub: "Gourmet Treats", subSlug: "gourmet-treats" },
  { name: "Stationery & Notebooks", slug: "stationery-notebooks", sub: "Journals & Diaries", subSlug: "journals-diaries" },
  { name: "Eco-Friendly / Sustainable", slug: "eco-friendly-sustainable", sub: "Sustainable Picks", subSlug: "sustainable-picks" },
  { name: "Plants & Wellness", slug: "plants-wellness", sub: "Wellness Kits", subSlug: "wellness-kits" },
];

interface ProductSeed {
  name: string;
  slug: string;
  sku: string;
  subSlug: string;
  short: string;
  description: string;
  /** MRP */
  price: number;
  /** selling price (shows as the discounted price) */
  specialPrice?: number;
  stock: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  personalization?: number; // extra charge; undefined = not personalisable
}

const PRODUCTS: ProductSeed[] = [
  {
    name: "Retro Fusion Station", slug: "retro-fusion-station", sku: "PLT-RFS-001",
    subSlug: "wellness-kits",
    short: "A curated self-care hamper with wooden comb, candle & essentials.",
    description: "A thoughtfully curated hamper, hand-assembled by our gifting team. Every item is chosen to feel premium and personal — beautifully packaged and ready to gift.",
    price: 749, specialPrice: 499, stock: 120, isBestSeller: true, personalization: 99,
  },
  {
    name: "Artisan Coffee Hamper", slug: "artisan-coffee-hamper", sku: "PLT-ACH-002",
    subSlug: "gourmet-treats",
    short: "Single-origin coffees with a hand-thrown ceramic mug.",
    description: "Small-batch, single-origin coffee paired with a ceramic mug and tasting notes — a warm start to any morning.",
    price: 1599, specialPrice: 1299, stock: 80, isBestSeller: true, personalization: 149,
  },
  {
    name: "Gourmet Nut Basket", slug: "gourmet-nut-basket", sku: "PLT-GNB-003",
    subSlug: "gourmet-treats",
    short: "Hand-picked dry fruits and roasted nuts in a woven basket.",
    description: "A generous selection of premium nuts and dry fruits, presented in a reusable woven basket.",
    price: 1099, specialPrice: 899, stock: 60,
  },
  {
    name: "Wellness Retreat Box", slug: "wellness-retreat-box", sku: "PLT-WRB-004",
    subSlug: "wellness-kits",
    short: "Calming self-care essentials to unwind and recharge.",
    description: "Bath salts, a soy candle and a botanical mist — everything needed to switch off after a long week.",
    price: 2199, specialPrice: 1799, stock: 45, isFeatured: true, personalization: 99,
  },
  {
    name: "Signature Tea Collection", slug: "signature-tea-collection", sku: "PLT-STC-005",
    subSlug: "gourmet-treats",
    short: "A tasting set of estate-grown Indian teas.",
    description: "Six estate-grown teas in a keepsake tin, from Darjeeling first flush to Nilgiri green.",
    price: 1249, specialPrice: 999, stock: 90,
  },
  {
    name: "Executive Desk Kit", slug: "executive-desk-kit", sku: "PLT-EDK-006",
    subSlug: "desk-tech",
    short: "A tidy, premium desk set for the modern workspace.",
    description: "An organiser, wireless charger and pen in one considered set — form and function for a clutter-free desk.",
    price: 1899, specialPrice: 1499, stock: 40, isNew: true, personalization: 199,
  },
  {
    name: "Festive Sweets Trunk", slug: "festive-sweets-trunk", sku: "PLT-FST-007",
    subSlug: "curated-hampers",
    short: "Traditional mithai and festive treats in a keepsake trunk.",
    description: "A festive trunk of traditional sweets and dry fruits — our most reordered Diwali gift.",
    price: 1499, specialPrice: 1199, stock: 150, isBestSeller: true, personalization: 149,
  },
  {
    name: "Premium Snack Crate", slug: "premium-snack-crate", sku: "PLT-PSC-008",
    subSlug: "gourmet-treats",
    short: "Sweet and savoury gourmet snacks in a wooden crate.",
    description: "A crowd-pleasing mix of artisanal snacks packed in a reusable wooden crate.",
    price: 999, specialPrice: 799, stock: 110,
  },
  {
    name: "Custom Name Mug Hamper", slug: "custom-name-mug-hamper", sku: "PLT-CNM-009",
    subSlug: "mugs-bottles",
    short: "A ceramic mug personalised with their name.",
    description: "A premium ceramic mug printed with any name, paired with coffee and a handwritten note.",
    price: 1599, specialPrice: 1299, stock: 200, isBestSeller: true, personalization: 0,
  },
  {
    name: "Engraved Wooden Frame", slug: "engraved-wooden-frame", sku: "PLT-EWF-010",
    subSlug: "sustainable-picks",
    short: "Sustainably sourced frame, engraved with a name or date.",
    description: "A solid-wood photo frame, laser-engraved with a name, date or short message.",
    price: 1249, specialPrice: 999, stock: 70, personalization: 149,
  },
  {
    name: "Personalized Diary Set", slug: "personalized-diary-set", sku: "PLT-PDS-011",
    subSlug: "journals-diaries",
    short: "A leather-bound diary embossed with their name.",
    description: "A refined hardbound diary with an embossed name — for the note-takers and planners.",
    price: 999, specialPrice: 799, stock: 130, personalization: 99,
  },
  {
    name: "Monogram Tote & Bottle", slug: "monogram-tote-bottle", sku: "PLT-MTB-012",
    subSlug: "branded-apparel",
    short: "A canvas tote and steel bottle with their monogram.",
    description: "A heavyweight canvas tote and insulated steel bottle, monogrammed to order.",
    price: 1799, specialPrice: 1499, stock: 85, isNew: true, personalization: 199,
  },
  {
    name: "Crystal Achievement Award", slug: "crystal-achievement-award", sku: "PLT-CAA-013",
    subSlug: "trophies-plaques",
    short: "An engraved crystal award for milestones and wins.",
    description: "A weighted crystal award, engraved with the recipient's name, milestone and date.",
    price: 2999, specialPrice: 2499, stock: 35, isFeatured: true, personalization: 249,
  },
  {
    name: "Heritage Leather Folio", slug: "heritage-leather-folio", sku: "PLT-HLF-014",
    subSlug: "leather-goods",
    short: "A full-grain leather folio for documents and a tablet.",
    description: "Full-grain leather folio with a notepad slot and tablet sleeve — ages beautifully with use.",
    price: 3499, specialPrice: 2899, stock: 25, personalization: 299,
  },
];

async function main() {
  console.log("Seeding catalogue…");

  // 1. Categories + one subcategory each.
  const subIdBySlug = new Map<string, number>();

  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, status: true },
      create: { name: c.name, slug: c.slug, status: true, isFeatured: true, gst: 18 },
    });

    const sub = await prisma.subCategory.upsert({
      where: { slug: c.subSlug },
      update: { name: c.sub, categoryId: category.id, status: true },
      create: { name: c.sub, slug: c.subSlug, categoryId: category.id, status: true },
    });

    subIdBySlug.set(c.subSlug, sub.id);
  }
  console.log(`  ✓ ${CATEGORIES.length} categories + subcategories`);

  // 2. Products + one variation each (urlSlug isn't unique, so check first).
  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { urlSlug: p.slug } });
    if (exists) {
      skipped += 1;
      continue;
    }

    const subcategoryId = subIdBySlug.get(p.subSlug);
    if (!subcategoryId) {
      console.warn(`  ! no subcategory "${p.subSlug}" for ${p.name} — skipping`);
      continue;
    }

    await prisma.product.create({
      data: {
        subcategoryId,
        productName: p.name,
        urlSlug: p.slug,
        productId: p.sku,
        images: [`/products/${p.slug}-1.jpg`, `/products/${p.slug}-2.jpg`],
        shortDescription: p.short,
        description: p.description,
        status: true,
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isFeatured: p.isFeatured ?? false,
        personalizationEnabled: p.personalization !== undefined,
        personalizationPrice: p.personalization ?? null,
        variations: {
          create: [
            {
              sku: p.sku,
              price: p.price,
              specialPrice: p.specialPrice ?? null,
              stock: p.stock,
              weightUnit: "g",
              weight: 1200,
              dimensionUnit: "cm",
              length: 25,
              width: 20,
              height: 15,
              orderSort: 0,
            },
          ],
        },
      },
    });
    created += 1;
  }

  console.log(`  ✓ products: ${created} created, ${skipped} already existed`);
  console.log("✅ Catalogue seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Catalogue seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
