"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle2 } from "lucide-react";

const PROVIDERS = [
  { name: "RAZORPAY", displayName: "Razorpay",        desc: "Accept cards, UPI, netbanking via Razorpay",        icon: "💳", fields: ["Key ID", "Key Secret", "Webhook Secret"] },
  { name: "COD",      displayName: "Cash on Delivery", desc: "Accept payment at delivery",                        icon: "💵", fields: [] },
  { name: "UPI",      displayName: "UPI Direct",       desc: "Accept UPI payments (Google Pay, PhonePe, Paytm)", icon: "📱", fields: ["UPI ID", "Merchant Name"] },
];

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        width:           "48px",
        height:          "26px",
        borderRadius:    "13px",
        backgroundColor: active ? "#2563EB" : "#D1D5DB",
        border:          "none",
        cursor:          "pointer",
        padding:         "3px",
        transition:      "background-color 0.2s ease",
        flexShrink:      0,
      }}
    >
      <div style={{
        width:           "20px",
        height:          "20px",
        borderRadius:    "50%",
        backgroundColor: "white",
        boxShadow:       "0 1px 3px rgba(0,0,0,0.25)",
        transform:       active ? "translateX(22px)" : "translateX(0px)",
        transition:      "transform 0.2s ease",
      }} />
    </button>
  );
}

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [configs,   setConfigs]   = useState<Record<string, any>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch("/api/payment-providers");
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
      const cfg: Record<string, any> = {};
      if (Array.isArray(data)) {
        for (const p of data) cfg[p.name] = p.config ?? {};
      }
      setConfigs(cfg);
    } catch {
      setProviders([]);
    }
    setLoading(false);
  }

  async function handleSave(providerName: string, isActive: boolean, isDefault: boolean) {
    setSaving(providerName);
    const existing = providers.find((p) => p.name === providerName);
    const url      = existing ? `/api/payment-providers/${existing.id}` : "/api/payment-providers";
    const method   = existing ? "PUT" : "POST";
    const pDef     = PROVIDERS.find((p) => p.name === providerName)!;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        providerName,
        displayName: pDef.displayName,
        isActive,
        isDefault,
        config:      configs[providerName] ?? {},
        description: pDef.desc,
      }),
    });

    setSaving(null);
    setSuccess(providerName);
    setTimeout(() => setSuccess(null), 3000);
    load();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Payment Providers</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Configure which payment methods are available in your store
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((pDef) => {
          const existing  = providers.find((p) => p.name === pDef.name);
          const isActive  = existing?.isActive  ?? false;
          const isDefault = existing?.isDefault ?? false;
          const isSaving  = saving  === pDef.name;
          const isSuccess = success === pDef.name;

          return (
            <div key={pDef.name}
              className="bg-white rounded-2xl p-6 transition-all"
              style={{ border: isActive ? "2px solid #BFDBFE" : "1px solid #E5E7EB" }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {pDef.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{pDef.displayName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{pDef.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isDefault && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      Default
                    </span>
                  )}
                  <Toggle
                    active={isActive}
                    onClick={() => handleSave(pDef.name, !isActive, isDefault)}
                  />
                  <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                    {isSaving ? "Saving..." : isActive ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Config fields — only show when active and has fields */}
              {isActive && pDef.fields.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Configuration
                  </p>

                  {pDef.fields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {field}
                      </label>
                      <input
                        type={field.toLowerCase().includes("secret") ? "password" : "text"}
                        value={configs[pDef.name]?.[field] ?? ""}
                        onChange={(e) =>
                          setConfigs((prev) => ({
                            ...prev,
                            [pDef.name]: { ...prev[pDef.name], [field]: e.target.value },
                          }))
                        }
                        className={INPUT}
                        placeholder={`Enter ${field}`}
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={() => handleSave(pDef.name, isActive, !isDefault)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-gray-700">Set as Default</span>
                    </label>

                    <button
                      onClick={() => handleSave(pDef.name, isActive, isDefault)}
                      disabled={isSaving}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
                    >
                      {isSaving
                        ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Save size={13} />
                      }
                      {isSaving ? "Saving..." : "Save Config"}
                    </button>
                  </div>
                </div>
              )}

              {/* Success message */}
              {isSuccess && (
                <div className="flex items-center gap-2 mt-3 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={13} /> Saved successfully
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
