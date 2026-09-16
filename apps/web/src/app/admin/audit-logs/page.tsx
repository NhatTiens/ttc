"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Drawer } from "@/components/ui/overlays";
import { Pagination, ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminAuditLog } from "@/domain/admin";

const columns: TableColumn<AdminAuditLog>[] = [
  { key: "time", header: "Thời gian", render: (row) => formatDateTime(row.timestamp) },
  { key: "admin", header: "Admin", render: (row) => row.adminName },
  { key: "action", header: "Action", render: (row) => <strong>{row.action}</strong> },
  { key: "entity", header: "Entity", render: (row) => <div className="table-primary"><strong>{row.entityType}</strong><small>{row.entityId}</small></div> }
];

const actions = ["USER_SUSPEND","USER_ACTIVATE","WALLET_ADJUSTMENT","DEPOSIT_CONFIRM","DEPOSIT_FAIL","DEPOSIT_CANCEL","ORDER_REFUND","SERVICE_CREATE","SERVICE_UPDATE","SERVICE_STATUS_CHANGE","SERVICE_PRICE_CHANGE","CATEGORY_CREATE","CATEGORY_UPDATE","SUPPORT_REPLY","SUPPORT_STATUS_CHANGE","SYSTEM_SETTING_UPDATE"];
const entityTypes = ["USER","WALLET","DEPOSIT","ORDER","SERVICE","CATEGORY","SUPPORT_TICKET","SYSTEM_SETTING"];

export default function Audit() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [admin, setAdmin] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminAuditLog | null>(null);
  const dependency = useMemo(() => JSON.stringify({ search, action, entityType, admin, dateRange, page }), [search, action, entityType, admin, dateRange, page]);
  const resource = useAsyncResource(() => adminService.listAuditLogs({ search, action, entityType, admin, dateRange, page, pageSize: 20 }), dependency);
  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN / AUDIT" title="Nhật ký quản trị" description="Theo dõi các thao tác nhạy cảm. Password, auth secret và API token không được lưu trong audit." />
    <Card className="admin-filter-card"><div className="admin-filter-grid admin-filter-grid--wide">
      <SearchInput value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(1); }} placeholder="Entity ID, action..." />
      <SearchInput value={admin} onChange={(event) => { setAdmin(event.currentTarget.value); setPage(1); }} placeholder="Tên/email admin..." aria-label="Lọc admin" />
      <Select value={action} onChange={(event) => { setAction(event.currentTarget.value); setPage(1); }} options={[{ value: "", label: "Tất cả action" }, ...actions.map((value) => ({ value, label: value }))]} />
      <Select value={entityType} onChange={(event) => { setEntityType(event.currentTarget.value); setPage(1); }} options={[{ value: "", label: "Tất cả entity" }, ...entityTypes.map((value) => ({ value, label: value }))]} />
      <Select value={dateRange} onChange={(event) => { setDateRange(event.currentTarget.value); setPage(1); }} options={[{ value: "all", label: "Mọi thời gian" }, { value: "today", label: "Hôm nay" }, { value: "7d", label: "7 ngày" }, { value: "30d", label: "30 ngày" }, { value: "90d", label: "90 ngày" }]} />
    </div></Card>
    {resource.loading ? <LoadingState label="Đang tải audit log..." /> : resource.error ? <ErrorState title="Không thể tải audit log" description={resource.error} onRetry={resource.reload} /> : !resource.data || !resource.data.items.length ? <EmptyState title="Chưa có audit log phù hợp" description="Các thao tác quản trị sẽ xuất hiện tại đây." /> : <>
      <ResponsiveTable columns={[...columns, { key: "detail", header: "", render: (row) => <button className="text-link admin-link-button" onClick={() => setSelected(row)}>Chi tiết</button> }]} rows={resource.data.items} getRowKey={(row) => row.id} caption="Admin audit logs" renderMobileItem={(row) => <Card className="admin-mobile-card" onClick={() => setSelected(row)}><div className="admin-mobile-card__head"><strong>{row.action}</strong><small>{formatDateTime(row.timestamp)}</small></div><span>{row.entityType} · {row.entityId}</span><small>{row.adminName}</small></Card>} />
      <Pagination page={resource.data.page} pageCount={resource.data.pageCount} onPageChange={setPage} className="admin-pagination" />
    </>}
    <Drawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title="Chi tiết audit log"><div className="admin-audit-detail"><p><strong>Action</strong><br />{selected?.action}</p><p><strong>Entity</strong><br />{selected?.entityType} · {selected?.entityId}</p><p><strong>Admin</strong><br />{selected?.adminName}</p><p><strong>IP</strong><br />{selected?.ipAddress || "—"}</p><h3>Before</h3><pre>{JSON.stringify(selected?.before ?? null, null, 2)}</pre><h3>After</h3><pre>{JSON.stringify(selected?.after ?? null, null, 2)}</pre><h3>Metadata</h3><pre>{JSON.stringify(selected?.metadata ?? null, null, 2)}</pre></div></Drawer>
  </div>;
}
