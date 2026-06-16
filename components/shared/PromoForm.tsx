"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Tag } from "lucide-react";

interface Props {
  initial?: any;
  mode: "create" | "edit";
}

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function PromoForm({ initial = {}, mode }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    promocode:        initial.promocode        ?? "",
    shortDescription: initial.shortDescription ?? "",
    description:      initial.description      ?? "",
    discountType:     initial.discountType?.toString() ?? "1",
    discount:         initial.discount?.toString()     ?? "",
    maximumCap:       initial.maximumCap?.toString()   ?? "0",
    startDate:        initial.startDate ? new Date(initial.startDate).toISOString().split("T")[0] : "",
    expiryDate:       initial.expiryDate ? new Date(initial.expiryDate).toISOString().split("T")[0] : "",
    useTime:          initial.useTime?.toString() ?? "2",
    isFirstOrder:     initial.isFirstOrder  ?? false,
    isProduct:        initial.isProduct     ?? false,
    isSubcategory:    initial.isSubcategory ?? false,
    status:           initial.status        ?? false,
  });

  function set(field: string, value: any) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    set(name, type === "checkbox" ? (e.target as HTMLInputElement).checked : value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const url    = mode === "edit" ? `/api/promocodes/${initial.id}` : "/api/promocodes";
    const method = mode === "edit" ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/promocodes");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/promocodes" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === "edit" ? `Edit: ${initial.promocode}` : "New Promo Code"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {mode === "edit" ? "Update the promo code details" : "Create a new discount code"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
        )}

        {/* Basic */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Tag size={13} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">Code Details</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Promo Code *</label>
              <input name="promocode" value={form.promocode} onChange={handleChange} required
                className={`${INPUT} uppercase font-mono font-bold`} placeholder="SAVE20" />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="status" checked={form.status} onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className={LABEL}>Short Description *</label>
            <input name="shortDescription" value={form.shortDescription} onChange={handleChange} required
              className={INPUT} placeholder="Get 20% off on all products" />
          </div>

          <div>
            <label className={LABEL}>Full Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className={INPUT} placeholder="Optional detailed description" />
          </div>
        </div>

        {/* Discount */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Discount Settings</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Discount Type *</label>
              <select name="discountType" value={form.discountType} onChange={handleChange} className={INPUT}>
                <option value="1">Percentage (%)</option>
                <option value="2">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>
                Discount {form.discountType === "1" ? "(%)" : "(₹)"} *
              </label>
              <input name="discount" value={form.discount} onChange={handleChange} type="number" required
                className={INPUT} placeholder={form.discountType === "1" ? "20" : "100"} />
            </div>
            <div>
              <label className={LABEL}>Maximum Cap (₹)</label>
              <input name="maximumCap" value={form.maximumCap} onChange={handleChange} type="number"
                className={INPUT} placeholder="500" />
              <p className="text-xs text-gray-400 mt-1">Max discount amount allowed</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Start Date *</label>
              <input name="startDate" value={form.startDate} onChange={handleChange} type="date" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Expiry Date *</label>
              <input name="expiryDate" value={form.expiryDate} onChange={handleChange} type="date" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Usage Limit</label>
              <select name="useTime" value={form.useTime} onChange={handleChange} className={INPUT}>
                <option value="1">One time per customer</option>
                <option value="2">Multiple times</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scope */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Promo Code Scope</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: "isFirstOrder",  label: "First Order Only",    desc: "Only applies to customer's first order" },
              { name: "isProduct",     label: "Product Specific",    desc: "Applies to selected products only" },
              { name: "isSubcategory", label: "Subcategory Specific", desc: "Applies to selected subcategories" },
            ].map((f) => (
              <label key={f.name}
                className={`flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  (form as any)[f.name]
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name={f.name} checked={(form as any)[f.name]} onChange={handleChange}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                </div>
                <p className="text-xs text-gray-400 pl-6">{f.desc}</p>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
          <Save size={15} />
          {loading ? "Saving..." : mode === "edit" ? "Update Promo Code" : "Create Promo Code"}
        </button>
      </form>
    </div>
  );
}
