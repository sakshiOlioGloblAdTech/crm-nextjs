// ─────────────────────────────────────────────────────────
// Validation Library — used across all CRM forms
// ─────────────────────────────────────────────────────────

export type ValidationRule = {
  required?:  boolean;
  minLength?: number;
  maxLength?: number;
  min?:       number;
  max?:       number;
  pattern?:   RegExp;
  email?:     boolean;
  url?:       boolean;
  message?:   string; // custom error message
};

export type ValidationRules<T> = Partial<Record<keyof T, ValidationRule>>;
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

// Validate a single field value against its rules
export function validateField(value: any, rules: ValidationRule): string {
  const val = typeof value === "string" ? value.trim() : value;

  if (rules.required && (val === "" || val === null || val === undefined)) {
    return rules.message ?? "This field is required";
  }

  if (val === "" || val === null || val === undefined) return ""; // not required and empty = ok

  if (rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return rules.message ?? "Enter a valid email address";
  }

  if (rules.url) {
    try { new URL(val); } catch {
      return rules.message ?? "Enter a valid URL (e.g. https://example.com)";
    }
  }

  if (rules.minLength && String(val).length < rules.minLength) {
    return rules.message ?? `Must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && String(val).length > rules.maxLength) {
    return rules.message ?? `Must be no more than ${rules.maxLength} characters`;
  }

  if (rules.min !== undefined && Number(val) < rules.min) {
    return rules.message ?? `Must be at least ${rules.min}`;
  }

  if (rules.max !== undefined && Number(val) > rules.max) {
    return rules.message ?? `Must be no more than ${rules.max}`;
  }

  if (rules.pattern && !rules.pattern.test(String(val))) {
    return rules.message ?? "Invalid format";
  }

  return "";
}

// Validate entire form — returns errors object
export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: ValidationRules<T>
): ValidationErrors<T> {
  const errors: ValidationErrors<T> = {};
  for (const key in rules) {
    const rule  = rules[key as keyof T];
    const value = values[key as keyof T];
    if (rule) {
      const error = validateField(value, rule);
      if (error) errors[key as keyof T] = error;
    }
  }
  return errors;
}

// Check if there are any errors
export function hasErrors<T>(errors: ValidationErrors<T>): boolean {
  return Object.values(errors).some((e) => e !== "");
}
