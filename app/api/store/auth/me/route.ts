import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import { getCustomerFromRequest, shapeCustomer } from "@/lib/customer-auth";

export const OPTIONS = handleOptions;

/**
 * GET /api/store/auth/me
 * Returns the signed-in customer for the Bearer token, or 401.
 */
export async function GET(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);
  return storeJson({ customer: shapeCustomer(customer) });
}

/**
 * POST /api/store/auth/me  → sign out (clears the session token).
 */
export async function POST(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);
  await prisma.customer.update({
    where: { id: customer.id },
    data: { token: null },
  });
  return storeJson({ ok: true });
}
