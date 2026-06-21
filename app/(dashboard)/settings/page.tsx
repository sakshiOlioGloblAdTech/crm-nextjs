"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2, Settings } from "lucide-react";
import { validateForm, hasErrors } from "@/lib/validation";
import { inputClass } from "@/components/shared/FormField";

const RULES = {
  email:       { required: true, email: true, message: "Enter a valid email address" },
  email2:      { email: true, message: "Enter a valid email address" },
  email3:      { email: true, message: "Enter a valid email address" },
  deliveryFee: { min: 0, message: "Delivery fee cannot be negative" },
  defaultDeliveryFee: { min: 0, message: "Default delivery fee cannot be negative" },
};

export default function SettingsPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    email:              "",
    email2:             "",
    email3:             "",
    deliveryFee:        "",
    defaultDeliveryFee: "",
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    if (touched[e.target.name]) setErrors(validateForm(newForm, RULES) as any);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    setErrors(validateForm(form, RULES) as any);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);
    const newErrors = validateForm(form, RULES);
    setErrors(newErrors as any);
    if (hasErrors(newErrors)) return;

    setSaving(true); setSuccess(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const t  = (f: string) => touched[f];
  const er = (f: string) => errors[f];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl mb-5">
          <CheckCircle2 size={15} /> Settings saved successfully
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5" noValidate>

        {/* Email Notifications */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Settings size={13} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900 text-sm">Email Notifications</h2>
          </div>
          <p className="text-xs text-gray-400">Order notifications will be sent to these addresses.</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Primary Email <span className="text-red-500">*</span>
            </label>
            <input name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
              type="email" className={inputClass(er("email"), t("email"))}
              placeholder="admin@yourstore.com" />
            {t("email") && er("email") && <p className="text-xs text-red-500 mt-1">⚠ {er("email")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secondary Email</label>
            <input name="email2" value={form.email2} onChange={handleChange} onBlur={handleBlur}
              type="email" className={inputClass(er("email2"), t("email2"))}
              placeholder="manager@yourstore.com" />
            {t("email2") && er("email2") && <p className="text-xs text-red-500 mt-1">⚠ {er("email2")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Third Email</label>
            <input name="email3" value={form.email3} onChange={handleChange} onBlur={handleBlur}
              type="email" className={inputClass(er("email3"), t("email3"))}
              placeholder="support@yourstore.com" />
            {t("email3") && er("email3") && <p className="text-xs text-red-500 mt-1">⚠ {er("email3")}</p>}
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Delivery Charges</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Fee (₹)</label>
              <input name="deliveryFee" value={form.deliveryFee} onChange={handleChange} onBlur={handleBlur}
                type="number" className={inputClass(er("deliveryFee"), t("deliveryFee"))} placeholder="50" />
              {t("deliveryFee") && er("deliveryFee") && <p className="text-xs text-red-500 mt-1">⚠ {er("deliveryFee")}</p>}
              <p className="text-xs text-gray-400 mt-1">Standard delivery charge per order</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Delivery Fee (₹)</label>
              <input name="defaultDeliveryFee" value={form.defaultDeliveryFee} onChange={handleChange} onBlur={handleBlur}
                type="number" className={inputClass(er("defaultDeliveryFee"), t("defaultDeliveryFee"))} placeholder="50" />
              {t("defaultDeliveryFee") && er("defaultDeliveryFee") && <p className="text-xs text-red-500 mt-1">⚠ {er("defaultDeliveryFee")}</p>}
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
