import { NextRequest, NextResponse } from "next/server";
import { sendOccasionReminders } from "@/lib/notifications";

/**
 * Occasion-reminder job. Schedule a daily hit to this URL (e.g. a Render Cron
 * Job): send CRON_SECRET via the `x-cron-secret` header or `?secret=` query.
 * If CRON_SECRET is unset the endpoint runs unprotected (set it in production).
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-cron-secret") ??
      new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await sendOccasionReminders();
    return NextResponse.json(result);
  } catch (e) {
    console.error("occasion-reminders cron failed", e);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
