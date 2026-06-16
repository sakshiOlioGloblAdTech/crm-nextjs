"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";

const INPUT = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function NewUserPage() {
  const router = useRouter();
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res  = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.push("/users");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/users" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Admin User</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a new team member account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className={LABEL}>Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className={INPUT} placeholder="John Doe" />
          </div>
          <div>
            <label className={LABEL}>Email Address *</label>
            <input name="email" value={form.email} onChange={handleChange} required type="email" className={INPUT} placeholder="john@yourstore.com" />
          </div>
          <div>
            <label className={LABEL}>Password *</label>
            <div className="relative">
              <input name="password" value={form.password} onChange={handleChange} required
                type={showPass ? "text" : "password"} className={`${INPUT} pr-10`} placeholder="Min 6 characters" minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Role *</label>
            <select name="role" value={form.role} onChange={handleChange} className={INPUT}>
              <option value="STAFF">Staff — View only</option>
              <option value="ADMIN">Admin — Full access</option>
              <option value="SUPER_ADMIN">Super Admin — Owner level</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Staff can view. Admin can create/edit. Super Admin has full control.
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
          <Save size={15} />
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
