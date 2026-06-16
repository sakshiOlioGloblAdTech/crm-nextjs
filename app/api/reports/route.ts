import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to   = searchParams.get("to");
    const type = searchParams.get("type") ?? "sales";

    const dateFilter = from && to ? {
      orderDate: {
        gte: new Date(from),
        lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      },
    } : {};

    if (type === "sales") {
      // ── Sales Report ──────────────────────────────────
      const orders = await prisma.orderMaster.findMany({
        where: {
          ...dateFilter,
          orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] },
        },
        orderBy: { orderDate: "desc" },
        select: {
          id: true, orderNumber: true, custName: true, custEmail: true,
          custNumber: true, orderDate: true, itemTotal: true,
          deliveryFee: true, gstCharges: true, grandtotal: true,
          orderStatus: true, paymentMode: true, promocode: true, discount: true,
          orderDetails: {
            select: { productName: true, sku: true, quantity: true, total: true },
          },
        },
      });

      // Summary stats
      const totalRevenue   = orders.reduce((s, o) => s + Number(o.grandtotal), 0);
      const totalOrders    = orders.length;
      const avgOrderValue  = totalOrders ? totalRevenue / totalOrders : 0;
      const totalGST       = orders.reduce((s, o) => s + Number(o.gstCharges), 0);

      // Revenue by status
      const byStatus = orders.reduce((acc: any, o) => {
        acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + Number(o.grandtotal);
        return acc;
      }, {});

      // Daily revenue (last 30 days)
      const daily = orders.reduce((acc: any, o) => {
        const day = new Date(o.orderDate).toISOString().split("T")[0];
        acc[day] = (acc[day] ?? 0) + Number(o.grandtotal);
        return acc;
      }, {});

      // Payment mode split
      const byPayment = orders.reduce((acc: any, o) => {
        const mode = o.paymentMode ?? "Unknown";
        acc[mode] = (acc[mode] ?? 0) + 1;
        return acc;
      }, {});

      return NextResponse.json({
        type: "sales",
        summary: { totalRevenue, totalOrders, avgOrderValue, totalGST },
        byStatus,
        byPayment,
        daily: Object.entries(daily)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, revenue]) => ({ date, revenue })),
        orders: orders.map((o) => ({
          ...o,
          itemTotal:   Number(o.itemTotal),
          deliveryFee: o.deliveryFee ? Number(o.deliveryFee) : 0,
          gstCharges:  Number(o.gstCharges),
          grandtotal:  Number(o.grandtotal),
        })),
      });
    }

    if (type === "products") {
      // ── Product Report ─────────────────────────────────
      const details = await prisma.orderDetail.findMany({
        where: {
          orderMaster: {
            ...dateFilter,
            orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] },
          },
        },
        select: {
          productId: true, productName: true, sku: true,
          quantity: true, unitPrice: true, total: true,
          orderMaster: { select: { orderDate: true } },
        },
      });

      // Aggregate by product
      const productMap: Record<string, any> = {};
      for (const d of details) {
        if (!productMap[d.productName]) {
          productMap[d.productName] = {
            productName: d.productName,
            sku:         d.sku,
            totalQty:    0,
            totalRevenue:0,
            orderCount:  0,
          };
        }
        productMap[d.productName].totalQty     += d.quantity;
        productMap[d.productName].totalRevenue += Number(d.total);
        productMap[d.productName].orderCount   += 1;
      }

      const products = Object.values(productMap)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      return NextResponse.json({ type: "products", products });
    }

    if (type === "customers") {
      // ── Customer Report ────────────────────────────────
      const customers = await prisma.customer.findMany({
        select: {
          id: true, name: true, email: true, mobileNumber: true,
          createdAt: true, status: true,
          orders: {
            where: { orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } },
            select: { grandtotal: true, orderDate: true, orderStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        type: "customers",
        customers: customers.map((c) => ({
          ...c,
          totalOrders:   c.orders.length,
          totalSpent:    c.orders.reduce((s, o) => s + Number(o.grandtotal), 0),
          lastOrderDate: c.orders.length
            ? c.orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0].orderDate
            : null,
        })),
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
