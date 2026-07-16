// ─────────────────────────────────────────────────────────
// FormField — reusable input wrapper with validation UI
// Shows red border + error message when invalid
// Shows green border when valid (after first touch)
// ─────────────────────────────────────────────────────────
"use client";

interface FormFieldProps {
  label:        string;
  error?:       string;
  touched?:     boolean;
  required?:    boolean;
  hint?:        string;
  children:     React.ReactNode;
}

export default function FormField({
  label, error, touched, required, hint, children,
}: FormFieldProps) {
  const showError = touched && error;
  const showValid = touched && !error;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Wrap children to apply border color */}
      <div className={`relative rounded-xl transition-all ${
        showError ? "ring-2 ring-red-400 rounded-xl"  :
        showValid ? "ring-2 ring-emerald-400 rounded-xl" : ""
      }`}>
        {children}
      </div>

      {/* Error message */}
      {showError && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
            <path d="M6 3.5V6.5" stroke="currentColor" strokeLinecap="round"/>
            <circle cx="6" cy="8.5" r="0.5" fill="currentColor"/>
          </svg>
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !showError && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

// ── Shared input class builders ──────────────────────────

export function inputClass(error?: string, touched?: boolean) {
  const base = "w-full px-3 py-2 border rounded-xl text-sm focus:outline-none transition-all";
  if (touched && error)  return `${base} border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-200`;
  if (touched && !error) return `${base} border-emerald-300 bg-surface focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200`;
  return `${base} border-gray-200 bg-surface focus:border-brand-400 focus:ring-2 focus:ring-brand-200`;
}

export function selectClass(error?: string, touched?: boolean) {
  return inputClass(error, touched);
}

export function textareaClass(error?: string, touched?: boolean) {
  return inputClass(error, touched);
}
