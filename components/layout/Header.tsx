"use client";

import { signOut } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface Props {
  user?: { name?: string | null; email?: string | null };
}

export default function Header({ user }: Props) {
  return (
    <header className="h-16 bg-surface border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1" />
      <ThemeToggle />
      <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 relative">
        <Bell size={18} />
      </button>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-none">{user?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
