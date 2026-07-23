import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";

export const OPTIONS = handleOptions;

/**
 * POST /api/store/promocodes/validate   body: { code, subtotal }
 * Validates a coupon and returns the discount for the given cart subtotal.
 * (First-order / usage-limit / product-scoping are enforced at order creation.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim();
    const subtotal = Number(body?.subtotal ?? 0);

    if (!code) {
      return storeJson({ valid: false, discount: 0, message: "Enter a coupon code." });
    }

    const promo = await prisma.promocode.findFirst({
      where: { promocode: { equals: code, mode: "insensitive" }, status: true },
    });
    if (!promo) {
      return storeJson({ valid: false, discount: 0, message: "This coupon code isn't valid." });
    }

    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.expiryDate);
    end.setHours(23, 59, 59, 999); // include the whole expiry day
    if (now < start) {
      return storeJson({ valid: false, discount: 0, message: "This coupon isn't active yet." });
    }
    if (now > end) {
      return storeJson({ valid: false, discount: 0, message: "This coupon has expired." });
    }

    // discountType: 1 = percentage, 2 = fixed amount.
    let discount = 0;
    if (promo.discountType === 1) {
      discount = (subtotal * promo.discount) / 100;
      if (promo.maximumCap && promo.maximumCap > 0) {
        discount = Math.min(discount, promo.maximumCap);
      }
    } else {
      discount = promo.discount;
    }
    discount = Math.min(Math.round(discount * 100) / 100, subtotal);

    return storeJson({
      valid: true,
      discount,
      code: promo.promocode,
      message: `Coupon applied — you saved ₹${discount.toFixed(0)}.`,
    });
  } catch (error) {
    console.error("POST /api/store/promocodes/validate failed", error);
    return storeJson(
      { valid: false, discount: 0, message: "Could not apply the coupon. Please try again." },
      500,
    );
  }
}
