"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { PlatformLabel, ServiceStatusBadge } from "@/components/customer/customer-ui";
import type { Service, SocialPlatform } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatNumber } from "@/lib/format";

const columns: TableColumn<Service>[] = [
  { key: "code", header: "Code", render: (row) => <span className="mono-text">{row.code}</span> },
  { key: "name", header: "Service", render: (row) => <div className="table-primary"><strong>{row.name}</strong><small>{row.description}</small></div> },
  { key: "platform", header: "Platform", render: (row) => <PlatformLabel platform={row.platform} compact /> },
  { key: "rate", header: "Rate / 1K", render: (row) => <strong>{formatCurrency(row.ratePerThousand)}</strong> },
  { key: "min", header: "Min", render: (row) => formatNumber(row.min) },
  { key: "max", header: "Max", render: (row) => formatNumber(row.max) },
  { key: "status", header: "Status", render: (row) => <ServiceStatusBadge status={row.status} /> },
  { key: "action", header: "", render: (row) => row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="text-link">Order</Link> : <span className="muted-text">Unavailable</span> }
];

export default function PricingPage() {
  const resource = useAsyncResource(() => customerService.listServices());
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (resource.data ?? []).filter((service) => (platform === "all" || service.platform === platform) && (!query || `${service.code} ${service.name}`.toLocaleLowerCase().includes(query)));
  }, [resource.data, search, platform]);

  if (resource.loading) return <LoadingState label="Loading pricing..." />;
  if (resource.error) return <ErrorState title="Pricing could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="No pricing data" description="Pricing will appear when services are configured." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Pricing" title="Bảng giá" description="Bảng giá toàn bộ dịch vụ. Giá mock sẽ được thay bằng price version từ backend thật sau này." actions={<Link href="/services" className="button button--outline button--md">Xem catalog</Link>} />
      <Card className="filter-card"><div className="filter-grid filter-grid--pricing"><SearchInput value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Tìm dịch vụ hoặc mã..." aria-label="Search pricing" /><Select value={platform} onChange={(event) => setPlatform(event.currentTarget.value as SocialPlatform | "all")} options={[{ value: "all", label: "Tất cả nền tảng" }, { value: "facebook", label: "Facebook" }, { value: "tiktok", label: "TikTok" }, { value: "instagram", label: "Instagram" }, { value: "youtube", label: "YouTube" }, { value: "threads", label: "Threads" }]} /></div></Card>
      {filtered.length === 0 ? <EmptyState title="Không tìm thấy mức giá" description="Thử thay đổi từ khóa hoặc nền tảng." /> : <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Full service pricing" renderMobileItem={(row) => <Card className="mobile-list-card"><div className="mobile-list-card__head"><PlatformLabel platform={row.platform} compact /><ServiceStatusBadge status={row.status} /></div><strong>{row.name}</strong><small>{row.code}</small><div className="mobile-list-card__meta"><span>{formatCurrency(row.ratePerThousand)} / 1K</span><span>{formatNumber(row.min)} - {formatNumber(row.max)}</span></div>{row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="button button--outline button--sm">Đặt dịch vụ</Link> : null}</Card>} />}
    </div>
  );
}
