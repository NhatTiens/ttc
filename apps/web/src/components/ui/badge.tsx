import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red" | "purple";

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn("badge", `badge--${tone}`, className)} {...props} />;
}

export type OrderStatusValue = "Processing" | "Completed" | "Pending" | "Failed" | "Cancelled" | "Partial" | "Refunded";

const statusTone: Record<OrderStatusValue, BadgeTone> = {
  Processing: "blue",
  Completed: "green",
  Pending: "amber",
  Failed: "red",
  Cancelled: "neutral",
  Partial: "purple",
  Refunded: "purple"
};

const statusLabel: Record<OrderStatusValue, string> = {
  Processing: "Đang xử lý",
  Completed: "Hoàn thành",
  Pending: "Đang chờ",
  Failed: "Thất bại",
  Cancelled: "Đã hủy",
  Partial: "Hoàn thành một phần",
  Refunded: "Đã hoàn tiền"
};

export function orderStatusLabel(status: OrderStatusValue) {
  return statusLabel[status];
}

export function StatusBadge({ status }: { status: OrderStatusValue }) {
  return <Badge tone={statusTone[status]} className="status-badge"><span className="status-dot" aria-hidden="true" />{statusLabel[status]}</Badge>;
}

export function OrderStatus({ status }: { status: OrderStatusValue }) {
  return <StatusBadge status={status} />;
}
