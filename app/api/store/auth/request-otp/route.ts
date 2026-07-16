import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import { sendMail, otpEmail } from "@/lib/mailer";
import {
  generateOtp,
  hashCode,
  normalizeEmail,
  OTP_TTL_MINUTES,
  OTP_RESEND_SECONDS,
} from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

const schema = z.object({ email: z.string().email() });

/**
 * POST /api/store/auth/request-otp   body: { email }
 * Emails a 6-digit login code. Always responds the same way for valid input so
 * the endpoint can't be used to probe which emails are registered.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return storeJson({ error: "Please enter a valid email address." }, 400);
    }

    const email = normalizeEmail(parsed.data.email);

    // Resend cooldown — block rapid re-requests for the same address.
    const recent = await prisma.emailOtp.findFirst({
      where: {
        email,
        consumedAt: null,
        createdAt: { gt: new Date(Date.now() - OTP_RESEND_SECONDS * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      return storeJson(
        { error: `Please wait ${OTP_RESEND_SECONDS}s before requesting another code.` },
        429,
      );
    }

    // Invalidate any outstanding codes, then issue a fresh one.
    await prisma.emailOtp.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateOtp();
    await prisma.emailOtp.create({
      data: {
        email,
        codeHash: await hashCode(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    const { delivered } = await sendMail({ to: email, ...otpEmail(code) });

    return storeJson({
      ok: true,
      expiresInMinutes: OTP_TTL_MINUTES,
      // false when SMTP isn't configured yet (code is logged server-side instead).
      delivered,
    });
  } catch (error) {
    console.error("POST /api/store/auth/request-otp failed", error);
    return storeJson({ error: "Could not send the code. Please try again." }, 500);
  }
}
