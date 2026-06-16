import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/utils";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

async function getStats() {
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueResult,
    pendingReturns,
    pendingWarranties,
    recentOrders,
  ] = await Promise.all([
    prisma.orderMaster.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.orderMaster.aggregate({
      _sum: { grandtotal: true },
      where: { orderStatus: { notIn: ["CANCELLED", "REFUNDED"] } },
    }),
    prisma.returnOrder.count({ where: { status: "PENDING" } }),
    prisma.warrantyClaim.count({ where: { status: "PENDING" } }),
    prisma.orderMaster.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        custName: true,
        grandtotal: true,
        orderStatus: true,
        orderDate: true,
      },
    }),
  ]);

  return {
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenue: Number(revenueResult._sum.grandtotal ?? 0),
    pendingReturns,
    pendingWarranties,
    recentOrders,
  };
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PAYMENT_PENDING: "bg-red-100 text-red-800",
  PLACED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  SHIPPED: "bg-green-100 text-green-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-green-100 text-green-800",
};

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Customers",
      value: stats.totalCustomers.toLocaleString("en-IN"),
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Products",
      value: stats.totalProducts.toLocaleString("en-IN"),
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{c.label}</span>
                <span className={`p-2 rounded-lg ${c.bg}`}>
                  <Icon size={16} className={c.color} />
                </span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">Needs Attention</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-yellow-800">Pending Returns</span>
              <span className="text-sm font-semibold text-yellow-900">{stats.pendingReturns}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-orange-800">Warranty Claims</span>
              <span className="text-sm font-semibold text-orange-900">{stats.pendingWarranties}</span>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-medium text-gray-900 mb-3">Recent Orders</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Order #</th>
                <th className="text-left pb-2 font-medium">Customer</th>
                <th className="text-left pb-2 font-medium">Total</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 font-mono text-xs text-gray-600">{o.orderNumber}</td>
                  <td className="py-2 text-gray-700">{o.custName}</td>
                  <td className="py-2 text-gray-700">{formatINR(Number(o.grandtotal))}</td>
                  <td className="py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[o.orderStatus]}`}>
                      {o.orderStatus.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
