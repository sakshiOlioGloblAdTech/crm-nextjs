import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import {
  compareCode,
  findOrCreateCustomer,
  generateSessionToken,
  normalizeEmail,
  shapeCustomer,
  OTP_MAX_ATTEMPTS,
} from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "The code must be 6 digits."),
});

/**
 * POST /api/store/auth/verify-otp   body: { email, code }
 * Verifies the emailed code, creates the customer on first sign-in, and returns
 * a session token the storefront sends back as `Authorization: Bearer <token>`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return storeJson({ error: "Enter the 6-digit code from your email." }, 400);
    }

    const email = normalizeEmail(parsed.data.email);

    const otp = await prisma.emailOtp.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return storeJson(
        { error: "That code has expired. Please request a new one." },
        400,
      );
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.emailOtp.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });
      return storeJson(
        { error: "Too many attempts. Please request a new code." },
        429,
      );
    }

    const matches = await compareCode(parsed.data.code, otp.codeHash);
    if (!matches) {
      await prisma.emailOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return storeJson(
        { error: "The verification code is incorrect. Please try again." },
        400,
      );
    }

    // Single-use: burn the code before issuing a session.
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const { customer, isNew } = await findOrCreateCustomer(email);
    const token = generateSessionToken();
    await prisma.customer.update({
      where: { id: customer.id },
      data: { token },
    });

    return storeJson({
      token,
      isNew,
      customer: shapeCustomer(customer),
    });
  } catch (error) {
    console.error("POST /api/store/auth/verify-otp failed", error);
    return storeJson({ error: "Could not verify the code. Please try again." }, 500);
  }
}
