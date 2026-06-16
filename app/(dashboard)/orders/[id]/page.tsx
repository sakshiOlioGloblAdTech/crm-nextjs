"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, MapPin, CreditCard, User,
  ChevronRight, AlertCircle, CheckCircle2, Truck,
  XCircle, RefreshCw, Clock,
} from "lucide-react";
import { formatINR, formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from "@/types";

const STATUS_ICONS: Record<string, any> = {
  PAYMENT_PENDING: Clock,
  PLACED: CheckCircle2,
  PROCESSING: RefreshCw,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: RefreshCw,
};

const STATUS_TIMELINE = [
  "PAYMENT_PENDING",
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
] as const;

const NEXT_STATUSES: Record<string, { value: string; label: string; cls: string; icon: any }[]> = {
  PAYMENT_PENDING: [
    { value: "PLACED",    label: "Confirm Order",    icon: CheckCircle2, cls: "btn-blue"   },
    { value: "CANCELLED", label: "Cancel Order",     icon: XCircle,      cls: "btn-danger" },
  ],
  PLACED: [
    { value: "PROCESSING", label: "Start Processing", icon: RefreshCw,    cls: "btn-amber"  },
    { value: "CANCELLED",  label: "Cancel Order",     icon: XCircle,      cls: "btn-danger" },
  ],
  PROCESSING: [
    { value: "SHIPPED",   label: "Mark as Shipped",  icon: Truck,        cls: "btn-green"  },
    { value: "CANCELLED", label: "Cancel Order",     icon: XCircle,      cls: "btn-danger" },
  ],
  SHIPPED: [
    { value: "DELIVERED", label: "Mark as Delivered", icon: CheckCircle2, cls: "btn-green" },
  ],
  DELIVERED: [
    { value: "COMPLETED", label: "Mark as Completed", icon: CheckCircle2, cls: "btn-blue"   },
    { value: "REFUNDED",  label: "Refund Order",      icon: RefreshCw,    cls: "btn-purple" },
  ],
  COMPLETED: [
    { value: "REFUNDED", label: "Refund Order", icon: RefreshCw, cls: "btn-purple" },
  ],
  CANCELLED: [],
  REFUNDED: [],
};

const BTN_CLASSES: Record<string, string> = {
  "btn-blue":   "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600",
  "btn-green":  "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600",
  "btn-amber":  "bg-amber-500 hover:bg-amber-600 text-white border border-amber-500",
  "btn-purple": "bg-purple-600 hover:bg-purple-700 text-white border border-purple-600",
  "btn-danger": "bg-white hover:bg-red-50 text-red-600 border border-red-300",
};

const CARD = "bg-white rounded-2xl border border-gray-200";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder]               = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(false);
  const [showCancel, setShowCancel]     = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d); setLoading(false); });
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (newStatus === "CANCELLED") { setShowCancel(true); return; }
    await doUpdate(newStatus, "");
  }

  async function doUpdate(newStatus: string, reason: string) {
    setUpdating(true); setError(""); setSuccess("");
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, cancellationReason: reason }),
    });
    const data = await res.json();
    setUpdating(false);
    if (!res.ok) { setError(data.error ?? "Failed to update"); return; }
    setOrder((p: any) => ({ ...p, orderStatus: newStatus }));
    setSuccess(`Status updated to "${ORDER_STATUS_LABELS[newStatus as OrderStatus]}"`);
    setShowCancel(false); setCancelReason("");
    setTimeout(() => setSuccess(""), 4000);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading order...</p>
    </div>
  );

  if (!order || order.error) return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
      <p className="font-medium text-gray-600">Order not found</p>
      <Link href="/orders" className="text-sm text-blue-600 hover:underline">← Back to orders</Link>
    </div>
  );

  const nextActions = NEXT_STATUSES[order.orderStatus] ?? [];
  const timelineIdx = STATUS_TIMELINE.indexOf(order.orderStatus as any);
  const isCancelled = order.orderStatus === "CANCELLED";
  const isRefunded  = order.orderStatus === "REFUNDED";
  const StatusIcon  = STATUS_ICONS[order.orderStatus];

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-3 py-2">
        <Link href="/orders"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">
              Order&nbsp;
              <span className="font-mono text-blue-600 font-bold">#{order.orderNumber}</span>
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLORS[order.orderStatus as OrderStatus]}`}>
              {StatusIcon && <StatusIcon size={11} />}
              {ORDER_STATUS_LABELS[order.orderStatus as OrderStatus]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Placed {formatDateTime(order.orderDate)}</p>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 size={15} className="shrink-0" />
          {success}
        </div>
      )}

      {/* STATUS ACTIONS */}
      {nextActions.length > 0 && (
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Update Status
          </p>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.value}
                  onClick={() => updateStatus(action.value)}
                  disabled={updating}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${BTN_CLASSES[action.cls]}`}
                >
                  {updating
                    ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Icon size={14} />
                  }
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {!isCancelled && !isRefunded && (
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Order Progress
          </p>
          <div className="flex items-start">
            {STATUS_TIMELINE.map((s, i) => {
              const done    = i <= timelineIdx;
              const current = i === timelineIdx;
              const Icon    = STATUS_ICONS[s];
              const isLast  = i === STATUS_TIMELINE.length - 1;
              return (
                <div key={s} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      current ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : done   ? "bg-emerald-500 text-white"
                      :          "bg-gray-100 text-gray-300"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight whitespace-nowrap ${
                      current ? "text-blue-600"
                      : done   ? "text-emerald-600"
                      :          "text-gray-300"
                    }`}>
                      {ORDER_STATUS_LABELS[s as OrderStatus]}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`h-px flex-1 mx-2 mb-6 ${
                      i < timelineIdx ? "bg-emerald-400" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CANCELLATION */}
      {isCancelled && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Order Cancelled</p>
            {order.cancellationReason && (
              <p className="text-sm text-red-600 mt-0.5">{order.cancellationReason}</p>
            )}
            {order.cancelledDate && (
              <p className="text-xs text-red-400 mt-1">on {formatDateTime(order.cancelledDate)}</p>
            )}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-4">

          {/* Order Items */}
          <div className={CARD}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Package size={15} className="text-gray-400" />
              <span className="font-semibold text-gray-900 text-sm">
                Order Items ({order.orderDetails.length})
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {order.orderDetails.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={18} className="text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {item.sku}</p>
                    <p className="text-[11px] text-gray-400">Sub# {item.subOrderNumber}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-xs text-gray-400">× {formatINR(item.unitPrice)}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_COLORS[item.orderStatus as OrderStatus]}`}>
                        {ORDER_STATUS_LABELS[item.orderStatus as OrderStatus]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{formatINR(item.total)}</p>
                    {item.gstCharges > 0 && (
                      <p className="text-[11px] text-gray-400 mt-0.5">+GST {formatINR(item.gstCharges)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className={`${CARD} p-5`}>
            <p className="font-semibold text-gray-900 text-sm mb-4">Price Breakdown</p>
            <div className="space-y-3">
              {[
                { label: "Item Total",   value: order.itemTotal,   show: true },
                { label: "Delivery Fee", value: order.deliveryFee, show: order.deliveryFee != null },
                { label: "GST",          value: order.gstCharges,  show: order.gstCharges > 0 },
                { label: "CGST",         value: order.cgst,        show: !!order.cgst },
                { label: "SGST",         value: order.sgst,        show: !!order.sgst },
                { label: "IGST",         value: order.igst,        show: !!order.igst },
              ].filter((r) => r.show).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700 font-medium">{formatINR(value)}</span>
                </div>
              ))}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount {order.promocode ? `(${order.promocode})` : ""}</span>
                  <span className="font-semibold">− {formatINR(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="font-bold text-gray-900 text-lg">{formatINR(order.grandtotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* Customer */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <User size={13} className="text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Customer</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-gray-900 text-sm">{order.custName}</p>
              <p className="text-xs text-gray-500">{order.custEmail}</p>
              <p className="text-xs text-gray-500">{order.custNumber}</p>
              {order.customer && (
                <Link href={`/customers/${order.customer.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline mt-1">
                  View profile <ChevronRight size={11} />
                </Link>
              )}
            </div>
          </div>

          {/* Address */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <MapPin size={13} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Delivery Address</p>
            </div>
            <div className="space-y-1 text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-800">{order.streetAddress}</p>
              {order.landmarks && <p className="text-gray-400">{order.landmarks}</p>}
              <p>{order.city}, {order.state}</p>
              <p>{order.country}</p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono text-[11px]">
                  {order.pincode}
                </span>
                {order.addressType && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-medium capitalize">
                    {order.addressType}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <CreditCard size={13} className="text-purple-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Payment</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Mode</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  order.paymentMode === "COD"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {order.paymentMode ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <span className={`text-xs font-bold ${
                  order.paymentStatus === "Paid" ? "text-emerald-600" : "text-red-500"
                }`}>
                  {order.paymentStatus ?? "—"}
                </span>
              </div>
              {order.razorpayOrderId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 mb-1">Razorpay Order ID</p>
                  <p className="font-mono text-[11px] text-gray-600 break-all bg-gray-50 px-2 py-1.5 rounded-lg">
                    {order.razorpayOrderId}
                  </p>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">Payment ID</p>
                  <p className="font-mono text-[11px] text-gray-600 break-all bg-gray-50 px-2 py-1.5 rounded-lg">
                    {order.razorpayPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* CANCEL MODAL */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Cancel this order?</p>
                <p className="text-xs text-gray-400 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Why is this order being cancelled?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCancel(false); setCancelReason(""); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => doUpdate("CANCELLED", cancelReason)}
                disabled={updating || !cancelReason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}