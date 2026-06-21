"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { validateForm, hasErrors, ValidationErrors } from "@/lib/validation";
import { inputClass, textareaClass } from "@/components/shared/FormField";

interface CategoryFormProps {
  initial?: {
    id?: number; name?: string; description?: string; image?: string;
    altTag?: string; metaTitle?: string; metaDescription?: string;
    metaKeywords?: string; isFeatured?: boolean; status?: boolean;
    hsnCode?: string; gst?: number | null;
  };
  mode: "create" | "edit";
}

const RULES = {
  name: { required: true, minLength: 2, message: "Category name must be at least 2 characters" },
  gst:  { min: 0, max: 100, message: "GST must be between 0 and 100" },
};

export default function CategoryForm({ initial = {}, mode }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<ValidationErrors<any>>({});

  const [form, setForm] = useState({
    name:            initial.name            ?? "",
    description:     initial.description     ?? "",
    image:           initial.image           ?? "",
    altTag:          initial.altTag          ?? "",
    metaTitle:       initial.metaTitle       ?? "",
    metaDescription: initial.metaDescription ?? "",
    metaKeywords:    initial.metaKeywords    ?? "",
    isFeatured:      initial.isFeatured      ?? false,
    status:          initial.status          ?? false,
    hsnCode:         initial.hsnCode         ?? "",
    gst:             initial.gst?.toString() ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const newVal = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    const newForm = { ...form, [name]: newVal };
    setForm(newForm);

    // Validate on change if already touched
    if (touched[name]) {
      const newErrors = validateForm(newForm, RULES);
      setErrors(newErrors);
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validateForm(form, RULES);
    setErrors(newErrors);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Touch all fields on submit
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    const newErrors = validateForm(form, RULES);
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setLoading(true); setError("");
    const url    = mode === "edit" ? `/api/categories/${initial.id}` : "/api/categories";
    const method = mode === "edit" ? "PUT" : "POST";

    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/categories");
    router.refresh();
  }

  const t = (field: string) => touched[field];
  const e = (field: string) => errors[field as keyof typeof errors];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/categories" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === "edit" ? "Edit Category" : "New Category"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl" noValidate>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Basic Information</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(e("name"), t("name"))}
              placeholder="e.g. Cookware" />
            {t("name") && e("name") && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {e("name")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} onBlur={handleBlur}
              rows={3} className={textareaClass(e("description"), t("description"))}
              placeholder="Short description of this category" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image URL</label>
              <input name="image" value={form.image} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(e("image"), t("image"))} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alt Tag</label>
              <input name="altTag" value={form.altTag} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(e("altTag"), t("altTag"))} placeholder="Image description" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">HSN Code</label>
              <input name="hsnCode" value={form.hsnCode} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(e("hsnCode"), t("hsnCode"))} placeholder="e.g. 7323" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST %</label>
              <input name="gst" value={form.gst} onChange={handleChange} onBlur={handleBlur}
                type="number" className={inputClass(e("gst"), t("gst"))} placeholder="e.g. 18" />
              {t("gst") && e("gst") && <p className="text-xs text-red-500 mt-1">⚠ {e("gst")}</p>}
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

        {/* SEO */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">SEO</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Title</label>
            <input name="metaTitle" value={form.metaTitle} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(e("metaTitle"), t("metaTitle"))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description</label>
            <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} onBlur={handleBlur}
              rows={2} className={textareaClass(e("metaDescription"), t("metaDescription"))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Keywords</label>
            <input name="metaKeywords" value={form.metaKeywords} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(e("metaKeywords"), t("metaKeywords"))} placeholder="keyword1, keyword2" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          <Save size={16} />
          {loading ? "Saving..." : mode === "edit" ? "Update Category" : "Create Category"}
        </button>
      </form>
    </div>
  );
}
