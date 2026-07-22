import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

/**
 * Default notification templates (Settings → Notifications).
 *
 * Bodies use {{variable}} placeholders that get substituted when the mail is
 * sent. Idempotent — upserts by `event`, so existing edits are only refreshed
 * for templates the admin hasn't customised yet.
 *
 * Run:  npm run db:seed:notifications
 */
const TEMPLATES: {
  event: string;
  subject: string;
  emailBody: string;
  smsBody?: string;
}[] = [
  {
    event: "CART_ABANDONMENT",
    subject: "{{customerName}}, you left something behind 🛍️",
    emailBody:
      "Hi {{customerName}},\n\nYou've got {{itemCount}} item(s) waiting in your Plattera cart — still available and ready when you are.\n\nPick up where you left off: {{shopUrl}}\n\n— Team Plattera",
    smsBody:
      "Plattera: {{itemCount}} item(s) are waiting in your cart. Complete your order: {{shopUrl}}",
  },
  {
    event: "ORDER_PLACED",
    subject: "Your Plattera order {{orderNumber}} is confirmed",
    emailBody:
      "Hi {{customerName}},\n\nThank you for your order! We've received order {{orderNumber}} for {{orderTotal}} and our gifting team has started work on it.\n\nWe'll email you again as soon as it ships.\n\n— Team Plattera",
    smsBody: "Plattera: Order {{orderNumber}} confirmed for {{orderTotal}}. Thank you!",
  },
  {
    event: "ORDER_PROCESSING",
    subject: "We're preparing your order {{orderNumber}}",
    emailBody:
      "Hi {{customerName}},\n\nGood news — order {{orderNumber}} is now being packed by our team. We'll share tracking details the moment it's on its way.\n\n— Team Plattera",
    smsBody: "Plattera: Order {{orderNumber}} is being prepared.",
  },
  {
    event: "ORDER_SHIPPED",
    subject: "Your order {{orderNumber}} is on its way 🚚",
    emailBody:
      "Hi {{customerName}},\n\nOrder {{orderNumber}} has shipped via {{courierName}}.\n\nTracking number: {{trackingNumber}}\n\nThanks for gifting with us.\n\n— Team Plattera",
    smsBody: "Plattera: Order {{orderNumber}} shipped. {{courierName}} tracking: {{trackingNumber}}",
  },
  {
    event: "ORDER_DELIVERED",
    subject: "Delivered! Your order {{orderNumber}} has arrived 🎁",
    emailBody:
      "Hi {{customerName}},\n\nOrder {{orderNumber}} has been delivered. We hope it lands exactly as you imagined.\n\nIf you have a moment, we'd love a review.\n\n— Team Plattera",
    smsBody: "Plattera: Order {{orderNumber}} delivered. Enjoy!",
  },
  {
    event: "ORDER_CANCELLED",
    subject: "Your order {{orderNumber}} has been cancelled",
    emailBody:
      "Hi {{customerName}},\n\nOrder {{orderNumber}} has been cancelled. Any amount paid will be refunded to the original payment method.\n\nIf this wasn't expected, just reply to this email.\n\n— Team Plattera",
    smsBody: "Plattera: Order {{orderNumber}} cancelled.",
  },
  {
    event: "ORDER_REFUNDED",
    subject: "Refund processed for order {{orderNumber}}",
    emailBody:
      "Hi {{customerName}},\n\nWe've processed a refund of {{orderTotal}} for order {{orderNumber}}. It should reach your account within 5–7 business days.\n\n— Team Plattera",
    smsBody: "Plattera: Refund of {{orderTotal}} processed for {{orderNumber}}.",
  },
  {
    event: "RETURN_APPROVED",
    subject: "Your return for {{orderNumber}} is approved",
    emailBody:
      "Hi {{customerName}},\n\nYour return request for order {{orderNumber}} has been approved. Our courier partner will collect the item shortly.\n\n— Team Plattera",
    smsBody: "Plattera: Return approved for {{orderNumber}}.",
  },
  {
    event: "RETURN_REJECTED",
    subject: "Update on your return for {{orderNumber}}",
    emailBody:
      "Hi {{customerName}},\n\nWe weren't able to approve the return request for order {{orderNumber}}. Reply to this email and our team will help you out.\n\n— Team Plattera",
    smsBody: "Plattera: Return request for {{orderNumber}} could not be approved.",
  },
  {
    event: "WARRANTY_APPROVED",
    subject: "Your warranty claim is approved",
    emailBody:
      "Hi {{customerName}},\n\nYour warranty claim for order {{orderNumber}} has been approved. Our team will be in touch with next steps.\n\n— Team Plattera",
    smsBody: "Plattera: Warranty claim approved for {{orderNumber}}.",
  },
  {
    event: "OCCASION_REMINDER",
    subject: "{{customerName}}, a {{occasionType}} is coming up in {{daysUntil}} days 🎂",
    emailBody:
      "Hi {{customerName}},\n\nJust a friendly nudge — your {{occasionType}} is on {{occasionDate}}, only {{daysUntil}} days away.\n\nWant to make it memorable? Our hampers are hand-picked, personalised free, and delivered on time.\n\nShop now: {{shopUrl}}\n\n— Team Plattera",
    smsBody:
      "Plattera: Your {{occasionType}} is on {{occasionDate}} ({{daysUntil}} days away). Find the perfect gift: {{shopUrl}}",
  },
];

async function main() {
  console.log("Seeding notification templates…");
  let created = 0;
  let updated = 0;

  for (const t of TEMPLATES) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { event: t.event },
    });

    await prisma.notificationTemplate.upsert({
      where: { event: t.event },
      // Don't clobber admin edits — only fill in what's missing.
      update: {},
      create: {
        event: t.event,
        subject: t.subject,
        emailBody: t.emailBody,
        smsBody: t.smsBody ?? null,
        isActive: true,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  console.log(`  ✓ ${created} created, ${updated} already existed (left untouched)`);
  console.log("✅ Notification templates seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Notification seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
