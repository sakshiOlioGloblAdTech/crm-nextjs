import { NextRequest, NextResponse } from "next/server";
import { sendCartAbandonmentReminders } from "@/lib/notifications";

/**
 * Cart-abandonment job. Schedule a periodic hit (e.g. hourly) via a Render Cron
 * Job; pass CRON_SECRET via the `x-cron-secret` header or `?secret=` query.
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
    const result = await sendCartAbandonmentReminders();
    return NextResponse.json(result);
  } catch (e) {
    console.error("cart-abandonment cron failed", e);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
