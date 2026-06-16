import { cn } from "@/lib/utils";
import {
  OrderStatus, ReturnStatus, WarrantyStatus,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  RETURN_STATUS_LABELS, RETURN_STATUS_COLORS,
  WARRANTY_STATUS_COLORS,
} from "@/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", ORDER_STATUS_COLORS[status])}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", RETURN_STATUS_COLORS[status])}>
      {RETURN_STATUS_LABELS[status]}
    </span>
  );
}

export function WarrantyStatusBadge({ status }: { status: WarrantyStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", WARRANTY_STATUS_COLORS[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
    )}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
