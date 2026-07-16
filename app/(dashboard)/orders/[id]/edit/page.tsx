"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Package } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function OrderEditPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [reason,  setReason]  = useState("");
  const [edits,   setEdits]   = useState<Record<number, { newQty: string; newPrice: string }>>({});
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${id}`).then(r => r.json()),
      fetch(`/api/order-edits?orderId=${id}`).then(r => r.json()),
    ]).then(([orderData, editHistory]) => {
      setOrder(orderData);
      const initialEdits: Record<number, { newQty: string; newPrice: string }> = {};
      for (const detail of orderData.orderDetails ?? []) {
        initialEdits[detail.id] = { newQty: String(detail.quantity), newPrice: String(detail.unitPrice) };
      }
      setEdits(initialEdits);
      setHistory(editHistory);
      setLoading(false);
    });
  }, [id]);

  async function handleSave() {
    if (!reason.trim()) { setError("Please enter a reason for this edit."); return; }
    setSaving(true); setError("");
    const items = order.orderDetails.map((d: any) => ({
      orderDetailId: d.id,
      originalQty:   d.quantity,
      newQty:        parseInt(edits[d.id]?.newQty ?? d.quantity),
      originalPrice: d.total,
      newPrice:      parseFloat(edits[d.id]?.newPrice ?? d.unitPrice) * parseInt(edits[d.id]?.newQty ?? d.quantity),
    })).filter((item: any) => item.originalQty !== item.newQty || item.originalPrice !== item.newPrice);

    if (!items.length) { setError("No changes made to save."); setSaving(false); return; }

    const res  = await fetch("/api/order-edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderMasterId: id, reason, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setSuccess("Order edit saved — pending confirmation.");
    setTimeout(() => router.push(`/orders/${id}`), 2000);
  }

  async function confirmEdit(editId: number) {
    await fetch(`/api/order-edits/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CONFIRMED" }) });
    setHistory(h => h.map(e => e.id === editId ? { ...e, status: "CONFIRMED" } : e));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order || order.error) return <div className="text-center py-20 text-gray-400">Order not found</div>;

  return (
    <div className="max-w-3xl pb-12 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/orders/${id}`} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-surface hover:bg-gray-50 text-gray-400">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Order <span className="text-brand-600 font-mono">#{order.orderNumber}</span></h1>
          <p className="text-xs text-gray-400 mt-0.5">Modify quantities or prices — changes require confirmation</p>
        </div>
      </div>

      {error   && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl"><AlertCircle size={15}/>{error}</div>}
      {success && <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl"><CheckCircle2 size={15}/>{success}</div>}

      {/* Edit Items */}
      <div className="bg-surface border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Package size={15} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Modify Order Items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.orderDetails.map((item: any) => (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatINR(item.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Quantity <span className="text-gray-300">(was {item.quantity})</span>
                  </label>
                  <input
                    type="number" min="1"
                    value={edits[item.id]?.newQty ?? item.quantity}
                    onChange={e => setEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], newQty: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Unit Price (₹) <span className="text-gray-300">(was {formatINR(item.unitPrice)})</span>
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={edits[item.id]?.newPrice ?? item.unitPrice}
                    onChange={e => setEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], newPrice: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              {/* Show new total */}
              {(edits[item.id]?.newQty || edits[item.id]?.newPrice) && (
                <p className="text-xs text-brand-600 font-semibold mt-2">
                  New total: {formatINR(
                    parseFloat(edits[item.id]?.newPrice ?? item.unitPrice) *
                    parseInt(edits[item.id]?.newQty ?? item.quantity)
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="bg-surface border border-gray-200 rounded-2xl p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Reason for Edit *
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Customer requested quantity change, pricing correction..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
        {saving ? "Saving..." : "Save Edit Request"}
      </button>

      {/* Edit History */}
      {history.length > 0 && (
        <div className="bg-surface border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Edit History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {history.map((edit: any) => (
              <div key={edit.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{edit.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by {edit.editedByUser?.name} · {new Date(edit.createdAt).toLocaleDateString("en-IN")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {edit.items.map((item: any) => (
                        <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                          {item.orderDetail.productName}: {item.originalQty} → {item.newQty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      edit.status === "CONFIRMED"  ? "bg-green-100 text-green-800" :
                      edit.status === "CANCELLED"  ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{edit.status}</span>
                    {edit.status === "PENDING" && (
                      <button onClick={() => confirmEdit(edit.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
