import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { ReactNode } from "react";

const tones: Record<string, BadgeTone> = {
  ACTIVE: "green", SUSPENDED: "red", PENDING: "amber", VALIDATING: "blue", SUBMITTED: "blue", PROCESSING: "blue",
  COMPLETED: "green", CONFIRMED: "green", FAILED: "red", CANCELLED: "neutral", PARTIAL: "purple", REFUNDED: "purple",
  MAINTENANCE: "amber", DISABLED: "neutral", DEGRADED: "amber", HEALTHY: "green", DOWN: "red", UNKNOWN: "neutral", AVAILABLE: "green", UNAVAILABLE: "red", REMOVED: "neutral", PRICE_REVIEW_REQUIRED: "red", PROVIDER_UNAVAILABLE: "red", MIN_MAX_CONFLICT: "amber", MANUAL_REVIEW: "amber", RETRY: "amber", RUNNING: "blue", OPEN: "green", WAITING_CUSTOMER: "amber", WAITING_SUPPORT: "blue", RESOLVED: "purple", CLOSED: "neutral"
};
const labels: Record<string, string> = {
  ACTIVE: "Hoạt động", SUSPENDED: "Tạm khóa", PENDING: "Đang chờ", VALIDATING: "Đang kiểm tra", SUBMITTED: "Đã gửi",
  PROCESSING: "Đang xử lý", COMPLETED: "Hoàn thành", CONFIRMED: "Đã xác nhận", FAILED: "Thất bại", CANCELLED: "Đã hủy",
  PARTIAL: "Một phần", REFUNDED: "Đã hoàn tiền", MAINTENANCE: "Bảo trì", DISABLED: "Vô hiệu", OPEN: "Mở",
  WAITING_CUSTOMER: "Chờ khách hàng", WAITING_SUPPORT: "Chờ hỗ trợ", RESOLVED: "Đã giải quyết", CLOSED: "Đã đóng",
  DEGRADED: "Suy giảm", HEALTHY: "Ổn định", DOWN: "Mất kết nối", UNKNOWN: "Chưa xác định", AVAILABLE: "Khả dụng", UNAVAILABLE: "Không khả dụng", REMOVED: "Đã gỡ", PRICE_REVIEW_REQUIRED: "Cần duyệt giá", PROVIDER_UNAVAILABLE: "Provider lỗi", MIN_MAX_CONFLICT: "Lệch min/max", MANUAL_REVIEW: "Cần duyệt", RETRY: "Đang retry", RUNNING: "Đang chạy"
};

export function AdminStatusBadge({ status }: { status: string }) {
  return <Badge tone={tones[status] ?? "neutral"}>{labels[status] ?? status}</Badge>;
}

export function AdminMetricCard({ label, value, note, icon }: { label: string; value: string | number; note?: string; icon?: ReactNode }) {
  return <Card className="admin-metric-card"><div className="admin-metric-card__head"><span>{label}</span>{icon ? <span className="admin-metric-card__icon">{icon}</span> : null}</div><strong>{typeof value === "number" ? formatNumber(value) : value}</strong>{note ? <small>{note}</small> : null}</Card>;
}

export function AdminMoneyMetric({ label, value, note }: { label: string; value: number; note?: string }) {
  return <AdminMetricCard label={label} value={formatCurrency(value)} note={note} />;
}

export function AdminBarChart({ title, values, format = "number" }: { title: string; values: { label: string; value: number }[]; format?: "number" | "currency" }) {
  const max = Math.max(...values.map((item) => item.value), 1);
  return <Card className="admin-chart-card"><div className="admin-section-head"><div><h2>{title}</h2><p>Dữ liệu lấy trực tiếp từ PostgreSQL.</p></div></div><div className="admin-bar-chart">{values.map((item) => <div key={item.label} className="admin-bar-chart__row"><span>{item.label}</span><progress className="admin-bar-chart__progress" max={max} value={item.value} aria-label={`${item.label}: ${item.value}`} /><strong>{format === "currency" ? formatCurrency(item.value) : formatNumber(item.value)}</strong></div>)}</div></Card>;
}

export function AdminDefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="admin-definition-list">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
