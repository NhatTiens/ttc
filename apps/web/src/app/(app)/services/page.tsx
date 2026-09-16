"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { PlatformLabel, ServiceStatusBadge, SectionHeader } from "@/components/customer/customer-ui";
import type { Service, SocialPlatform } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatNumber } from "@/lib/format";

const platforms: Array<{ value: SocialPlatform | "all"; label: string }> = [
  { value: "all", label: "Tất cả nền tảng" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
  { value: "google", label: "Google Maps" }
];

const columns: TableColumn<Service>[] = [
  { key: "service", header: "Dịch vụ", render: (row) => <div className="table-primary"><strong>{row.name}</strong><small>{row.code} - {row.description}</small></div> },
  { key: "platform", header: "Nền tảng", render: (row) => <PlatformLabel platform={row.platform} compact /> },
  { key: "price", header: "Giá / 1.000", render: (row) => <strong>{formatCurrency(row.ratePerThousand)}</strong> },
  { key: "range", header: "Tối thiểu / Tối đa", render: (row) => <span>{formatNumber(row.min)} / {formatNumber(row.max)}</span> },
  { key: "speed", header: "Thời gian dự kiến", render: (row) => row.averageTime },
  { key: "status", header: "Trạng thái", render: (row) => <ServiceStatusBadge status={row.status} /> },
  { key: "action", header: "", render: (row) => row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="button button--outline button--sm">Đặt dịch vụ</Link> : <span className="button button--secondary button--sm is-disabled-link" aria-disabled="true">Tạm dừng</span> }
];

function ServicesPageContent() {
  const searchParams = useSearchParams();
  const initialPlatform = searchParams.get("platform") as SocialPlatform | null;
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform | "all">(platforms.some((item) => item.value === initialPlatform) ? initialPlatform ?? "all" : "all");
  const [category, setCategory] = useState("all");
  const resource = useAsyncResource(async () => {
    const [services, categories] = await Promise.all([customerService.listServices(), customerService.listCategories()]);
    return { services, categories };
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (resource.data?.services ?? []).filter((service) => {
      if (platform !== "all" && service.platform !== platform) return false;
      if (category !== "all" && service.category !== category) return false;
      return !query || `${service.code} ${service.name} ${service.description}`.toLocaleLowerCase().includes(query);
    });
  }, [resource.data, search, platform, category]);

  if (resource.loading) return <LoadingState label="Đang tải dịch vụ..." />;
  if (resource.error) return <ErrorState title="Không thể tải danh sách dịch vụ" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Chưa có dịch vụ khả dụng" description="Dịch vụ sẽ xuất hiện tại đây sau khi danh mục được cấu hình." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Danh mục" title="Dịch vụ" description="Tìm dịch vụ theo nền tảng, nhóm dịch vụ và mức giá. Giá hiển thị là giá bán hiện tại." actions={<Link href="/pricing" className="button button--outline button--md">Xem bảng giá</Link>} />

      <Card className="filter-card">
        <div className="filter-grid filter-grid--services">
          <SearchInput value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Tìm theo tên hoặc mã dịch vụ..." aria-label="Tìm kiếm dịch vụ" />
          <Select value={platform} onChange={(event) => setPlatform(event.currentTarget.value as SocialPlatform | "all")} options={platforms} aria-label="Lọc theo nền tảng" />
          <Select value={category} onChange={(event) => setCategory(event.currentTarget.value)} options={[{ value: "all", label: "Tất cả danh mục" }, ...resource.data.categories.map((item) => ({ value: item.id, label: item.name }))]} aria-label="Lọc theo danh mục" />
        </div>
      </Card>

      <SectionHeader title={`${filtered.length} dịch vụ`} description="Giá được tính trên mỗi 1.000 đơn vị trừ khi có ghi chú khác." />
      {filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy dịch vụ" description="Thử đổi từ khóa hoặc bớt bộ lọc." />
      ) : (
        <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Danh mục dịch vụ" renderMobileItem={(row) => (
          <Card className="service-mobile-card">
            <div className="service-mobile-card__head"><PlatformLabel platform={row.platform} /><ServiceStatusBadge status={row.status} /></div>
            <div><strong>{row.name}</strong><p>{row.description}</p><small>{row.code}</small></div>
            <div className="service-mobile-card__metrics"><span><small>Giá / 1.000</small><strong>{formatCurrency(row.ratePerThousand)}</strong></span><span><small>Tối thiểu / Tối đa</small><strong>{formatNumber(row.min)} / {formatNumber(row.max)}</strong></span></div>
            <div className="service-mobile-card__footer"><span>Dự kiến {row.averageTime}</span>{row.status === "Active" ? <Link href={`/order/new?service=${row.id}`} className="button button--primary button--sm">Đặt dịch vụ</Link> : null}</div>
          </Card>
        )} />
      )}
    </div>
  );
}


export default function ServicesPage() {
  return (
    <Suspense fallback={<LoadingState label="Đang tải dịch vụ..." />}>
      <ServicesPageContent />
    </Suspense>
  );
}
