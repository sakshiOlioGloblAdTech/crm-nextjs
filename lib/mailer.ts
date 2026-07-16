import nodemailer from "nodemailer";

/**
 * Nodemailer transport built from the SMTP_* env vars.
 *
 * Nodemailer is only the sending library — it needs a real SMTP mailbox to
 * send through (e.g. a Google Workspace account with 2FA + an App Password).
 * See .env.example for the required keys.
 *
 * If SMTP isn't configured we don't blow up: `sendMail` logs the message to the
 * server console instead, so the OTP flow is testable before the credentials
 * land. Never rely on that path in production.
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

export const smtpConfigured = Boolean(
  SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS,
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      // 465 = implicit TLS; 587 = STARTTLS.
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: MailInput) {
  if (!transporter) {
    // Dev / not-yet-configured fallback.
    console.warn(
      `[mailer] SMTP not configured — email not sent.\n  to: ${to}\n  subject: ${subject}\n  ${text}`,
    );
    return { delivered: false as const };
  }

  await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to,
    subject,
    text,
    html: html ?? undefined,
  });
  return { delivered: true as const };
}

/** Branded OTP email. */
export function otpEmail(code: string) {
  return {
    subject: `${code} is your Plattera verification code`,
    text: `Your Plattera verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#295A4F;margin:0 0 8px">Verify your email</h2>
        <p style="color:#555;margin:0 0 24px">Use this code to sign in to Plattera.</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#295A4F;background:#f4efe8;padding:16px;text-align:center;border-radius:8px">
          ${code}
        </div>
        <p style="color:#777;font-size:13px;margin:24px 0 0">
          This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}
