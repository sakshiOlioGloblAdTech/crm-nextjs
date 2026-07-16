import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Notification templates (Settings → Notifications).
 *
 * Previously these used raw SQL against `notification_templates` because the
 * NotificationTemplate model was missing from schema.prisma — which also meant
 * a missing table failed silently. Now backed by the real Prisma model.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { event: "asc" },
    });
    return NextResponse.json(templates);
  } catch (e: any) {
    console.error("Notifications GET error:", e?.message);
    // The page expects an array — don't hand it an error object.
    return NextResponse.json([], { status: 200 });
  }
}

/** Create or update a template by its `event` key. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { event, subject, emailBody, smsBody, isActive } = await req.json();
    if (!event || !subject || !emailBody) {
      return NextResponse.json(
        { error: "event, subject and emailBody are required" },
        { status: 400 },
      );
    }

    const template = await prisma.notificationTemplate.upsert({
      where: { event },
      update: {
        subject,
        emailBody,
        smsBody: smsBody ?? null,
        isActive: isActive ?? true,
      },
      create: {
        event,
        subject,
        emailBody,
        smsBody: smsBody ?? null,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json(template);
  } catch (e: any) {
    console.error("Notifications POST error:", e?.message);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
