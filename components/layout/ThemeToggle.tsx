"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "crm-theme";

/**
 * Light/dark switch. Flips the `dark` class on <html>, which re-maps the
 * palette variables in globals.css (see the .dark block) — so the whole admin
 * flips without per-component dark: variants. Choice persists in localStorage;
 * the inline script in layout.tsx applies it before paint to avoid a flash.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync from whatever the pre-hydration script already decided.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // storage blocked — theme still applies for this session
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
