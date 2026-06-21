"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/shared/FormField";
import { validateForm, hasErrors } from "@/lib/validation";

const RULES = {
  email:    { required: true, email: true,  message: "Enter a valid email address" },
  password: { required: true, minLength: 6, message: "Password must be at least 6 characters" },
};

export default function LoginPage() {
  const router = useRouter();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newForm = { ...form, [e.target.name]: e.target.value };
    setForm(newForm);
    if (touched[e.target.name]) setErrors(validateForm(newForm, RULES) as any);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    setErrors(validateForm(form, RULES) as any);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const newErrors = validateForm(form, RULES);
    setErrors(newErrors as any);
    if (hasErrors(newErrors)) return;

    setLoading(true); setServerError("");
    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setServerError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
    }
  }

  const t  = (f: string) => touched[f];
  const er = (f: string) => errors[f];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">CRM Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                className={inputClass(er("email"), t("email"))}
                placeholder="admin@example.com"
              />
              {t("email") && er("email") && (
                <p className="text-xs text-red-500 mt-1">⚠ {er("email")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                name="password" type="password" value={form.password}
                onChange={handleChange} onBlur={handleBlur}
                className={inputClass(er("password"), t("password"))}
                placeholder="••••••••"
              />
              {t("password") && er("password") && (
                <p className="text-xs text-red-500 mt-1">⚠ {er("password")}</p>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
