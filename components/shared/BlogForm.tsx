"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { validateForm, hasErrors, ValidationErrors } from "@/lib/validation";
import { inputClass, textareaClass } from "@/components/shared/FormField";
import { ImageUpload } from "@/components/shared/ImageUpload";

interface BlogFormProps {
  initial?: {
    id?: number; title?: string; excerpt?: string; content?: string;
    image?: string; altTag?: string; author?: string; category?: string;
    readTime?: string; status?: string;
    metaTitle?: string; metaDescription?: string; metaKeywords?: string;
    products?: string[];
  };
  mode: "create" | "edit";
}

const RULES = {
  title: { required: true, minLength: 3, message: "Title must be at least 3 characters" },
};

export default function BlogForm({ initial = {}, mode }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<ValidationErrors<any>>({});

  const [form, setForm] = useState({
    title:           initial.title           ?? "",
    excerpt:         initial.excerpt         ?? "",
    content:         initial.content         ?? "",
    image:           initial.image           ?? "",
    altTag:          initial.altTag          ?? "",
    author:          initial.author          ?? "",
    category:        initial.category        ?? "",
    readTime:        initial.readTime        ?? "",
    status:          initial.status          ?? "draft",
    metaTitle:       initial.metaTitle       ?? "",
    metaDescription: initial.metaDescription ?? "",
    metaKeywords:    initial.metaKeywords    ?? "",
    products:        (initial.products as string[]) ?? [],
  });

  // Products the admin can feature in this post (shown as Buy Now cards).
  const [allProducts, setAllProducts] = useState<
    { urlSlug: string; productName: string }[]
  >([]);
  useEffect(() => {
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((d) =>
        setAllProducts(
          (d.products ?? []).filter((p: any) => p.urlSlug),
        ),
      )
      .catch(() => {});
  }, []);

  const addProduct = (slug: string) => {
    if (!slug || form.products.includes(slug)) return;
    setForm((f) => ({ ...f, products: [...f.products, slug] }));
  };
  const removeProduct = (slug: string) =>
    setForm((f) => ({ ...f, products: f.products.filter((s) => s !== slug) }));
  const nameForSlug = (slug: string) =>
    allProducts.find((p) => p.urlSlug === slug)?.productName ?? slug;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    if (touched[name]) setErrors(validateForm(newForm, RULES));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
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
    const url = mode === "edit" ? `/api/blogs/${initial.id}` : "/api/blogs";
    const method = mode === "edit" ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/blogs");
    router.refresh();
  }

  const t = (field: string) => touched[field];
  const err = (field: string) => errors[field as keyof typeof errors];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/blogs" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === "edit" ? "Edit Blog Post" : "New Blog Post"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl" noValidate>
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

        {/* Basic Info */}
        <div className="bg-surface rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Post</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input name="title" value={form.title} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(err("title"), t("title"))}
              placeholder="e.g. Corporate Gifting Ideas for Work Anniversaries" />
            {t("title") && err("title") && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {err("title")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt</label>
            <textarea name="excerpt" value={form.excerpt} onChange={handleChange} onBlur={handleBlur}
              rows={2} className={textareaClass(err("excerpt"), t("excerpt"))}
              placeholder="Short summary shown on the blog listing card" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
            <textarea name="content" value={form.content} onChange={handleChange} onBlur={handleBlur}
              rows={14} className={textareaClass(err("content"), t("content"))}
              placeholder={"Write the article here.\n\nFormatting:\n## A section heading\n- A bullet point\nLeave a blank line between paragraphs."} />
            <p className="text-xs text-gray-400 mt-1">
              Use <code>##</code> for a heading, <code>-</code> for bullet points, and a blank line between paragraphs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL</label>
              <input name="image" value={form.image} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(err("image"), t("image"))} placeholder="https://..." />
              <div className="mt-2">
                <ImageUpload
                  folder="blogs"
                  onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image Alt Text</label>
              <input name="altTag" value={form.altTag} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(err("altTag"), t("altTag"))} placeholder="Describe the cover image" />
            </div>
          </div>

          {/* Featured products — shown as "Buy Now" cards on the storefront post */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Featured Products
            </label>
            <select
              value=""
              onChange={(e) => addProduct(e.target.value)}
              className={inputClass()}
            >
              <option value="">+ Add a product to this post…</option>
              {allProducts
                .filter((p) => !form.products.includes(p.urlSlug))
                .map((p) => (
                  <option key={p.urlSlug} value={p.urlSlug}>
                    {p.productName}
                  </option>
                ))}
            </select>
            {form.products.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.products.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-brand-50 text-brand-700 rounded-full text-sm"
                  >
                    {nameForSlug(slug)}
                    <button
                      type="button"
                      onClick={() => removeProduct(slug)}
                      className="p-0.5 rounded-full hover:bg-brand-100"
                      aria-label={`Remove ${nameForSlug(slug)}`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              These appear as clickable product cards (with a Buy Now button) on
              the published post.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Author</label>
              <input name="author" value={form.author} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(err("author"), t("author"))} placeholder="Team Plattera" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <input name="category" value={form.category} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(err("category"), t("category"))} placeholder="e.g. Corporate Gifting" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Read Time</label>
              <input name="readTime" value={form.readTime} onChange={handleChange} onBlur={handleBlur}
                className={inputClass(err("readTime"), t("readTime"))} placeholder="e.g. 5 mins read" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className={inputClass(undefined, false)}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (live on site)</option>
            </select>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-surface rounded-2xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">SEO</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Title</label>
            <input name="metaTitle" value={form.metaTitle} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(err("metaTitle"), t("metaTitle"))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Description</label>
            <textarea name="metaDescription" value={form.metaDescription} onChange={handleChange} onBlur={handleBlur}
              rows={2} className={textareaClass(err("metaDescription"), t("metaDescription"))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Keywords</label>
            <input name="metaKeywords" value={form.metaKeywords} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(err("metaKeywords"), t("metaKeywords"))} placeholder="keyword1, keyword2" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
          <Save size={16} />
          {loading ? "Saving..." : mode === "edit" ? "Update Post" : "Create Post"}
        </button>
      </form>
    </div>
  );
}
