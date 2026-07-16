"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Image, Check, X } from "lucide-react";

interface Banner {
  id: number;
  bannerImg: string;
  title: string;
  description: string;
  btnText: string;
}

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function BannersPage() {
  const [banners,   setBanners]   = useState<Banner[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<Banner | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<number | null>(null);
  const [form, setForm] = useState({ bannerImg: "", title: "", description: "", btnText: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/banners");
    const data = await res.json();
    setBanners(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ bannerImg: "", title: "", description: "", btnText: "" });
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setForm({ bannerImg: b.bannerImg, title: b.title, description: b.description, btnText: b.btnText });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.bannerImg || !form.title || !form.description || !form.btnText) return;
    setSaving(true);
    const url    = editing ? `/api/banners/${editing.id}` : "/api/banners";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this banner?")) return;
    setDeleting(id);
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((b) => b.filter((x) => x.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Home Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">{banners.length} banners configured</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface border border-gray-200 rounded-2xl p-6 mb-5 space-y-4">
          <h2 className="font-semibold text-gray-900">{editing ? "Edit Banner" : "New Banner"}</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banner Image URL *</label>
            <input value={form.bannerImg} onChange={(e) => setForm({ ...form, bannerImg: e.target.value })}
              className={INPUT} placeholder="https://your-cdn.com/banner.jpg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={INPUT} placeholder="Premium Cookware" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button Text *</label>
              <input value={form.btnText} onChange={(e) => setForm({ ...form, btnText: e.target.value })}
                className={INPUT} placeholder="Shop Now" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className={INPUT} placeholder="Discover our premium collection..." />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              <Check size={14} /> {saving ? "Saving..." : "Save Banner"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Banners Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="py-16 text-center bg-surface border border-gray-200 rounded-2xl">
          <Image size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">No banners yet — click Add Banner to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-surface border border-gray-200 rounded-2xl overflow-hidden">
              {/* Preview */}
              <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {b.bannerImg ? (
                  <img src={b.bannerImg} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-4">
                  <p className="text-white font-bold text-lg leading-tight">{b.title}</p>
                  <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{b.description}</p>
                  <span className="mt-2 inline-block bg-surface text-gray-900 text-xs font-semibold px-3 py-1 rounded-lg self-start">
                    {b.btnText}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-xs text-gray-400 truncate max-w-[200px] font-mono">{b.bannerImg}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(b)}
                    className="p-1.5 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
