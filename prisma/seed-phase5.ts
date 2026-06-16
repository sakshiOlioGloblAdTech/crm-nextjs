/**
 * Seeds dummy promo codes and banners for Phase 5 testing.
 * Run: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed-phase5.ts
 */
import * as dotenv from "dotenv";
dotenv.config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const promos = [
    { promocode: "WELCOME10", shortDescription: "10% off on first order", discountType: 1, discount: 10, maximumCap: 200, startDate: new Date("2026-01-01"), expiryDate: new Date("2026-12-31"), useTime: 1, isFirstOrder: true, status: true },
    { promocode: "SAVE20",    shortDescription: "Flat 20% off sitewide",  discountType: 1, discount: 20, maximumCap: 500, startDate: new Date("2026-01-01"), expiryDate: new Date("2026-12-31"), useTime: 2, status: true },
    { promocode: "FLAT100",   shortDescription: "₹100 off on all orders", discountType: 2, discount: 100, maximumCap: 100, startDate: new Date("2026-01-01"), expiryDate: new Date("2026-06-30"), useTime: 2, status: true },
    { promocode: "EXPIRED50", shortDescription: "50% off — expired code", discountType: 1, discount: 50, maximumCap: 300, startDate: new Date("2025-01-01"), expiryDate: new Date("2025-12-31"), useTime: 2, status: false },
  ];

  for (const p of promos) {
    await prisma.promocode.upsert({
      where: { id: (await prisma.promocode.findFirst({ where: { promocode: p.promocode } }))?.id ?? 0 },
      update: {},
      create: p,
    });
    console.log(`✅ Promo: ${p.promocode}`);
  }

  const banners = [
    { bannerImg: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", title: "Premium Cookware", description: "Discover our best-in-class cookware collection", btnText: "Shop Now" },
    { bannerImg: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800", title: "Up to 40% Off",    description: "Limited time offer on selected products",          btnText: "View Deals" },
  ];

  for (const b of banners) {
    await prisma.homeBanner.create({ data: b });
    console.log(`✅ Banner: ${b.title}`);
  }

  console.log("\n✅ Phase 5 seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
