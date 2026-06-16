"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Settings } from "lucide-react";

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function SettingsPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [form, setForm] = useState({
    email:             "",
    email2:            "",
    email3:            "",
    deliveryFee:       "",
    defaultDeliveryFee:"",
  });

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setForm({
        email:              d.email              ?? "",
        email2:             d.email2             ?? "",
        email3:             d.email3             ?? "",
        deliveryFee:        d.deliveryFee?.toString()        ?? "",
        defaultDeliveryFee: d.defaultDeliveryFee?.toString() ?? "",
      });
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSuccess(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Global configuration for the store</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl mb-5">
          <CheckCircle2 size={15} /> Settings saved successfully
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

        {/* Email Notifications */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Settings size={13} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">Email Notifications</h2>
          </div>
          <p className="text-xs text-gray-400">
            Order notifications and alerts will be sent to these email addresses.
          </p>
          <div>
            <label className={LABEL}>Primary Email *</label>
            <input name="email" value={form.email} onChange={handleChange} type="email"
              className={INPUT} placeholder="admin@yourstore.com" />
          </div>
          <div>
            <label className={LABEL}>Secondary Email</label>
            <input name="email2" value={form.email2} onChange={handleChange} type="email"
              className={INPUT} placeholder="manager@yourstore.com" />
          </div>
          <div>
            <label className={LABEL}>Third Email</label>
            <input name="email3" value={form.email3} onChange={handleChange} type="email"
              className={INPUT} placeholder="support@yourstore.com" />
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Delivery Charges</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Delivery Fee (₹)</label>
              <input name="deliveryFee" value={form.deliveryFee} onChange={handleChange}
                type="number" className={INPUT} placeholder="50" />
              <p className="text-xs text-gray-400 mt-1">Standard delivery charge per order</p>
            </div>
            <div>
              <label className={LABEL}>Default Delivery Fee (₹)</label>
              <input name="defaultDeliveryFee" value={form.defaultDeliveryFee} onChange={handleChange}
                type="number" className={INPUT} placeholder="50" />
              <p className="text-xs text-gray-400 mt-1">Fallback fee if no rule matches</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
          <Save size={15} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
