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

const schema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  streetAddress: z.string().min(1).optional(),
  landmarks: z.string().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().optional(),
  pincode: z.string().min(1).optional(),
  addressType: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/** PATCH /api/store/addresses/:id — edit an address (or set it default). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);

  const { id } = await params;
  const addrId = Number(id);
  if (!Number.isInteger(addrId)) return storeJson({ error: "Bad id." }, 400);

  const owned = await prisma.customerAddress.findFirst({
    where: { id: addrId, customerId: customer.id },
  });
  if (!owned) return storeJson({ error: "Address not found." }, 404);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return storeJson({ error: "Invalid address." }, 400);

  if (parsed.data.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { customerId: customer.id },
      data: { isDefault: false },
    });
  }
  await prisma.customerAddress.update({
    where: { id: addrId },
    data: parsed.data,
  });

  return storeJson({ addresses: await listAddresses(customer.id) });
}

/** DELETE /api/store/addresses/:id — remove an address. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return storeJson({ error: "Not signed in" }, 401);

  const { id } = await params;
  const addrId = Number(id);
  if (!Number.isInteger(addrId)) return storeJson({ error: "Bad id." }, 400);

  await prisma.customerAddress.deleteMany({
    where: { id: addrId, customerId: customer.id },
  });

  return storeJson({ addresses: await listAddresses(customer.id) });
}
