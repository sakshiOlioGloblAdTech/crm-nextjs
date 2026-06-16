"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, Download, TrendingUp, ShoppingBag,
  Users, Package, RefreshCw, IndianRupee,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

type ReportType = "sales" | "products" | "customers";

const TABS: { value: ReportType; label: string; icon: any; color: string }[] = [
  { value: "sales",     label: "Sales Report",       icon: TrendingUp, color: "text-blue-600"   },
  { value: "products",  label: "Product Performance", icon: Package,    color: "text-emerald-600"},
  { value: "customers", label: "Customer Report",     icon: Users,      color: "text-purple-600" },
];

const STATUS_COLORS: Record<string, string> = {
  PLACED:     "bg-blue-100 text-blue-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  SHIPPED:    "bg-indigo-100 text-indigo-800",
  DELIVERED:  "bg-emerald-100 text-emerald-800",
  COMPLETED:  "bg-emerald-100 text-emerald-800",
  REFUNDED:   "bg-purple-100 text-purple-800",
};

export default function ReportsPage() {
  const today      = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().setDate(1)).toISOString().split("T")[0];

  const [tab,      setTab]      = useState<ReportType>("sales");
  const [from,     setFrom]     = useState(monthStart);
  const [to,       setTo]       = useState(today);
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [exporting,setExporting]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ type: tab, from, to });
    const res  = await fetch(`/api/reports?${p}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [tab, from, to]);

  useEffect(() => { load(); }, [load]);

  async function handleExport() {
    setExporting(true);
    const p = new URLSearchParams({ type: tab, from, to });
    const res = await fetch(`/api/reports/export?${p}`);
    if (res.ok) {
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${tab}-report-${today}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  const INPUT = "px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="space-y-5 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Analytics and data exports for your store</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {exporting
            ? <RefreshCw size={14} className="animate-spin" />
            : <Download size={14} />
          }
          {exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* ── Tabs + Date filters ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.value
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} className={tab === t.value ? t.color : ""} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400 font-medium">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT} />
          <span className="text-xs text-gray-400 font-medium">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={INPUT} />
          <button onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <RefreshCw size={13} /> Apply
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Generating report...</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SALES REPORT
      ══════════════════════════════════════ */}
      {!loading && data?.type === "sales" && (
        <div className="space-y-5">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue",   value: formatINR(data.summary.totalRevenue),  icon: IndianRupee,  bg: "bg-blue-50",   ic: "text-blue-600"   },
              { label: "Total Orders",    value: data.summary.totalOrders,               icon: ShoppingBag,  bg: "bg-emerald-50", ic: "text-emerald-600"},
              { label: "Avg Order Value", value: formatINR(data.summary.avgOrderValue),  icon: TrendingUp,   bg: "bg-purple-50",  ic: "text-purple-600" },
              { label: "Total GST",       value: formatINR(data.summary.totalGST),       icon: BarChart2,    bg: "bg-orange-50",  ic: "text-orange-600" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{c.label}</p>
                    <div className={`w-8 h-8 ${c.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={15} className={c.ic} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                </div>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Revenue by Status */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Revenue by Status</h2>
              <div className="space-y-3">
                {Object.entries(data.byStatus).map(([status, revenue]: any) => {
                  const pct = data.summary.totalRevenue
                    ? Math.round((revenue / data.summary.totalRevenue) * 100)
                    : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
                          {status}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{pct}%</span>
                          <span className="text-sm font-bold text-gray-900">{formatINR(revenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Mode Split */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Payment Mode</h2>
              <div className="space-y-4">
                {Object.entries(data.byPayment).map(([mode, count]: any) => {
                  const total = Object.values(data.byPayment).reduce((s: any, v: any) => s + v, 0) as number;
                  const pct   = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={mode}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          mode === "COD" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        }`}>{mode}</span>
                        <span className="text-sm font-bold text-gray-900">{count} orders ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${mode === "COD" ? "bg-orange-400" : "bg-blue-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily trend simple bar */}
              {data.daily?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daily Revenue Trend</h3>
                  <div className="flex items-end gap-1 h-20">
                    {data.daily.slice(-14).map((d: any) => {
                      const max = Math.max(...data.daily.slice(-14).map((x: any) => x.revenue));
                      const h   = max ? Math.max(4, Math.round((d.revenue / max) * 72)) : 4;
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer"
                            style={{ height: `${h}px` }}
                            title={`${d.date}: ${formatINR(d.revenue)}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center">Last 14 days</p>
                </div>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">
                Order Details
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                  {data.orders.length} orders
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Order #", "Date", "Customer", "Items", "Subtotal", "GST", "Total", "Status", "Payment"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.orders.length === 0 && (
                    <tr><td colSpan={9} className="py-12 text-center text-gray-400">No orders in this period</td></tr>
                  )}
                  {data.orders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold whitespace-nowrap">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(o.orderDate)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{o.custName}</p>
                        <p className="text-xs text-gray-400">{o.custEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                        {o.orderDetails.map((d: any) => `${d.productName} ×${d.quantity}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{formatINR(o.itemTotal)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatINR(o.gstCharges)}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{formatINR(o.grandtotal)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.orderStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          o.paymentMode === "COD" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        }`}>{o.paymentMode ?? "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PRODUCT REPORT
      ══════════════════════════════════════ */}
      {!loading && data?.type === "products" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">
              Product Performance
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                {data.products.length} products
              </span>
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Rank", "Product", "SKU", "Orders", "Qty Sold", "Revenue"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.products.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No data in this period</td></tr>
              )}
              {data.products.map((p: any, i: number) => (
                <tr key={p.sku} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-yellow-100 text-yellow-800"
                      : i === 1 ? "bg-gray-200 text-gray-700"
                      : i === 2 ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-500"
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-700">{p.orderCount}</td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">{p.totalQty}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatINR(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════
          CUSTOMER REPORT
      ══════════════════════════════════════ */}
      {!loading && data?.type === "customers" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              All Customers
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">
                {data.customers.length} customers
              </span>
            </h2>
            <div className="text-xs text-gray-400">
              Total spent: <span className="font-bold text-gray-900">
                {formatINR(data.customers.reduce((s: number, c: any) => s + c.totalSpent, 0))}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Customer", "Email", "Phone", "Orders", "Total Spent", "Last Order", "Status", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.customers.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">No customers yet</td></tr>
                )}
                {data.customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-purple-600">
                            {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.mobileNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{c.totalOrders}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                      {formatINR(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {c.lastOrderDate ? formatDate(c.lastOrderDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        c.status ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {c.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
