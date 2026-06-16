"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";

interface Variation {
  id?: number;
  sku: string;
  price: string;
  specialPrice: string;
  stock: string;
  weightUnit: string;
  weight: string;
  dimensionUnit: string;
  length: string;
  width: string;
  height: string;
  variationImage: string;
}

const emptyVariation = (): Variation => ({
  sku: "", price: "", specialPrice: "", stock: "",
  weightUnit: "kg", weight: "", dimensionUnit: "cm",
  length: "", width: "", height: "", variationImage: "",
});

interface Props {
  initial?: any;
  mode: "create" | "edit";
}

export default function ProductForm({ initial = {}, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [variations, setVariations] = useState<Variation[]>(
    initial.variations?.length
      ? initial.variations.map((v: any) => ({
          id: v.id,
          sku: v.sku ?? "",
          price: v.price?.toString() ?? "",
          specialPrice: v.specialPrice?.toString() ?? "",
          stock: v.stock?.toString() ?? "",
          weightUnit: v.weightUnit ?? "kg",
          weight: v.weight?.toString() ?? "",
          dimensionUnit: v.dimensionUnit ?? "cm",
          length: v.length?.toString() ?? "",
          width: v.width?.toString() ?? "",
          height: v.height?.toString() ?? "",
          variationImage: v.variationImage ?? "",
        }))
      : [emptyVariation()]
  );

  const [form, setForm] = useState({
    subcategoryId: initial.subcategoryId?.toString() ?? "",
    productName: initial.productName ?? "",
    urlSlug: initial.urlSlug ?? "",
    productId: initial.productId ?? "",
    shortDescription: initial.shortDescription ?? "",
    description: initial.description ?? "",
    altTag: initial.altTag ?? "",
    metaTitle: initial.metaTitle ?? "",
    metaDescription: initial.metaDescription ?? "",
    metaKeywords: initial.metaKeywords ?? "",
    isFeatured: initial.isFeatured ?? false,
    status: initial.status ?? false,
    isNew: initial.isNew ?? false,
    isBestSeller: initial.isBestSeller ?? false,
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetch(`/api/subcategories?categoryId=${selectedCategory}`)
        .then((r) => r.json()).then(setSubcategories);
    }
  }, [selectedCategory]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const newVal = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => {
      const updated = { ...prev, [name]: newVal };
      if (name === "productName") updated.urlSlug = slugify(value);
      return updated;
    });
  }

  function handleVariationChange(index: number, field: keyof Variation, value: string) {
    setVariations((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  }

  function addVariation() { setVariations((prev) => [...prev, emptyVariation()]); }
  function removeVariation(index: number) { setVariations((prev) => prev.filter((_, i) => i !== index)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = mode === "edit" ? `/api/products/${initial.id}` : "/api/products";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, variations }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/products");
    router.refresh();
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/products" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">
          {mode === "edit" ? `Edit: ${initial.productName}` : "New Product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Sub Category *</label>
              <select name="subcategoryId" value={form.subcategoryId} onChange={handleChange} required className={inputClass}>
                <option value="">Select subcategory</option>
                {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Name *</label>
              <input name="productName" value={form.productName} onChange={handleChange} required className={inputClass} placeholder="e.g. Stainless Steel Pan" />
            </div>
            <div>
              <label className={labelClass}>Product ID / SKU Code</label>
              <input name="productId" value={form.productId} onChange={handleChange} className={inputClass} placeholder="e.g. SSP-001" />
            </div>
          </div>

          <div>
            <label className={labelClass}>URL Slug</label>
            <input name="urlSlug" value={form.urlSlug} onChange={handleChange} className={inputClass} placeholder="auto-generated from name" />
          </div>

          <div>
            <label className={labelClass}>Short Description *</label>
            <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} rows={2} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Full Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={5} required className={inputClass} />
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { name: "isFeatured", label: "Featured" },
              { name: "status", label: "Active" },
              { name: "isNew", label: "New Arrival" },
              { name: "isBestSeller", label: "Best Seller" },
            ].map((f) => (
              <label key={f.name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name={f.name} checked={(form as any)[f.name]} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Variations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-gray-900">Variations / SKUs</h2>
            <button type="button" onClick={addVariation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Plus size={14} /> Add Variation
            </button>
          </div>

          {variations.map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Variation {i + 1}</span>
                {variations.length > 1 && (
                  <button type="button" onClick={() => removeVariation(i)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>SKU *</label>
                  <input value={v.sku} onChange={(e) => handleVariationChange(i, "sku", e.target.value)} required className={inputClass} placeholder="SSP-001-RED" />
                </div>
                <div>
                  <label className={labelClass}>Price (₹) *</label>
                  <input type="number" value={v.price} onChange={(e) => handleVariationChange(i, "price", e.target.value)} required className={inputClass} placeholder="999" />
                </div>
                <div>
                  <label className={labelClass}>Special Price (₹)</label>
                  <input type="number" value={v.specialPrice} onChange={(e) => handleVariationChange(i, "specialPrice", e.target.value)} className={inputClass} placeholder="799" />
                </div>
                <div>
                  <label className={labelClass}>Stock *</label>
                  <input type="number" value={v.stock} onChange={(e) => handleVariationChange(i, "stock", e.target.value)} required className={inputClass} placeholder="50" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Weight</label>
                  <div className="flex gap-2">
                    <input type="number" value={v.weight} onChange={(e) => handleVariationChange(i, "weight", e.target.value)} className={inputClass} placeholder="1.5" />
                    <select value={v.weightUnit} onChange={(e) => handleVariationChange(i, "weightUnit", e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                      <option>kg</option><option>g</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Dimensions (L × W × H)</label>
                  <div className="flex gap-1">
                    <input type="number" value={v.length} onChange={(e) => handleVariationChange(i, "length", e.target.value)} className={inputClass} placeholder="L" />
                    <input type="number" value={v.width} onChange={(e) => handleVariationChange(i, "width", e.target.value)} className={inputClass} placeholder="W" />
                    <input type="number" value={v.height} onChange={(e) => handleVariationChange(i, "height", e.target.value)} className={inputClass} placeholder="H" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input value={v.variationImage} onChange={(e) => handleVariationChange(i, "variationImage", e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-medium text-gray-900">SEO</h2>
          <div>
            <label className={labelClass}>Meta Title</label>
            <input name="metaTitle" value={form.metaTitle} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Meta Keywords</label>
            <input name="metaKeywords" value={form.metaKeywords} onChange={handleChange} className={inputClass} placeholder="keyword1, keyword2" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          <Save size={16} />
          {loading ? "Saving..." : mode === "edit" ? "Update Product" : "Create Product"}
        </button>
      </form>
    </div>
  );
}
