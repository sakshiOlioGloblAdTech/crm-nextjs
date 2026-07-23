"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Inbox } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TableLoading } from "@/components/shared/Spinner";

interface Enquiry {
  id: number;
  type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

const TYPE_STYLE: Record<string, string> = {
  contact: "bg-blue-100 text-blue-700",
  newsletter: "bg-purple-100 text-purple-700",
  quote: "bg-brand-100 text-brand-700",
  vendor: "bg-amber-100 text-amber-700",
};

function payloadSummary(payload: Record<string, unknown> | null): string {
  if (!payload) return "";
  return Object.entries(payload)
    .filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" · ");
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) p.set("search", search);
    if (type) p.set("type", type);
    const res = await fetch(`/api/enquiries?${p}`);
    const data = await res.json();
    setEnquiries(data.enquiries ?? []);
    setTotal(data.total ?? 0);
    setPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search, type]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Leads &amp; Enquiries</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} submissions from the storefront forms
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone, message..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Types</option>
              <option value="contact">Contact</option>
              <option value="newsletter">Newsletter</option>
              <option value="quote">Quote</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Type", "Name", "Email", "Phone", "Details", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && <TableLoading colSpan={6} />}
              {!loading && enquiries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Inbox size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No enquiries yet</p>
                  </td>
                </tr>
              )}
              {enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors align-top">
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_STYLE[e.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{e.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{e.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{e.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-md">
                    {e.message && <p>{e.message}</p>}
                    {payloadSummary(e.payload) && (
                      <p className="text-xs text-gray-400 mt-1">{payloadSummary(e.payload)}</p>
                    )}
                    {!e.message && !payloadSummary(e.payload) && "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {page} of {pages} — {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === pages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
