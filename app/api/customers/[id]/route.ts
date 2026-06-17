import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      select: {
        id:           true,
        name:         true,
        email:        true,
        mobileNumber: true,
        gender:       true,
        dob:          true,
        photo:        true,
        status:       true,
        uniqueId:     true,
        createdAt:    true,
        updatedAt:    true,
        addresses: {
          orderBy: { isDefault: "desc" },
        },
        orders: {
          orderBy: { orderDate: "desc" },
          select: {
            id:          true,
            orderNumber: true,
            orderDate:   true,
            grandtotal:  true,
            orderStatus: true,
            paymentMode: true,
          },
        },
        returnOrders: {
          orderBy: { createdAt: "desc" },
          select: {
            id:               true,
            orderNumber:      true,
            status:           true,
            refundAmount:     true,
            returnRequestDate:true,
          },
        },
        customerPromocodes: {
          select: {
            id:       true,
            status:   true,
            promocode:{ select: { id: true, promocode: true, discount: true, discountType: true } },
          },
        },
        _count: {
          select: { orders: true, wishlists: true, returnOrders: true },
        },
      },
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // Serialize decimals
    return NextResponse.json({
      ...customer,
      orders: customer.orders.map((o) => ({
        ...o,
        grandtotal: Number(o.grandtotal),
      })),
      returnOrders: customer.returnOrders.map((r) => ({
        ...r,
        refundAmount: r.refundAmount ? Number(r.refundAmount) : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

// Toggle customer status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id }     = await params;
    const { status } = await req.json();

    const updated = await prisma.customer.update({
      where: { id: parseInt(id) },
      data:  { status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
