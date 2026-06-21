import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const templates = await prisma.$queryRaw`
      SELECT * FROM notification_templates ORDER BY event ASC
    `;
    return NextResponse.json(templates);
  } catch (e: any) {
    console.error("Notifications error:", e?.message);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { event, subject, emailBody, smsBody, isActive } = await req.json();
    const result = await prisma.$queryRaw`
      INSERT INTO notification_templates (event, subject, "emailBody", "smsBody", "isActive", "createdAt", "updatedAt")
      VALUES (${event}, ${subject}, ${emailBody}, ${smsBody ?? null}, ${isActive ?? true}, NOW(), NOW())
      ON CONFLICT (event) DO UPDATE SET
        subject=${subject}, "emailBody"=${emailBody},
        "smsBody"=${smsBody ?? null}, "isActive"=${isActive ?? true},
        "updatedAt"=NOW()
      RETURNING *
    `;
    return NextResponse.json((result as any[])[0]);
  } catch (e: any) {
    console.error("Notifications POST error:", e?.message);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}