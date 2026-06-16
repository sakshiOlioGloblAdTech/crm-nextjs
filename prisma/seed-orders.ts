/**
 * Run with:
 * npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed-orders.ts
 *
 * Creates 15 dummy orders across all statuses for testing Phase 3.
 */
import * as dotenv from "dotenv";
dotenv.config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STATUSES = [
  "PLACED", "PLACED", "PLACED",
  "PROCESSING", "PROCESSING",
  "SHIPPED",
  "DELIVERED", "DELIVERED",
  "COMPLETED", "COMPLETED",
  "CANCELLED",
  "PAYMENT_PENDING",
  "REFUNDED",
];

const NAMES = [
  ["Rahul Sharma",    "rahul@gmail.com",   "9876543210"],
  ["Priya Mehta",     "priya@gmail.com",   "9123456789"],
  ["Amit Patel",      "amit@gmail.com",    "9988776655"],
  ["Sunita Joshi",    "sunita@gmail.com",  "9011223344"],
  ["Vikram Singh",    "vikram@gmail.com",  "8877665544"],
  ["Anjali Verma",    "anjali@gmail.com",  "7766554433"],
  ["Rohan Gupta",     "rohan@gmail.com",   "6655443322"],
  ["Neha Kapoor",     "neha@gmail.com",    "5544332211"],
  ["Sanjay Kumar",    "sanjay@gmail.com",  "9900112233"],
  ["Deepa Nair",      "deepa@gmail.com",   "8811223344"],
  ["Arjun Reddy",     "arjun@gmail.com",   "7722334455"],
  ["Kavya Iyer",      "kavya@gmail.com",   "6633445566"],
  ["Manish Tiwari",   "manish@gmail.com",  "5544556677"],
  ["Pooja Bhatt",     "pooja@gmail.com",   "4455667788"],
  ["Suresh Pillai",   "suresh@gmail.com",  "3366778899"],
];

const ADDRESSES = [
  { street: "12 MG Road", city: "Mumbai",    state: "Maharashtra", pincode: "400001" },
  { street: "45 Park St", city: "Kolkata",   state: "West Bengal", pincode: "700016" },
  { street: "7 Anna Salai",city: "Chennai",  state: "Tamil Nadu",  pincode: "600002" },
  { street: "22 FC Road",  city: "Pune",     state: "Maharashtra", pincode: "411004" },
  { street: "9 Brigade Rd",city: "Bangalore",state: "Karnataka",   pincode: "560001" },
];

async function main() {
  // Get first product variation to attach to orders
  const variation = await prisma.productVariation.findFirst({
    include: { product: true },
  });

  if (!variation) {
    console.log("❌ No products found. Please add products first via /products/new");
    return;
  }

  console.log(`Using product: ${variation.product.productName} (SKU: ${variation.sku})`);

  for (let i = 0; i < STATUSES.length; i++) {
    const status  = STATUSES[i];
    const [name, email, phone] = NAMES[i];
    const addr    = ADDRESSES[i % ADDRESSES.length];
    const qty     = Math.floor(Math.random() * 3) + 1;
    const price   = Number(variation.price);
    const gst     = Math.round(price * 0.18 * 100) / 100;
    const total   = (price + gst) * qty;
    const delivery = 50;
    const grand   = total + delivery;

    const orderNum = `ORD-${Date.now().toString(36).toUpperCase()}-${i}`;
    const subNum   = `SUB-${Date.now().toString(36).toUpperCase()}-${i}`;

    await prisma.orderMaster.create({
      data: {
        custName:      name,
        custEmail:     email,
        custNumber:    phone,
        streetAddress: addr.street,
        city:          addr.city,
        state:         addr.state,
        country:       "India",
        pincode:       addr.pincode,
        orderNumber:   orderNum,
        orderDate:     new Date(Date.now() - i * 86400000), // stagger dates
        itemTotal:     total,
        deliveryFee:   delivery,
        gstCharges:    gst * qty,
        grandtotal:    grand,
        orderStatus:   status as any,
        paymentMode:   i % 2 === 0 ? "RAZORPAY" : "COD",
        paymentStatus: status === "PAYMENT_PENDING" ? "Pending" : "Paid",
        cancelledDate: status === "CANCELLED" ? new Date() : null,
        cancellationReason: status === "CANCELLED" ? "Customer changed mind" : null,
        orderDetails: {
          create: [{
            productId:      variation.productId,
            variationId:    variation.id,
            productName:    variation.product.productName,
            sku:            variation.sku,
            quantity:       qty,
            subOrderNumber: subNum,
            unitPrice:      price,
            priceWithGst:   price + gst,
            total:          (price + gst) * qty,
            deliveryFee:    delivery,
            gstCharges:     gst * qty,
            orderStatus:    status as any,
            weightUnit:     variation.weightUnit,
            weight:         variation.weight,
            dimensionUnit:  variation.dimensionUnit,
            length:         variation.length,
            width:          variation.width,
            height:         variation.height,
            deliveredDate:  status === "DELIVERED" || status === "COMPLETED" ? new Date() : null,
          }],
        },
      },
    });
    console.log(`✅ Created order ${orderNum} — ${status}`);
  }

  console.log("\n✅ All 15 dummy orders created!");
  console.log("   Go to /orders to see current orders");
  console.log("   Go to /orders/past to see past orders");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
