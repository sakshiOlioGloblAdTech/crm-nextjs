"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { validateForm, hasErrors, ValidationErrors } from "@/lib/validation";
import { inputClass, textareaClass, selectClass } from "@/components/shared/FormField";

interface Props { initial?: any; mode: "create" | "edit"; }

const RULES = {
  name:       { required: true, minLength: 2, message: "Name must be at least 2 characters" },
  categoryId: { required: true, message: "Please select a parent category" },
};

export default function SubCategoryForm({ initial = {}, mode }: Props) {
  const router = useRouter();
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});
  const [errors,     setErrors]     = useState<ValidationErrors<any>>({});

  const [form, setForm] = useState({
    name:            initial.name        ?? "",
    categoryId:      initial.categoryId?.toString() ?? "",
    description:     initial.description ?? "",
    image:           initial.image       ?? "",
    headerImage:     initial.headerImage ?? "",
    altTag:          initial.altTag      ?? "",
    metaTitle:       initial.metaTitle   ?? "",
    metaDescription: initial.metaDescription ?? "",
    metaKeywords:    initial.metaKeywords ?? "",
    isFeatured:      initial.isFeatured  ?? false,
    status:          initial.status      ?? false,
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const newVal  = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    const newForm = { ...form, [name]: newVal };
    setForm(newForm);
    if (touched[name]) {
      setErrors(validateForm(newForm, RULES));
    }
  }

  function handleBlur(e: React.FocusEvent<any>) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateForm(form, RULES));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);
    const newErrors = validateForm(form, RULES);
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setLoading(true); setError("");
    const url    = mode === "edit" ? `/api/subcategories/${initial.id}` : "/api/subcategories";
    const method = mode === "edit" ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data   = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/categories/sub");
    router.refresh();
  }

  const t = (f: string) => touched[f];
  const er = (f: string) => errors[f as keyof typeof errors];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/categories/sub" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{mode === "edit" ? "Edit Sub Category" : "New Sub Category"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl" noValidate>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Basic Information</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent Category <span className="text-red-500">*</span></label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} onBlur={handleBlur}
              className={selectClass(er("categoryId"), t("categoryId"))}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {t("categoryId") && er("categoryId") && <p className="text-xs text-red-500 mt-1">⚠ {er("categoryId")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sub Category Name <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(er("name"), t("name"))} placeholder="e.g. Non-Stick Pans" />
            {t("name") && er("name") && <p className="text-xs text-red-500 mt-1">⚠ {er("name")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} onBlur={handleBlur}
              rows={3} className={textareaClass(er("description"), t("description"))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
              <input name="image" value={form.image} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(er("image"), t("image"))} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Header Image URL</label>
              <input name="headerImage" value={form.headerImage} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(er("headerImage"), t("headerImage"))} placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="status" checked={form.status} onChange={handleChange} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          <Save size={16} />
          {loading ? "Saving..." : mode === "edit" ? "Update" : "Create Sub Category"}
        </button>
      </form>
    </div>
  );
}
