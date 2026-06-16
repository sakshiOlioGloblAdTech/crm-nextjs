import { OrderStatus, ReturnStatus, WarrantyStatus, UserRole, PaymentMode } from "@prisma/client";

export type { OrderStatus, ReturnStatus, WarrantyStatus, UserRole, PaymentMode };

/** Matches PHP OrderStatus enum labels/colors exactly */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Payment Pending",
  PLACED:          "Placed",
  PROCESSING:      "Processing",
  SHIPPED:         "Shipped",
  DELIVERED:       "Delivered",
  COMPLETED:       "Completed",
  CANCELLED:       "Cancelled",
  REFUNDED:        "Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "bg-red-100 text-red-800",
  PLACED:          "bg-blue-100 text-blue-800",
  PROCESSING:      "bg-yellow-100 text-yellow-800",
  SHIPPED:         "bg-green-100 text-green-800",
  DELIVERED:       "bg-green-100 text-green-800",
  COMPLETED:       "bg-green-100 text-green-800",
  CANCELLED:       "bg-red-100 text-red-800",
  REFUNDED:        "bg-green-100 text-green-800",
};

/** Current orders (matches PHP getEloquentQuery filter) */
export const CURRENT_ORDER_STATUSES: OrderStatus[] = [
  "PLACED",
  "PAYMENT_PENDING",
  "PROCESSING",
  "SHIPPED",
];

/** Past orders */
export const PAST_ORDER_STATUSES: OrderStatus[] = [
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  PENDING:   "Pending",
  APPROVED:  "Approved",
  REJECTED:  "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  APPROVED:  "bg-green-100 text-green-800",
  REJECTED:  "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export const WARRANTY_STATUS_COLORS: Record<WarrantyStatus, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};
