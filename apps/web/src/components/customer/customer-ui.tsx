import Link from "next/link";
import type { ReactNode } from "react";
import { PlatformIcon } from "@/components/brand/platform-icons";
import type { ServiceStatus, SocialPlatform, TicketStatus, TransactionStatus, TransactionType } from "@/domain/customer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

const platformNames: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  threads: "Threads",
  google: "Google Maps"
};

export function platformName(platform: SocialPlatform) {
  return platformNames[platform];
}

export function PlatformLabel({ platform, compact = false }: { platform: SocialPlatform; compact?: boolean }) {
  return <span className={cn("platform-label", compact && "platform-label--compact")}><PlatformIcon platform={platform} size="sm" /><span>{platformNames[platform]}</span></span>;
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const tone = status === "Active" ? "green" : status === "Paused" ? "amber" : "neutral";
  const labels: Record<ServiceStatus, string> = { Active: "Đang hoạt động", Paused: "Tạm dừng", Maintenance: "Bảo trì" };
  return <Badge tone={tone}>{labels[status]}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const tone = status === "Resolved" ? "green" : status === "Waiting" ? "amber" : status === "Open" ? "blue" : "neutral";
  const labels: Record<TicketStatus, string> = { Open: "Đang mở", Waiting: "Đang chờ", Resolved: "Đã xử lý", Closed: "Đã đóng" };
  return <Badge tone={tone}>{labels[status]}</Badge>;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const tone = status === "Completed" ? "green" : status === "Pending" ? "amber" : "red";
  const labels: Record<TransactionStatus, string> = { Completed: "Hoàn thành", Pending: "Đang chờ", Failed: "Thất bại" };
  return <Badge tone={tone}>{labels[status]}</Badge>;
}

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const tone = type === "Deposit" ? "blue" : type === "Purchase" ? "neutral" : type === "Refund" ? "green" : "purple";
  const labels: Record<TransactionType, string> = { Deposit: "Nạp tiền", Purchase: "Mua dịch vụ", Refund: "Hoàn tiền", Adjustment: "Điều chỉnh" };
  return <Badge tone={tone}>{labels[type]}</Badge>;
}


export function supportCategoryLabel(category: string) {
  const labels: Record<string, string> = { Order: "Đơn hàng", Wallet: "Ví / Nạp tiền", Service: "Dịch vụ", Account: "Tài khoản", Other: "Khác" };
  return labels[category] ?? category;
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="section-header"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div className="section-header__action">{action}</div> : null}</div>;
}

export function DetailGrid({ items }: { items: Array<{ label: string; value: ReactNode; wide?: boolean }> }) {
  return <dl className="detail-grid">{items.map((item) => <div key={item.label} className={cn("detail-grid__item", item.wide && "detail-grid__item--wide")}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-link">{children}</Link>;
}

export function MoneyValue({ value }: { value: number }) {
  return <span className={cn("money-value", value < 0 && "money-value--negative", value > 0 && "money-value--positive")}>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value)}</span>;
}
