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
  { key: "code", header: "Mã", render: (row) => <span className="mono-text">{row.code}</span> },
  { key: "name", header: "Dịch vụ", render: (row) => <div className="table-primary"><strong>{row.name}</strong><small>{row.description}</small></div> },
  { key: "platform", header: "Nền tảng", render: (row) => <PlatformLabel platform={row.platform} compact /> },
  { key: "rate", header: "Giá / 1.000", render: (row) => <strong>{formatCurrency(row.ratePerThousand)}</strong> },
  { key: "min", header: "Tối thiểu", render: (row) => formatNumber(row.min) },
  { key: "max", header: "Tối đa", render: (row) => formatNumber(row.max) },
  { key: "status", header: "Trạng thái", render: (row) => <ServiceStatusBadge status={row.status} /> },
  { key: "action", header: "", render: (row) => row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="text-link">Đặt dịch vụ</Link> : <span className="muted-text">Không khả dụng</span> }
];

export default function PricingPage() {
  const resource = useAsyncResource(() => customerService.listServices());
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (resource.data ?? []).filter((service) => (platform === "all" || service.platform === platform) && (!query || `${service.code} ${service.name}`.toLocaleLowerCase().includes(query)));
  }, [resource.data, search, platform]);

  if (resource.loading) return <LoadingState label="Đang tải bảng giá..." />;
  if (resource.error) return <ErrorState title="Không thể tải bảng giá" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Chưa có dữ liệu bảng giá" description="Bảng giá sẽ xuất hiện khi dịch vụ được cấu hình." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Bảng giá" title="Bảng giá" description="Bảng giá hiện tại của toàn bộ dịch vụ đang khả dụng trên hệ thống." actions={<Link href="/services" className="button button--outline button--md">Xem danh mục dịch vụ</Link>} />
      <Card className="filter-card"><div className="filter-grid filter-grid--pricing"><SearchInput value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Tìm dịch vụ hoặc mã..." aria-label="Tìm kiếm bảng giá" /><Select value={platform} onChange={(event) => setPlatform(event.currentTarget.value as SocialPlatform | "all")} options={[{ value: "all", label: "Tất cả nền tảng" }, { value: "facebook", label: "Facebook" }, { value: "tiktok", label: "TikTok" }, { value: "instagram", label: "Instagram" }, { value: "youtube", label: "YouTube" }, { value: "threads", label: "Threads" }]} /></div></Card>
      {filtered.length === 0 ? <EmptyState title="Không tìm thấy mức giá" description="Thử thay đổi từ khóa hoặc nền tảng." /> : <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Bảng giá dịch vụ" renderMobileItem={(row) => <Card className="mobile-list-card"><div className="mobile-list-card__head"><PlatformLabel platform={row.platform} compact /><ServiceStatusBadge status={row.status} /></div><strong>{row.name}</strong><small>{row.code}</small><div className="mobile-list-card__meta"><span>{formatCurrency(row.ratePerThousand)} / 1.000</span><span>{formatNumber(row.min)} - {formatNumber(row.max)}</span></div>{row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="button button--outline button--sm">Đặt dịch vụ</Link> : null}</Card>} />}
    </div>
  );
}
