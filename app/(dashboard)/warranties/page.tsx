"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, Shield, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

const WARRANTY_STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function WarrantiesPage() {
  const [claims,  setClaims]  = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    const res  = await fetch(`/api/warranties?${p}`);
    const data = await res.json();
    setClaims(data.warranties ?? []);
    setTotal(data.total       ?? 0);
    setPages(data.totalPages  ?? 1);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Warranty Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} total warranty submissions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Name, email, order #..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none">
              {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                <option key={s} value={s}>{s || "All Statuses"}</option>
              ))}
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Claimant", "Product", "Order #", "Purchase Type", "Status", "Submitted", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>}
            {!loading && claims.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Shield size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No warranty claims found</p>
                </td>
              </tr>
            )}
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{c.fullName ?? "—"}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                  <p className="text-xs text-gray-400">{c.mobileNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-800 text-sm">{c.productName ?? "—"}</p>
                  <p className="text-xs text-gray-400">{c.cookwareType}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.orderNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs capitalize">
                    {c.purchased}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${WARRANTY_STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/warranties/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye size={12} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === pages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
