"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Save, X } from "lucide-react";

const PRESET_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];

export default function ProductTagsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3B82F6" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/product-tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      setTags([]);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/product-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to create tag. Run prisma generate first.");
        setSaving(false);
        return;
      }
      setSaving(false);
      setShowForm(false);
      setForm({ name: "", color: "#3B82F6" });
      load();
    } catch {
      alert("Something went wrong.");
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tag? It will be removed from all products.")) return;
    setDeleting(id);
    await fetch(`/api/product-tags/${id}`, { method: "DELETE" });
    setTags(t => t.filter(x => x.id !== id)); setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Tags</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tag products for better search and filtering</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">
          <Plus size={15} /> New Tag
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Tag</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tag Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Summer Sale, New Arrival, Trending" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(color => (
                  <button key={color} onClick={() => setForm({ ...form, color })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === color ? "border-gray-900 scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
                <Save size={14} /> {saving ? "Saving..." : "Create Tag"}
              </button>
              <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Preview:</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: form.color }}>
                <Tag size={12} /> {form.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tags Grid */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading...</div>
      ) : tags.length === 0 ? (
        <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl">
          <Tag size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">No tags yet — create your first tag above</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <div key={tag.id} className="group flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="text-sm font-semibold text-gray-800">{tag.name}</span>
                <span className="text-xs text-gray-400">{tag.product_count ?? 0} products</span>
                <button onClick={() => handleDelete(tag.id)} disabled={deleting === tag.id}
                  className="p-1 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
