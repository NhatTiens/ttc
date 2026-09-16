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
import { formatDateTime, formatProviderMoney } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminProvider } from "@/domain/admin";

const columns: TableColumn<AdminProvider>[] = [
  { key: "provider", header: "Provider", render: (row) => <div className="table-primary"><Link href={`/admin/providers/${row.id}`} className="text-link"><strong>{row.name}</strong></Link><small>{row.code}</small></div> },
  { key: "status", header: "Status", render: (row) => <div className="table-primary"><AdminStatusBadge status={row.status} /><small>Health: {row.health}</small></div> },
  { key: "connection", header: "Connection", render: (row) => <div className="table-primary"><span>{row.baseUrlConfigured ? "URL configured" : "No verified URL"}</span><small>{row.credentialConfigured ? "Credential configured" : "No credential"}</small></div> },
  { key: "balance", header: "Balance", render: (row) => row.balance === null ? "—" : formatProviderMoney(row.balance, row.balanceCurrency) },
  { key: "services", header: "Services", render: (row) => <div className="table-primary"><span>{row.services} total</span><small>{row.mappedServices} mapped · {row.unmappedServices} unmapped</small></div> },
  { key: "last", header: "Last success", render: (row) => row.lastSuccessfulAt ? formatDateTime(row.lastSuccessfulAt) : "—" }
];

export default function AdminProvidersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const key = useMemo(() => JSON.stringify({ search, status, page }), [search, status, page]);
  const resource = useAsyncResource(() => adminService.listProviders({ search, status, page, pageSize: 20 }), key);
  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN / PROVIDERS" title="Nhà cung cấp" description="Provider routing, service sync, mapping và health. Secret chỉ tồn tại server-side và không được hiển thị tại đây." />
    <Card className="admin-filter-card"><div className="admin-filter-grid"><SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Tên hoặc mã provider..." /><Select value={status} onChange={(event) => { setStatus(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Tất cả trạng thái" }, { value: "ACTIVE", label: "Active" }, { value: "DEGRADED", label: "Degraded" }, { value: "DISABLED", label: "Disabled" }]} /></div></Card>
    {resource.loading ? <LoadingState label="Đang tải provider..." /> : resource.error ? <ErrorState title="Không thể tải provider" description={resource.error} onRetry={resource.reload} /> : !resource.data || resource.data.items.length === 0 ? <EmptyState title="Chưa có provider" description="Provider được quản lý từ database, không hard-code ở frontend." /> : <><ResponsiveTable columns={columns} rows={resource.data.items} getRowKey={(row) => row.id} caption="Danh sách provider" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link href={`/admin/providers/${row.id}`} className="text-link"><strong>{row.name}</strong></Link><AdminStatusBadge status={row.status} /></div><span>{row.code} · {row.health}</span><div className="admin-mobile-card__meta"><span>{row.mappedServices}/{row.services} mapped</span><span>{row.balance === null ? "Balance —" : `Balance ${formatProviderMoney(row.balance, row.balanceCurrency)}`}</span></div></Card>} /><Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination" /></>}
  </div>;
}
