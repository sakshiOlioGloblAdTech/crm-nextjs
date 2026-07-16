"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function WarrantyDetailPage() {
  const { id }      = useParams();
  const [claim,     setClaim]    = useState<any>(null);
  const [loading,   setLoading]  = useState(true);
  const [updating,  setUpdating] = useState(false);
  const [error,     setError]    = useState("");
  const [success,   setSuccess]  = useState("");

  useEffect(() => {
    fetch(`/api/warranties/${id}`).then((r) => r.json()).then((d) => { setClaim(d); setLoading(false); });
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true); setError(""); setSuccess("");
    const res  = await fetch(`/api/warranties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setUpdating(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setClaim((prev: any) => ({ ...prev, status }));
    setSuccess(`Warranty claim ${status.toLowerCase()}`);
    setTimeout(() => setSuccess(""), 3000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!claim || claim.error) return <div className="text-center py-20 text-gray-400">Claim not found</div>;

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/warranties" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Warranty Claim #{id}</h1>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[claim.status]}`}>
              {claim.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Submitted {formatDateTime(claim.createdAt)}</p>
        </div>
      </div>

      {error   && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm"><CheckCircle2 size={15}/>{success}</div>}

      {/* Actions */}
      {claim.status === "PENDING" && (
        <div className="bg-surface border border-gray-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Pending Review</span>
          </div>
          <button onClick={() => updateStatus("APPROVED")} disabled={updating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-50">
            {updating && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
            <CheckCircle2 size={14} /> Approve
          </button>
          <button onClick={() => updateStatus("REJECTED")} disabled={updating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface hover:bg-red-50 text-red-600 border border-red-200 rounded-xl transition-all disabled:opacity-50">
            <XCircle size={14} /> Reject
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Claimant */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
              <Shield size={13} className="text-brand-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Claimant Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Name",        claim.fullName],
              ["Email",       claim.email],
              ["Phone",       claim.mobileNumber],
              ["City/Store",  claim.cityStore],
              ["Bill Name",   claim.billName],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex justify-between items-start gap-2">
                <span className="text-gray-400 text-xs shrink-0">{label}</span>
                <span className="text-gray-800 text-xs text-right">{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Product */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Product Details</h2>
          <div className="space-y-2 text-sm">
            {[
              ["Product",       claim.productName],
              ["Product #",     claim.productNumber],
              ["Cookware Type", claim.cookwareType],
              ["Purchase Date", claim.purchaseDate ? formatDate(claim.purchaseDate) : null],
              ["Purchased via", claim.purchased],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex justify-between items-start gap-2">
                <span className="text-gray-400 text-xs shrink-0">{label}</span>
                <span className="text-gray-800 text-xs text-right font-medium">{value}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-surface border border-gray-200 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Reference</h2>
          <div className="space-y-2 text-sm">
            {[
              ["Order #",    claim.orderNumber],
              ["Sub Order #", claim.subOrderNumber],
            ].map(([label, value]) => value ? (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="font-mono text-xs text-brand-600">{value}</span>
              </div>
            ) : null)}
            {!claim.orderNumber && <p className="text-xs text-gray-400">No order reference provided</p>}
          </div>
        </div>

        {/* Comments */}
        {claim.comments && (
          <div className="bg-surface border border-gray-200 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Comments</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{claim.comments}</p>
          </div>
        )}

        {/* Approval */}
        {claim.warrantyApproved && (
          <div className="md:col-span-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Warranty Approved</p>
              <p className="text-xs text-emerald-600 mt-0.5">on {formatDateTime(claim.warrantyApproved)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
