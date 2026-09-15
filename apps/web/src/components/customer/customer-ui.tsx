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
  threads: "Threads"
};

export function platformName(platform: SocialPlatform) {
  return platformNames[platform];
}

export function PlatformLabel({ platform, compact = false }: { platform: SocialPlatform; compact?: boolean }) {
  return <span className={cn("platform-label", compact && "platform-label--compact")}><PlatformIcon platform={platform} size="sm" /><span>{platformNames[platform]}</span></span>;
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const tone = status === "Active" ? "green" : status === "Paused" ? "amber" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const tone = status === "Resolved" ? "green" : status === "Waiting" ? "amber" : status === "Open" ? "blue" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const tone = status === "Completed" ? "green" : status === "Pending" ? "amber" : "red";
  return <Badge tone={tone}>{status}</Badge>;
}

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const tone = type === "Deposit" ? "blue" : type === "Purchase" ? "neutral" : type === "Refund" ? "green" : "purple";
  return <Badge tone={tone}>{type}</Badge>;
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
