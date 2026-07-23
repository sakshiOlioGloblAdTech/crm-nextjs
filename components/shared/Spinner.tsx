import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** A spinning loader icon (inherits brand color; adapts to dark mode). */
export function Spinner({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-brand-600", className)}
      aria-hidden
    />
  );
}

/** Full-area centered loader — for page bodies and route-level loading.tsx. */
export function PageLoader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-gray-400",
        className,
      )}
    >
      <Spinner size={30} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Loader that fills a table body while rows load (spans all columns). */
export function TableLoading({
  colSpan,
  label = "Loading…",
}: {
  colSpan: number;
  label?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <span className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Spinner size={18} /> {label}
        </span>
      </td>
    </tr>
  );
}
