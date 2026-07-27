import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  uploadToR2,
  r2Configured,
  isAllowedType,
  MAX_UPLOAD_BYTES,
} from "@/lib/r2";

/**
 * POST /api/uploads  (admin only)
 * multipart/form-data: file, folder? (products | categories | blogs | ...)
 * Returns { url } — the public R2 URL to store in the image field.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!r2Configured)
    return NextResponse.json(
      { error: "Image storage is not configured yet." },
      { status: 503 },
    );

  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder")?.toString() || "products").toLowerCase();

    if (!(file instanceof File))
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES)
      return NextResponse.json(
        { error: "File too large (max 10 MB)" },
        { status: 413 },
      );
    if (!isAllowedType(file.type))
      return NextResponse.json(
        { error: "Unsupported file type (PNG, JPG, WEBP or GIF)" },
        { status: 415 },
      );

    const { url } = await uploadToR2(folder, file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("POST /api/uploads failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
