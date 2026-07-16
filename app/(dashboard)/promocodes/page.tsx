"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, Tag, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Promo {
  id: number;
  promocode: string;
  shortDescription: string;
  discountType: number;
  discount: number;
  maximumCap: number;
  startDate: string;
  expiryDate: string;
  useTime: number;
  isFirstOrder: boolean;
  isProduct: boolean;
  isSubcategory: boolean;
  status: boolean;
  _count: { customerPromocodes: number };
}

export default function PromocodesPage() {
  const [promos,   setPromos]   = useState<Promo[]>([]);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    const res  = await fetch(`/api/promocodes?${p}`);
    const data = await res.json();
    setPromos(data);
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(id: number, code: string) {
    if (!confirm(`Delete promo code "${code}"?`)) return;
    setDeleting(id);
    await fetch(`/api/promocodes/${id}`, { method: "DELETE" });
    setPromos((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  }

  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{promos.length} total codes</p>
        </div>
        <Link href="/promocodes/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> New Promo Code
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search code or description..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Code", "Description", "Discount", "Max Cap", "Validity", "Uses", "Type", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={9} className="py-16 text-center text-gray-400">Loading...</td></tr>}
            {!loading && promos.length === 0 && (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Tag size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No promo codes found</p>
                </td>
              </tr>
            )}
            {promos.map((p) => {
              const expired = new Date(p.expiryDate) < now;
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg text-xs">
                      {p.promocode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{p.shortDescription}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">
                      {p.discountType === 1 ? `${p.discount}%` : `₹${p.discount}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">₹{p.maximumCap}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600">{formatDate(p.startDate)}</div>
                    <div className={`text-xs font-medium ${expired ? "text-red-500" : "text-emerald-600"}`}>
                      → {formatDate(p.expiryDate)} {expired ? "(Expired)" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700 font-medium">{p._count.customerPromocodes}</span>
                    <span className="text-gray-400 text-xs ml-1">
                      {p.useTime === 1 ? "· one-time" : "· multi"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.isFirstOrder  && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">First order</span>}
                      {p.isProduct     && <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded text-xs font-medium">Product</span>}
                      {p.isSubcategory && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">Subcategory</span>}
                      {!p.isFirstOrder && !p.isProduct && !p.isSubcategory &&
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Global</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link href={`/promocodes/${p.id}/edit`}
                        className="p-1.5 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(p.id, p.promocode)} disabled={deleting === p.id}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
