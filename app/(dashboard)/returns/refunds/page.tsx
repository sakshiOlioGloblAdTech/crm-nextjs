"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { formatINR, formatDate } from "@/lib/utils";

export default function RefundsPage() {
  const [returns,  setReturns]  = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ status: "COMPLETED", limit: "50" });
    if (search) p.set("search", search);
    const res  = await fetch(`/api/returns?${p}`);
    const data = await res.json();
    setReturns(data.returns ?? []);
    setTotal(data.total    ?? 0);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const totalRefunded = returns.reduce((sum, r) => sum + (r.refundAmount ?? 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Refunds</h1>
        <p className="text-sm text-gray-500 mt-0.5">Completed return orders with refund amounts</p>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Total Refunded</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(totalRefunded)}</p>
        </div>
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <p className="text-sm text-gray-500">Total Refund Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order #", "Customer", "Product", "Qty", "Refund Amount", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading...</td></tr>}
            {!loading && returns.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <RefreshCw size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No refunds yet</p>
                </td>
              </tr>
            )}
            {returns.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-brand-600 font-medium">{r.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{r.customer?.name}</p>
                  <p className="text-xs text-gray-400">{r.customer?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">{r.orderDetail?.productName ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{r.returnedQuantity}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">
                  {r.refundAmount ? formatINR(r.refundAmount) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(r.returnRequestDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
