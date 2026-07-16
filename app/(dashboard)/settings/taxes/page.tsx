"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, Percent } from "lucide-react";

interface TaxRule { id: number; name: string; rate: number; type: string; categoryId: number | null; category: { name: string } | null; description: string | null; isDefault: boolean; status: boolean; }
interface Category { id: number; name: string; }

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const LABEL = "block text-sm font-semibold text-gray-700 mb-1.5";
const TYPE_COLORS: Record<string, string> = { GLOBAL: "bg-brand-100 text-brand-800", CATEGORY: "bg-purple-100 text-purple-800", PRODUCT: "bg-orange-100 text-orange-800" };

export default function TaxRulesPage() {
  const [rules,      setRules]      = useState<TaxRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<TaxRule | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", rate: "", type: "GLOBAL", categoryId: "", description: "", isDefault: false, status: true });

  useEffect(() => { load(); fetch("/api/categories").then(r => r.json()).then(setCategories); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tax-rules");
    setRules(await res.json());
    setLoading(false);
  }

  function openEdit(rule: TaxRule) {
    setEditing(rule);
    setForm({ name: rule.name, rate: rule.rate.toString(), type: rule.type, categoryId: rule.categoryId?.toString() ?? "", description: rule.description ?? "", isDefault: rule.isDefault, status: rule.status });
    setShowForm(true);
  }

  function openCreate() { setEditing(null); setForm({ name: "", rate: "", type: "GLOBAL", categoryId: "", description: "", isDefault: false, status: true }); setShowForm(true); }

  async function handleSave() {
    setSaving(true);
    const url = editing ? `/api/tax-rules/${editing.id}` : "/api/tax-rules";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setShowForm(false); load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tax rule?")) return;
    setDeleting(id);
    await fetch(`/api/tax-rules/${id}`, { method: "DELETE" });
    setRules(r => r.filter(x => x.id !== id)); setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tax Rules</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure tax rates by type or category</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl">
          <Plus size={15} /> Add Tax Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-gray-200 rounded-2xl p-6 mb-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{editing ? "Edit Tax Rule" : "New Tax Rule"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={LABEL}>Rule Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={INPUT} placeholder="e.g. Standard GST 18%" /></div>
            <div><label className={LABEL}>Tax Rate (%) *</label><input type="number" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className={INPUT} placeholder="18" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Type *</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={INPUT}>
                <option value="GLOBAL">Global — applies to all products</option>
                <option value="CATEGORY">Category — applies to specific category</option>
                <option value="PRODUCT">Product — applies to specific product</option>
              </select>
            </div>
            {form.type === "CATEGORY" && (
              <div>
                <label className={LABEL}>Category</label>
                <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className={INPUT}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div><label className={LABEL}>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={INPUT} placeholder="Optional description" /></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="w-4 h-4 accent-brand-600" /><span className="text-sm text-gray-700">Set as Default</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.status} onChange={e => setForm({...form, status: e.target.checked})} className="w-4 h-4 accent-brand-600" /><span className="text-sm text-gray-700">Active</span></label>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"><Save size={14} />{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl"><X size={14} />Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{["Rule Name", "Rate", "Type", "Category", "Default", "Status", ""].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={7} className="py-12 text-center text-gray-400">Loading...</td></tr>}
            {!loading && rules.length === 0 && <tr><td colSpan={7} className="py-12 text-center"><Percent size={28} className="mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-400">No tax rules yet</p></td></tr>}
            {rules.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{r.name}</td>
                <td className="px-4 py-3"><span className="font-bold text-gray-900">{r.rate}%</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[r.type]}`}>{r.type}</span></td>
                <td className="px-4 py-3 text-gray-500 text-sm">{r.category?.name ?? "—"}</td>
                <td className="px-4 py-3">{r.isDefault && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Default</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>{r.status ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 disabled:opacity-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
