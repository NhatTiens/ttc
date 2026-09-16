"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Pagination, ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminOrder } from "@/domain/admin";

const columns: TableColumn<AdminOrder>[] = [
  { key: "id", header: "Order ID", render: (row) => <Link href={`/admin/orders/${row.id}`} className="text-link">{row.id}</Link> },
  { key: "customer", header: "Khách hàng", render: (row) => <div className="table-primary"><strong>{row.customerName}</strong><small>{row.customerEmail}</small></div> },
  { key: "service", header: "Dịch vụ", render: (row) => <div className="table-primary"><strong>{row.serviceName}</strong><small>{row.serviceCode} · {row.platform}</small></div> },
  { key: "quantity", header: "Số lượng", render: (row) => row.quantity.toLocaleString("vi-VN") },
  { key: "charge", header: "Chi phí", render: (row) => formatCurrency(row.charge) },
  { key: "status", header: "Trạng thái", render: (row) => <AdminStatusBadge status={row.status} /> },
  { key: "created", header: "Tạo lúc", render: (row) => formatDateTime(row.createdAt) },
  { key: "updated", header: "Cập nhật", render: (row) => formatDateTime(row.updatedAt) }
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [serviceId, setServiceId] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [page, setPage] = useState(1);
  const serviceOptions = useAsyncResource(() => adminService.listServices({ page: 1, pageSize: 100 }), "admin-order-service-filter");
  const dependency = useMemo(() => JSON.stringify({ search, customer, serviceId, platform, status, dateRange, page }), [search, customer, serviceId, platform, status, dateRange, page]);
  const resource = useAsyncResource(() => adminService.listOrders({ search, customer, serviceId: serviceId === "all" ? undefined : serviceId, platform, status, dateRange, page, pageSize: 20 }), dependency);
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / ORDERS" title="Đơn hàng" description="Theo dõi đơn hàng nội bộ. Work 05 không giả lập lifecycle của provider." />
    <Card className="admin-filter-card"><div className="admin-filter-grid admin-filter-grid--wide"><SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Order ID, URL, dịch vụ..." /><SearchInput value={customer} onChange={(event) => { setCustomer(event.currentTarget.value); setPage(1); }} placeholder="Tên/email khách hàng..." aria-label="Lọc khách hàng" /><Select value={serviceId} onChange={(event) => { setServiceId(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả dịch vụ" }, ...(serviceOptions.data?.items ?? []).map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))]} /><Select value={platform} onChange={(event) => { setPlatform(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả nền tảng" }, ...["FACEBOOK","TIKTOK","INSTAGRAM","YOUTUBE","THREADS"].map((value) => ({ value, label: value }))]} /><Select value={status} onChange={(event) => { setStatus(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả trạng thái" }, ...["PENDING","VALIDATING","SUBMITTED","PROCESSING","COMPLETED","PARTIAL","FAILED","CANCELLED","REFUNDED"].map((value) => ({ value, label: value }))]} /><Select value={dateRange} onChange={(event) => { setDateRange(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Mọi thời gian" }, { value: "today", label: "Hôm nay" }, { value: "7d", label: "7 ngày" }, { value: "30d", label: "30 ngày" }, { value: "90d", label: "90 ngày" }]} /></div></Card>
    {resource.loading ? <LoadingState label="Đang tải đơn hàng..." /> : resource.error ? <ErrorState title="Không thể tải đơn hàng" description={resource.error} onRetry={resource.reload} /> : !resource.data || resource.data.items.length === 0 ? <EmptyState title="Không có đơn hàng phù hợp" description="Thử điều chỉnh bộ lọc." /> : <><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={(row) => row.id} caption="Danh sách đơn hàng quản trị" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link href={`/admin/orders/${row.id}`} className="text-link">{row.id}</Link><AdminStatusBadge status={row.status} /></div><strong>{row.serviceName}</strong><span>{row.customerName}</span><div className="admin-mobile-card__meta"><span>{row.quantity.toLocaleString("vi-VN")}</span><span>{formatCurrency(row.charge)}</span></div></Card>} /><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination" /></>}
  </div>;
}
