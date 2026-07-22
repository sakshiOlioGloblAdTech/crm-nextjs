import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

/** Replace {{var}} placeholders with values (missing → empty string). */
export function renderTemplate(
  text: string,
  vars: Record<string, string>,
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

const LEAD_DAYS = Number(process.env.OCCASION_REMINDER_LEAD_DAYS ?? 7);

function shopUrl(): string {
  const o = process.env.STORE_ORIGIN;
  return o && o !== "*" ? o : "https://plattera.in";
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Send birthday/anniversary reminders for occasions LEAD_DAYS away.
 * Renders the OCCASION_REMINDER template, emails each customer, records a
 * notification_logs row, and dedups so a re-run the same day never
 * double-sends. Emails only actually go out once SMTP is configured; until
 * then sendMail logs and we record status "logged".
 */
export async function sendOccasionReminders() {
  const template = await prisma.notificationTemplate.findUnique({
    where: { event: "OCCASION_REMINDER" },
  });
  if (!template || template.isActive === false) {
    return {
      ok: false,
      reason: "OCCASION_REMINDER template missing or inactive",
    };
  }

  const target = new Date();
  target.setUTCDate(target.getUTCDate() + LEAD_DAYS);
  const month = target.getUTCMonth() + 1;
  const day = target.getUTCDate();

  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      email: string;
      dob: Date | null;
      anniversary: Date | null;
    }>
  >`
    SELECT id, name, email, dob, anniversary FROM customers
    WHERE status = true AND email IS NOT NULL AND (
      (dob IS NOT NULL AND EXTRACT(MONTH FROM dob) = ${month} AND EXTRACT(DAY FROM dob) = ${day})
      OR (anniversary IS NOT NULL AND EXTRACT(MONTH FROM anniversary) = ${month} AND EXTRACT(DAY FROM anniversary) = ${day})
    )`;

  const occasions: Array<{ email: string; name: string; type: string }> = [];
  for (const c of rows) {
    if (c.dob && c.dob.getUTCMonth() + 1 === month && c.dob.getUTCDate() === day)
      occasions.push({ email: c.email, name: c.name, type: "Birthday" });
    if (
      c.anniversary &&
      c.anniversary.getUTCMonth() + 1 === month &&
      c.anniversary.getUTCDate() === day
    )
      occasions.push({ email: c.email, name: c.name, type: "Anniversary" });
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const o of occasions) {
    const already = await prisma.notificationLog.findFirst({
      where: {
        event: "OCCASION_REMINDER",
        recipient: o.email,
        createdAt: { gte: startOfToday },
      },
    });
    if (already) {
      skipped++;
      continue;
    }

    const vars = {
      customerName: o.name,
      occasionType: o.type,
      daysUntil: String(LEAD_DAYS),
      occasionDate: fmtDate(target),
      shopUrl: shopUrl(),
    };
    const subject = renderTemplate(template.subject, vars);
    const text = renderTemplate(template.emailBody, vars);

    try {
      const { delivered } = await sendMail({ to: o.email, subject, text });
      await prisma.notificationLog.create({
        data: {
          event: "OCCASION_REMINDER",
          recipient: o.email,
          channel: "email",
          status: delivered ? "sent" : "logged",
        },
      });
      sent++;
    } catch (e) {
      await prisma.notificationLog.create({
        data: {
          event: "OCCASION_REMINDER",
          recipient: o.email,
          channel: "email",
          status: "failed",
          error: String(e).slice(0, 250),
        },
      });
      failed++;
    }
  }

  return {
    ok: true,
    occasionDate: fmtDate(target),
    leadDays: LEAD_DAYS,
    matched: occasions.length,
    sent,
    skipped,
    failed,
  };
}
