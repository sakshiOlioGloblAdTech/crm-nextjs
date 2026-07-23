import { NextRequest, NextResponse } from "next/server";
import { verifySmtp } from "@/lib/mailer";

/**
 * Diagnostic: verifies the SMTP connection + credentials without sending mail.
 * Protected by CRON_SECRET (x-cron-secret header or ?secret=). Staging aid for
 * confirming SMTP env config; safe to leave in place since it reveals no secret.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    req.headers.get("x-cron-secret") ??
    new URL(req.url).searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await verifySmtp();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
