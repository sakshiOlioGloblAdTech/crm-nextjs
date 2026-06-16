import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ["error"],
  __internal: {
    configOverride: {
      url: process.env.DATABASE_URL,
    },
  },
} as any);

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@crm.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@crm.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      email: "admin@crm.com",
      deliveryFee: 50,
      defaultDeliveryFee: 50,
    },
  });

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Delivery time too long",
    "Product no longer needed",
  ];

  for (const reason of cancellationReasons) {
    await prisma.cancellationReason.create({
      data: { reason, status: true },
    });
  }

  const returnReasons = [
    "Defective product",
    "Wrong item delivered",
    "Product not as described",
    "Damaged during shipping",
    "Changed my mind",
  ];

  for (const reason of returnReasons) {
    await prisma.returnReason.create({
      data: { reason, status: true },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Admin: admin@crm.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());