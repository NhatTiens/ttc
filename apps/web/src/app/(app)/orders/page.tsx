"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { OrderStatus, type OrderStatusValue } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination, ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { PlatformLabel, TextLink } from "@/components/customer/customer-ui";
import type { Order, SocialPlatform } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

const statuses: Array<{ value: OrderStatusValue | "all"; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "Processing", label: "Processing" },
  { value: "Completed", label: "Completed" },
  { value: "Pending", label: "Pending" },
  { value: "Failed", label: "Failed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Partial", label: "Partial" },
  { value: "Refunded", label: "Refunded" }
];

const platformOptions: Array<{ value: SocialPlatform | "all"; label: string }> = [
  { value: "all", label: "Tất cả nền tảng" }, { value: "facebook", label: "Facebook" }, { value: "tiktok", label: "TikTok" }, { value: "instagram", label: "Instagram" }, { value: "youtube", label: "YouTube" }, { value: "threads", label: "Threads" }
];

const columns: TableColumn<Order>[] = [
  { key: "id", header: "Order", render: (row) => <TextLink href={`/orders/${row.id}`}>{row.id}</TextLink> },
  { key: "service", header: "Service", render: (row) => <div className="table-primary"><strong>{row.serviceName}</strong><small>{row.targetUrl}</small></div> },
  { key: "platform", header: "Platform", render: (row) => <PlatformLabel platform={row.platform} compact /> },
  { key: "quantity", header: "Quantity", render: (row) => formatNumber(row.quantity) },
  { key: "charge", header: "Charge", render: (row) => formatCurrency(row.charge) },
  { key: "status", header: "Status", render: (row) => <OrderStatus status={row.status} /> },
  { key: "date", header: "Created", render: (row) => <span className="table-date">{formatDateTime(row.createdAt)}</span> }
];

export default function OrdersPage() {
  const resource = useAsyncResource(() => customerService.listOrders());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatusValue | "all">("all");
  const [platform, setPlatform] = useState<SocialPlatform | "all">("all");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const orders = resource.data ?? [];
    const filterAnchor = orders.reduce((latest, order) => Math.max(latest, Date.parse(order.createdAt)), 0);
    const maxDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : null;
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (platform !== "all" && order.platform !== platform) return false;
      if (maxDays && filterAnchor - Date.parse(order.createdAt) > maxDays * 86400000) return false;
      return !query || `${order.id} ${order.serviceName} ${order.targetUrl}`.toLocaleLowerCase().includes(query);
    });
  }, [resource.data, search, status, platform, dateRange]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetPage = () => setPage(1);

  if (resource.loading) return <LoadingState label="Loading orders..." />;
  if (resource.error) return <ErrorState title="Orders could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="No order data" description="Order history will appear here." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Orders" title="Đơn hàng" description="Tìm, lọc và theo dõi toàn bộ đơn hàng đã tạo." actions={<Link href="/order/new" className="button button--primary button--md">Tạo đơn mới</Link>} />
      <Card className="filter-card">
        <div className="filter-grid filter-grid--orders">
          <SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); resetPage(); }} placeholder="Tìm mã đơn, dịch vụ, link..." aria-label="Search orders" />
          <Select value={status} onChange={(event) => { setStatus(event.currentTarget.value as OrderStatusValue | "all"); resetPage(); }} options={statuses} aria-label="Filter by status" />
          <Select value={platform} onChange={(event) => { setPlatform(event.currentTarget.value as SocialPlatform | "all"); resetPage(); }} options={platformOptions} aria-label="Filter by platform" />
          <Select value={dateRange} onChange={(event) => { setDateRange(event.currentTarget.value as typeof dateRange); resetPage(); }} options={[{ value: "all", label: "Tất cả thời gian" }, { value: "7d", label: "7 ngày" }, { value: "30d", label: "30 ngày" }, { value: "90d", label: "90 ngày" }]} aria-label="Filter by date" />
        </div>
      </Card>

      {filtered.length === 0 ? <EmptyState title="Không có đơn phù hợp" description="Thử đổi điều kiện lọc hoặc tạo đơn mới." action={<Link href="/order/new" className="button button--primary button--sm">Tạo đơn</Link>} /> : (
        <>
          <ResponsiveTable columns={columns} rows={pagedRows} getRowKey={(row) => row.id} caption="Order history" renderMobileItem={(row) => (
            <Card className="mobile-list-card">
              <div className="mobile-list-card__head"><TextLink href={`/orders/${row.id}`}>{row.id}</TextLink><OrderStatus status={row.status} /></div>
              <strong>{row.serviceName}</strong>
              <PlatformLabel platform={row.platform} compact />
              <div className="mobile-list-card__meta"><span>{formatNumber(row.quantity)} đơn vị</span><span>{formatCurrency(row.charge)}</span></div>
              <small>{formatDateTime(row.createdAt)}</small>
            </Card>
          )} />
          <div className="list-footer"><span>Hiển thị {pagedRows.length} / {filtered.length} đơn</span><Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} /></div>
        </>
      )}
    </div>
  );
}
