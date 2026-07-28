"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Admin image picker → uploads to R2 via POST /api/uploads (same-origin, so the
 * NextAuth session cookie authorizes it) and returns the public URL through
 * `onUploaded`. Validates type + size on the client for a fast, clear error;
 * the server enforces its own limits regardless.
 */
export function ImageUpload({
  folder = "products",
  maxBytes = DEFAULT_MAX_BYTES,
  label = "Upload image",
  onUploaded,
}: {
  folder?: string;
  maxBytes?: number;
  label?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxMb = Math.round(maxBytes / (1024 * 1024));

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after an error
    if (!file) return;

    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use a PNG, JPG or WEBP image.");
      return;
    }
    if (file.size > maxBytes) {
      setError(`Image is too large (max ${maxMb} MB).`);
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onUploaded(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
