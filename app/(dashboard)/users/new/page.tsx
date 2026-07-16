"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { validateForm, hasErrors, ValidationErrors } from "@/lib/validation";
import { inputClass, selectClass } from "@/components/shared/FormField";

const RULES = {
  name:     { required: true, minLength: 2,  message: "Name must be at least 2 characters" },
  email:    { required: true, email: true,   message: "Enter a valid email address" },
  password: { required: true, minLength: 6,  message: "Password must be at least 6 characters" },
  role:     { required: true,                message: "Please select a role" },
};

export default function NewUserPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [touched,  setTouched]  = useState<Record<string, boolean>>({});
  const [errors,   setErrors]   = useState<ValidationErrors<any>>({});
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    if (touched[e.target.name]) setErrors(validateForm(newForm, RULES));
  }

  function handleBlur(e: React.FocusEvent<any>) {
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
    const res  = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.push("/users"); router.refresh();
  }

  const t  = (f: string) => touched[f];
  const er = (f: string) => errors[f as keyof typeof errors];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/users" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-surface hover:bg-gray-50 text-gray-400">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Admin User</h1>
          <p className="text-sm text-gray-400 mt-0.5">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5" noValidate>
        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}

        <div className="bg-surface border border-gray-200 rounded-2xl p-6 space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur}
              className={inputClass(er("name"), t("name"))} placeholder="John Doe" />
            {t("name") && er("name") && <p className="text-xs text-red-500 mt-1">⚠ {er("name")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <input name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
              type="email" className={inputClass(er("email"), t("email"))} placeholder="john@yourstore.com" />
            {t("email") && er("email") && <p className="text-xs text-red-500 mt-1">⚠ {er("email")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input name="password" value={form.password} onChange={handleChange} onBlur={handleBlur}
                type={showPass ? "text" : "password"}
                className={`${inputClass(er("password"), t("password"))} pr-10`}
                placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {t("password") && er("password") && <p className="text-xs text-red-500 mt-1">⚠ {er("password")}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
            <select name="role" value={form.role} onChange={handleChange} onBlur={handleBlur}
              className={selectClass(er("role"), t("role"))}>
              <option value="STAFF">Staff — View only</option>
              <option value="ADMIN">Admin — Full access</option>
              <option value="SUPER_ADMIN">Super Admin — Owner level</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Staff can view. Admin can edit. Super Admin has full control.</p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
          <Save size={15} />
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
