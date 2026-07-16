"use client";

import { useState, useEffect } from "react";
import { Bell, Save, CheckCircle2 } from "lucide-react";

const EVENTS = [
  { event: "ORDER_PLACED", label: "Order Placed", desc: "Sent when a customer places a new order", icon: "🛒" },
  { event: "ORDER_PROCESSING", label: "Order Processing", desc: "Sent when order moves to processing", icon: "⚙️" },
  { event: "ORDER_SHIPPED", label: "Order Shipped", desc: "Sent when order is shipped with tracking info", icon: "🚚" },
  { event: "ORDER_DELIVERED", label: "Order Delivered", desc: "Sent when order is marked as delivered", icon: "✅" },
  { event: "ORDER_CANCELLED", label: "Order Cancelled", desc: "Sent when an order is cancelled", icon: "❌" },
  { event: "ORDER_REFUNDED", label: "Order Refunded", desc: "Sent when a refund is processed", icon: "💰" },
  { event: "RETURN_APPROVED", label: "Return Approved", desc: "Sent when a return request is approved", icon: "🔄" },
  { event: "RETURN_REJECTED", label: "Return Rejected", desc: "Sent when a return request is rejected", icon: "🚫" },
  { event: "WARRANTY_APPROVED", label: "Warranty Approved", desc: "Sent when warranty claim is approved", icon: "🛡️" },
  { event: "OCCASION_REMINDER", label: "Occasion Reminder", desc: "Sent ahead of a customer's birthday or anniversary", icon: "🎂" },
];

const VARIABLES_HELP = [
  { var: "{{customerName}}", desc: "Customer full name" },
  { var: "{{orderNumber}}", desc: "Order number" },
  { var: "{{orderTotal}}", desc: "Order grand total" },
  { var: "{{orderStatus}}", desc: "Current order status" },
  { var: "{{trackingNumber}}", desc: "AWB / tracking number" },
  { var: "{{courierName}}", desc: "Courier company name" },
  // Occasion reminder only
  { var: "{{occasionType}}", desc: "Birthday or Anniversary" },
  { var: "{{occasionDate}}", desc: "Date of the occasion" },
  { var: "{{daysUntil}}", desc: "Days remaining until the occasion" },
  { var: "{{shopUrl}}", desc: "Link to the storefront" },
];

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState("ORDER_PLACED");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ subject: "", emailBody: "", smsBody: "", isActive: true });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const map: Record<string, any> = {};
      if (Array.isArray(data)) {
        for (const t of data) map[t.event] = t;
      }
      setTemplates(map);
      if (map["ORDER_PLACED"]) {
        setForm({
          subject: map["ORDER_PLACED"].subject,
          emailBody: map["ORDER_PLACED"].emailBody,
          smsBody: map["ORDER_PLACED"].smsBody ?? "",
          isActive: map["ORDER_PLACED"].isActive,
        });
      }
    } catch {
      setTemplates({});
    }
    setLoading(false);
  }

  function selectEvent(event: string) {
    setActiveEvent(event);
    const t = templates[event];
    if (t) setForm({ subject: t.subject, emailBody: t.emailBody, smsBody: t.smsBody ?? "", isActive: t.isActive });
    else setForm({ subject: "", emailBody: "", smsBody: "", isActive: true });
  }

  async function handleSave() {
    setSaving(true); setSuccess(false);
    const existing = templates[activeEvent];
    if (existing) {
      await fetch(`/api/notifications/${existing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, event: activeEvent }) });
    } else {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, event: activeEvent }) });
    }
    setSaving(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    load();
  }

  const activeEventDef = EVENTS.find(e => e.event === activeEvent)!;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Notification Templates</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure email and SMS templates for order events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Event list */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Events</p>
          </div>
          <div className="divide-y divide-gray-50">
            {EVENTS.map(e => {
              const hasTemplate = !!templates[e.event];
              return (
                <button key={e.event} onClick={() => selectEvent(e.event)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeEvent === e.event ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                  <span className="text-lg shrink-0">{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${activeEvent === e.event ? "text-blue-700" : "text-gray-900"}`}>{e.label}</p>
                    {hasTemplate && <p className="text-xs text-emerald-500 font-medium">Configured</p>}
                    {!hasTemplate && <p className="text-xs text-gray-400">Not configured</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template editor */}
        <div className="lg:col-span-2 space-y-4">
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
              <CheckCircle2 size={15} /> Template saved successfully
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeEventDef.icon}</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">{activeEventDef.label}</h2>
                  <p className="text-xs text-gray-400">{activeEventDef.desc}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Subject *</label>
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={INPUT} placeholder="e.g. Your order {{orderNumber}} has been placed!" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Body *</label>
              <textarea value={form.emailBody} onChange={e => setForm({ ...form, emailBody: e.target.value })} rows={8} className={INPUT}
                placeholder={`Hi {{customerName}},\n\nYour order {{orderNumber}} has been placed successfully.\n\nTotal: {{orderTotal}}\n\nThank you for shopping with us!`} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">SMS Body <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={form.smsBody} onChange={e => setForm({ ...form, smsBody: e.target.value })} rows={3} className={INPUT}
                placeholder="Order {{orderNumber}} placed. Total: {{orderTotal}}. Thank you!" />
              <p className="text-xs text-gray-400 mt-1">Keep under 160 characters for single SMS</p>
            </div>

            <button onClick={handleSave} disabled={saving || !form.subject || !form.emailBody}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>

          {/* Variables help */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Available Variables</p>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLES_HELP.map(v => (
                <div key={v.var} className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 text-blue-700 px-2 py-0.5 rounded font-mono">{v.var}</code>
                  <span className="text-xs text-gray-500">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
