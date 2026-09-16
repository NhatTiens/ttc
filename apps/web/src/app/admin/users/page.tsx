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
import type { AdminUserListItem } from "@/domain/admin";

const columns: TableColumn<AdminUserListItem>[] = [
  { key: "user", header: "Khách hàng", render: (row) => <div className="table-primary"><Link className="text-link" href={`/admin/users/${row.id}`}><strong>{row.name}</strong></Link><small>{row.email}</small><small className="admin-mono">{row.id}</small></div> },
  { key: "phone", header: "Điện thoại", render: (row) => row.phone || "—" },
  { key: "status", header: "Trạng thái", render: (row) => <AdminStatusBadge status={row.status} /> },
  { key: "wallet", header: "Số dư", render: (row) => <strong>{formatCurrency(row.walletBalance)}</strong> },
  { key: "orders", header: "Đơn", render: (row) => row.orderCount },
  { key: "joined", header: "Tham gia", render: (row) => formatDateTime(row.joinedAt) },
  { key: "actions", header: "Thao tác", render: (row) => <Link className="text-link" href={`/admin/users/${row.id}`}>Chi tiết</Link> }
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const key = useMemo(() => JSON.stringify({ search, status, sort, page }), [search, status, sort, page]);
  const resource = useAsyncResource(() => adminService.listUsers({ search, status, sort, page, pageSize: 20 }), key);
  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN / CUSTOMERS" title="Khách hàng" description="Tra cứu tài khoản, trạng thái, số dư và hoạt động của khách hàng." />
    <Card className="admin-filter-card"><div className="admin-filter-grid"><SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Tên, email, điện thoại..." /><Select value={status} onChange={(event) => { setStatus(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả trạng thái" }, { value: "ACTIVE", label: "Hoạt động" }, { value: "SUSPENDED", label: "Tạm khóa" }]} /><Select value={sort} onChange={(event) => setSort(event.currentTarget.value)} options={[{ value: "newest", label: "Mới nhất" }, { value: "oldest", label: "Cũ nhất" }, { value: "name", label: "Tên A-Z" }]} /></div></Card>
    {resource.loading ? <LoadingState label="Đang tải khách hàng..." /> : resource.error ? <ErrorState title="Không thể tải khách hàng" description={resource.error} onRetry={resource.reload} /> : !resource.data || resource.data.items.length === 0 ? <EmptyState title="Không có khách hàng phù hợp" description="Thử thay đổi bộ lọc hoặc từ khóa." /> : <><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={(row) => row.id} caption="Danh sách khách hàng" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link className="text-link" href={`/admin/users/${row.id}`}><strong>{row.name}</strong></Link><AdminStatusBadge status={row.status} /></div><span>{row.email}</span><div className="admin-mobile-card__meta"><span>{formatCurrency(row.walletBalance)}</span><span>{row.orderCount} đơn</span></div></Card>} /><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination" /></>}
  </div>;
}
