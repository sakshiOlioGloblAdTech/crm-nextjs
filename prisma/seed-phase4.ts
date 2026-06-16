/**
 * Seeds dummy returns and warranty claims for Phase 4 testing.
 * Run: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed-phase4.ts
 */
import * as dotenv from "dotenv";
dotenv.config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Get existing order details
  const details = await prisma.orderDetail.findMany({ take: 6, include: { orderMaster: true } });
  const customers = await prisma.customer.findMany({ take: 3 });

  if (details.length === 0) {
    console.log("❌ No orders found. Run seed-orders.ts first.");
    return;
  }

  const REASONS = ["Defective product", "Wrong item delivered", "Product not as described", "Damaged during shipping"];
  const STATUSES = ["PENDING", "APPROVED", "COMPLETED", "REJECTED", "PENDING"];

  for (let i = 0; i < Math.min(details.length, 5); i++) {
    const d = details[i];
    const existingReturn = await prisma.returnOrder.findUnique({ where: { orderDetailId: d.id } });
    if (existingReturn) continue;

    await prisma.returnOrder.create({
      data: {
        orderDetailId:     d.id,
        orderNumber:       d.orderMaster.orderNumber,
        customerId:        d.orderMaster.customerId ?? (customers[0]?.id ?? 1),
        returnedQuantity:  1,
        refundAmount:      STATUSES[i] === "COMPLETED" ? Number(d.total) : null,
        status:            STATUSES[i] as any,
        returnReason:      REASONS[i % REASONS.length],
        returnRequestDate: new Date(Date.now() - i * 86400000),
        returnAcceptedDate: ["APPROVED","COMPLETED"].includes(STATUSES[i]) ? new Date() : null,
      },
    });
    console.log(`✅ Return created for order ${d.orderMaster.orderNumber} — ${STATUSES[i]}`);
  }

  // Warranty claims
  const COOKWARE = ["Non-Stick Pan", "Kadai", "Pressure Cooker", "Tawa"];
  for (let i = 0; i < 5; i++) {
    await prisma.warrantyClaim.create({
      data: {
        purchased:    i % 2 === 0 ? "online" : "store",
        fullName:     `Customer ${i + 1}`,
        email:        `customer${i + 1}@gmail.com`,
        mobileNumber: `98765${43210 - i}`,
        cityStore:    i % 2 === 0 ? "Mumbai" : "Delhi",
        productName:  COOKWARE[i % COOKWARE.length],
        cookwareType: COOKWARE[i % COOKWARE.length],
        orderNumber:  details[i % details.length]?.orderMaster?.orderNumber ?? null,
        purchaseDate: new Date(Date.now() - i * 30 * 86400000),
        billName:     `Bill-${1000 + i}`,
        comments:     "Product stopped working after 2 months of use.",
        status:       i === 0 ? "APPROVED" : i === 4 ? "REJECTED" : "PENDING",
        warrantyApproved: i === 0 ? new Date() : null,
      },
    });
    console.log(`✅ Warranty claim ${i + 1} created`);
  }

  console.log("\n✅ Phase 4 seed complete!");
  console.log("   Go to /returns for return orders");
  console.log("   Go to /warranties for warranty claims");
}

main().catch(console.error).finally(() => prisma.$disconnect());
