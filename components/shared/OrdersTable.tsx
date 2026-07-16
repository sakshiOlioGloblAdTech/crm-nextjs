"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, Filter } from "lucide-react";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";

interface Order {
  id: number;
  orderNumber: string;
  custName: string;
  custEmail: string;
  custNumber: string;
  orderDate: string;
  grandtotal: number;
  orderStatus: OrderStatus;
  paymentMode: string | null;
  orderDetails: { id: number; productName: string; quantity: number }[];
}

interface Props {
  type: "current" | "past";
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "",                label: "All Statuses"   },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "PLACED",          label: "Placed"          },
  { value: "PROCESSING",      label: "Processing"      },
  { value: "SHIPPED",         label: "Shipped"         },
  { value: "DELIVERED",       label: "Delivered"       },
  { value: "COMPLETED",       label: "Completed"       },
  { value: "CANCELLED",       label: "Cancelled"       },
  { value: "REFUNDED",        label: "Refunded"        },
];

export default function OrdersTable({ type }: Props) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ type, page: String(page), limit: "10" });
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    const res  = await fetch(`/api/orders?${p}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setTotal(data.total  ?? 0);
    setPages(data.totalPages ?? 1);
    setLoading(false);
  }, [type, page, search, status]);

  useEffect(() => {
    const t = setTimeout(fetch_, 300);
    return () => clearTimeout(t);
  }, [fetch_]);

  return (
    <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search order #, name, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.filter((s) =>
              type === "current"
                ? ["", "PAYMENT_PENDING", "PLACED", "PROCESSING", "SHIPPED"].includes(s.value)
                : ["", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"].includes(s.value)
            ).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500 ml-auto">{total} orders</span>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {["Order #", "Customer", "Items", "Total", "Payment", "Status", "Date", ""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading && (
            <tr><td colSpan={8} className="py-16 text-center text-gray-400">Loading orders...</td></tr>
          )}
          {!loading && orders.length === 0 && (
            <tr><td colSpan={8} className="py-16 text-center text-gray-400">No orders found</td></tr>
          )}
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-brand-600 font-medium">
                {o.orderNumber}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{o.custName}</div>
                <div className="text-xs text-gray-400">{o.custEmail}</div>
                <div className="text-xs text-gray-400">{o.custNumber}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-gray-700">{o.orderDetails.length} item{o.orderDetails.length !== 1 ? "s" : ""}</div>
                <div className="text-xs text-gray-400 truncate max-w-[140px]">
                  {o.orderDetails.map((d) => d.productName).join(", ")}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {formatINR(o.grandtotal)}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  o.paymentMode === "COD"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-brand-100 text-brand-800"
                }`}>
                  {o.paymentMode ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[o.orderStatus]}`}>
                  {ORDER_STATUS_LABELS[o.orderStatus]}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {formatDateTime(o.orderDate)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/orders/${o.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <Eye size={13} /> View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)} disabled={page === pages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
