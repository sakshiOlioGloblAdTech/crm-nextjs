"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, User, Package } from "lucide-react";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { RETURN_STATUS_LABELS, RETURN_STATUS_COLORS } from "@/types";

const ACTION_BUTTONS: Record<string, { value: string; label: string; style: string }[]> = {
  PENDING: [
    { value: "APPROVED",  label: "Approve Return", style: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    { value: "REJECTED",  label: "Reject Return",  style: "bg-surface hover:bg-red-50 text-red-600 border border-red-200" },
  ],
  APPROVED: [
    { value: "COMPLETED", label: "Mark Completed & Refunded", style: "bg-brand-600 hover:bg-brand-700 text-white" },
  ],
  REJECTED: [], COMPLETED: [], CANCELLED: [],
};

export default function ReturnDetailPage() {
  const { id }   = useParams();
  const [ret,    setRet]    = useState<any>(null);
  const [loading,setLoading]= useState(true);
  const [updating,setUpdating]=useState(false);
  const [refundAmt,setRefundAmt]=useState("");
  const [error,  setError]  = useState("");
  const [success,setSuccess]= useState("");

  useEffect(() => {
    fetch(`/api/returns/${id}`).then((r) => r.json()).then((d) => {
      setRet(d);
      if (d.refundAmount) setRefundAmt(String(d.refundAmount));
      setLoading(false);
    });
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true); setError(""); setSuccess("");
    const res  = await fetch(`/api/returns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, refundAmount: refundAmt }),
    });
    const data = await res.json();
    setUpdating(false);
    if (!res.ok) { setError(data.error ?? "Failed to update"); return; }
    setRet((prev: any) => ({ ...prev, status }));
    setSuccess(`Return ${status.toLowerCase()} successfully`);
    setTimeout(() => setSuccess(""), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ret || ret.error) return <div className="text-center py-20 text-gray-400">Return not found</div>;

  const actions = ACTION_BUTTONS[ret.status] ?? [];

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/returns" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Return #{id}</h1>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${RETURN_STATUS_COLORS[ret.status as keyof typeof RETURN_STATUS_COLORS]}`}>
              {RETURN_STATUS_LABELS[ret.status as keyof typeof RETURN_STATUS_LABELS]}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Order #{ret.orderNumber}</p>
        </div>
      </div>

      {error   && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm"><CheckCircle2 size={15}/>{success}</div>}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="bg-surface border border-gray-200 rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Take Action</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Refund Amount (₹)</label>
              <input type="number" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)}
                placeholder="Enter refund amount"
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {actions.map((a) => (
                <button key={a.value} onClick={() => updateStatus(a.value)} disabled={updating}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all disabled:opacity-50 ${a.style}`}>
                  {updating && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
              <User size={13} className="text-brand-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-900">{ret.customer?.name}</p>
            <p className="text-gray-500 text-xs">{ret.customer?.email}</p>
            <p className="text-gray-500 text-xs">{ret.customer?.mobileNumber}</p>
          </div>
        </div>

        {/* Product */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package size={13} className="text-orange-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Product</h2>
          </div>
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-900">{ret.orderDetail?.productName}</p>
            <p className="text-xs text-gray-400 font-mono">SKU: {ret.orderDetail?.sku}</p>
            <p className="text-xs text-gray-500">Qty returned: <strong>{ret.returnedQuantity}</strong></p>
            <p className="text-xs text-gray-500">Order value: <strong>{ret.orderDetail?.total ? formatINR(ret.orderDetail.total) : "—"}</strong></p>
          </div>
        </div>

        {/* Return Info */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Return Details</h2>
          <div className="text-sm space-y-2.5">
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">Reason</span>
              <span className="text-gray-800 text-xs font-medium max-w-[200px] text-right">{ret.returnReason ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs">Requested</span>
              <span className="text-gray-800 text-xs">{formatDateTime(ret.returnRequestDate)}</span>
            </div>
            {ret.returnAcceptedDate && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">Accepted</span>
                <span className="text-gray-800 text-xs">{formatDateTime(ret.returnAcceptedDate)}</span>
              </div>
            )}
            {ret.refundAmount && (
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-700 text-xs font-semibold">Refund Amount</span>
                <span className="text-emerald-600 font-bold">{formatINR(ret.refundAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Linked Order */}
        {ret.orderDetail?.orderMaster && (
          <div className="bg-surface border border-gray-200 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Linked Order</h2>
            <div className="text-sm space-y-2">
              <p className="font-mono text-brand-600 text-xs">#{ret.orderDetail.orderMaster.orderNumber}</p>
              <p className="text-gray-500 text-xs">
                Total: <strong className="text-gray-900">{formatINR(Number(ret.orderDetail.orderMaster.grandtotal))}</strong>
              </p>
              <p className="text-gray-500 text-xs">
                Payment: <strong className="text-gray-700">{ret.orderDetail.orderMaster.paymentMode}</strong>
              </p>
              <Link href={`/orders/${ret.orderDetail.orderMaster.id}`}
                className="inline-flex items-center gap-1 text-brand-600 text-xs hover:underline font-medium mt-1">
                View full order →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
