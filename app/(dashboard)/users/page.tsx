"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, UserCog, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN:       "bg-brand-100 text-brand-800",
  STAFF:       "bg-gray-100 text-gray-600",
};

export default function UsersPage() {
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove admin user "${name}"?`)) return;
    setDeleting(id);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} team members</p>
        </div>
        <Link href="/users/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus size={15} /> Add User
        </Link>
      </div>

      {/* Role Legend */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-400 font-medium">Roles:</span>
        {Object.entries(ROLE_STYLES).map(([role, cls]) => (
          <span key={role} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            {role.replace("_", " ")}
          </span>
        ))}
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["User", "Email", "Role", "Joined", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={5} className="py-12 text-center text-gray-400">Loading...</td></tr>}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <UserCog size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No admin users found</p>
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-brand-600">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[u.role]}`}>
                    {u.role === "SUPER_ADMIN" && <Shield size={10} />}
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(u.id, u.name)} disabled={deleting === u.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 float-right">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
