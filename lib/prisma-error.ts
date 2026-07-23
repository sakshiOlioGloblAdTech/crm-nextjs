import { NextResponse } from "next/server";

/**
 * Turn a Prisma write error into a user-friendly JSON response.
 * Never exposes the raw `prisma.x.create() invocation` message to the admin UI.
 * Pass a plain-language `fallback` for anything we don't specifically handle.
 */
export function prismaErrorResponse(error: any, fallback: string) {
  // P2002 = unique constraint violation.
  if (error?.code === "P2002") {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(", ")
      : String(error.meta?.target ?? "");
    const t = target.toLowerCase();
    let message = "That value is already in use — please enter a unique one.";
    if (t.includes("sku"))
      message = "This SKU is already used by another product. Each variation needs a unique SKU.";
    else if (t.includes("slug"))
      message = "A product with this name/URL already exists. Please change the name.";
    else if (t.includes("productid") || t.includes("product_id"))
      message = "This Product ID is already in use.";
    else if (t.includes("promocode"))
      message = "This promo code already exists.";
    else if (t.includes("email"))
      message = "This email is already registered.";
    else if (t.includes("name"))
      message = "An item with this name already exists.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  // P2003 = foreign key constraint (a referenced record is missing).
  if (error?.code === "P2003") {
    return NextResponse.json(
      { error: "A linked record is missing or invalid. Please re-check the selections." },
      { status: 400 },
    );
  }
  // P2025 = record not found (update/delete).
  if (error?.code === "P2025") {
    return NextResponse.json({ error: "That record no longer exists." }, { status: 404 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
