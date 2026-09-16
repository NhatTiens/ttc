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
import { formatCurrency } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminService } from "@/domain/admin";

const columns: TableColumn<AdminService>[] = [
  { key: "service", header: "Dịch vụ", render: (row) => <div className="table-primary"><Link href={`/admin/services/${row.id}`} className="text-link"><strong>{row.name}</strong></Link><small>{row.code}</small></div> },
  { key: "platform", header: "Nền tảng", render: (row) => row.platform },
  { key: "category", header: "Danh mục", render: (row) => row.categoryName },
  { key: "price", header: "Giá / 1.000", render: (row) => <strong>{formatCurrency(row.ratePerThousand)}</strong> },
  { key: "range", header: "Min / Max", render: (row) => `${row.min.toLocaleString("vi-VN")} / ${row.max.toLocaleString("vi-VN")}` },
  { key: "status", header: "Trạng thái", render: (row) => <AdminStatusBadge status={row.status} /> },
  { key: "orders", header: "Đơn", render: (row) => row.orderCount }
];

export default function AdminServicesPage() {
  const [search, setSearch] = useState(""); const [platform, setPlatform] = useState("all"); const [category, setCategory] = useState("all"); const [status, setStatus] = useState("all"); const [page, setPage] = useState(1);
  const categories = useAsyncResource(() => adminService.listCategories(), "admin-service-category-filter");
  const dependency = useMemo(() => JSON.stringify({ search, platform, category, status, page }), [search, platform, category, status, page]);
  const resource = useAsyncResource(() => adminService.listServices({ search, platform, category: category === "all" ? undefined : category, status, page, pageSize: 20 }), dependency);
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / SERVICES" title="Dịch vụ" description="Quản lý catalog và giá bán cho khách hàng. Provider cost chưa thuộc Work 05." actions={<Link href="/admin/services/new" className="button button--primary button--md">Tạo dịch vụ</Link>} />
    <Card className="admin-filter-card"><div className="admin-filter-grid"><SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Tên hoặc mã dịch vụ..." /><Select value={platform} onChange={(event) => { setPlatform(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả nền tảng" }, ...["FACEBOOK","TIKTOK","INSTAGRAM","YOUTUBE","THREADS","GOOGLE"].map((value) => ({ value, label: value }))]} /><Select value={category} onChange={(event) => { setCategory(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả danh mục" }, ...(categories.data ?? []).map((item) => ({ value: item.id, label: item.name }))]} /><Select value={status} onChange={(event) => { setStatus(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả trạng thái" }, { value: "ACTIVE", label: "Hoạt động" }, { value: "MAINTENANCE", label: "Bảo trì" }, { value: "DISABLED", label: "Vô hiệu" }]} /></div></Card>
    {resource.loading ? <LoadingState label="Đang tải dịch vụ..." /> : resource.error ? <ErrorState title="Không thể tải dịch vụ" description={resource.error} onRetry={resource.reload} /> : !resource.data || resource.data.items.length === 0 ? <EmptyState title="Không có dịch vụ phù hợp" description="Thử thay đổi bộ lọc." /> : <><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={(row) => row.id} caption="Danh sách dịch vụ" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link href={`/admin/services/${row.id}`} className="text-link">{row.code}</Link><AdminStatusBadge status={row.status} /></div><strong>{row.name}</strong><span>{row.platform} · {row.categoryName}</span><div className="admin-mobile-card__meta"><strong>{formatCurrency(row.ratePerThousand)}/1.000</strong><span>{row.orderCount} đơn</span></div></Card>} /><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination" /></>}
  </div>;
}
