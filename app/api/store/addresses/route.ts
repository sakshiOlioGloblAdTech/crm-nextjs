import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { shapeAddress } from "@/lib/store-address";

export const OPTIONS = handleOptions;

async function listAddresses(customerId: number) {
  const rows = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(shapeAddress);
}

/** GET /api/store/addresses — the customer's saved addresses. */
export async function GET(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);
  return storeJson({ addresses: await listAddresses(customer.id) });
}

const schema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  streetAddress: z.string().min(1),
  landmarks: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().optional(),
  pincode: z.string().min(1),
  addressType: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/** POST /api/store/addresses — add an address. */
export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) return storeJson({ error: "Not signed in" }, 401);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return storeJson({ error: "Invalid address." }, 400);
    const d = parsed.data;

    // First address is the default; enforce a single default otherwise.
    const count = await prisma.customerAddress.count({
      where: { customerId: customer.id },
    });
    const isDefault = d.isDefault || count === 0;
    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    await prisma.customerAddress.create({
      data: {
        customerId: customer.id,
        name: d.name,
        phoneNumber: d.phoneNumber,
        streetAddress: d.streetAddress,
        landmarks: d.landmarks,
        city: d.city,
        state: d.state,
        country: d.country ?? "India",
        pincode: d.pincode,
        addressType: d.addressType,
        isDefault,
      },
    });

    return storeJson({ addresses: await listAddresses(customer.id) });
  } catch (error) {
    console.error("POST /api/store/addresses failed", error);
    return storeJson({ error: "Could not save the address." }, 500);
  }
}
