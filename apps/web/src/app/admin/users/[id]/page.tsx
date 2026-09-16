"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminDefinitionList, AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/form-controls";
import { ConfirmDialog, Modal } from "@/components/ui/overlays";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminDeposit, AdminOrder, AdminTransaction } from "@/domain/admin";

const transactionColumns: TableColumn<AdminTransaction>[] = [
  { key: "date", header: "Thời gian", render: (row) => formatDateTime(row.createdAt) },
  { key: "type", header: "Loại", render: (row) => row.type },
  { key: "amount", header: "Số tiền", render: (row) => <strong>{formatCurrency(row.amount)}</strong> },
  { key: "balance", header: "Số dư sau", render: (row) => formatCurrency(row.balanceAfter) },
  { key: "description", header: "Nội dung", render: (row) => row.description }
];
const orderColumns: TableColumn<AdminOrder>[] = [
  { key: "id", header: "Đơn", render: (row) => <Link href={`/admin/orders/${row.id}`} className="text-link">{row.id}</Link> },
  { key: "service", header: "Dịch vụ", render: (row) => row.serviceName },
  { key: "charge", header: "Chi phí", render: (row) => formatCurrency(row.charge) },
  { key: "status", header: "Trạng thái", render: (row) => <AdminStatusBadge status={row.status} /> },
  { key: "created", header: "Tạo lúc", render: (row) => formatDateTime(row.createdAt) }
];
const depositColumns: TableColumn<AdminDeposit>[] = [
  { key: "id", header: "Yêu cầu", render: (row) => <Link href={`/admin/deposits/${row.id}`} className="text-link">{row.id}</Link> },
  { key: "method", header: "Phương thức", render: (row) => row.methodName },
  { key: "amount", header: "Số tiền", render: (row) => formatCurrency(row.amount) },
  { key: "status", header: "Trạng thái", render: (row) => <AdminStatusBadge status={row.status} /> },
  { key: "created", header: "Tạo lúc", render: (row) => formatDateTime(row.createdAt) }
];

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const resource = useAsyncResource(() => adminService.getUser(id), id);
  const { toast } = useToast();
  const [statusDialog, setStatusDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [amount, setAmount] = useState("100000");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (resource.loading) return <LoadingState label="Đang tải hồ sơ khách hàng..." />;
  if (resource.error || !resource.data) return <ErrorState title="Không thể tải khách hàng" description={resource.error ?? "Không tìm thấy dữ liệu."} onRetry={resource.reload} />;
  const user = resource.data;
  const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  async function changeStatus() {
    setBusy(true);
    try { await adminService.setUserStatus(id, nextStatus); toast({ tone: "success", title: nextStatus === "SUSPENDED" ? "Đã tạm khóa khách hàng" : "Đã kích hoạt khách hàng" }); resource.reload(); }
    catch (error) { toast({ tone: "error", title: "Không thể cập nhật trạng thái", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }
  async function adjust() {
    const numeric = Number(amount);
    if (!Number.isSafeInteger(numeric) || numeric === 0 || reason.trim().length < 4) { toast({ tone: "error", title: "Thông tin điều chỉnh chưa hợp lệ", description: "Nhập số tiền nguyên khác 0 và lý do ít nhất 4 ký tự." }); return; }
    setBusy(true);
    try { await adminService.adjustWallet(id, numeric, reason.trim()); toast({ tone: "success", title: "Đã điều chỉnh ví", description: `${numeric > 0 ? "+" : ""}${formatCurrency(numeric)}` }); setAdjustDialog(false); setReason(""); resource.reload(); }
    catch (error) { toast({ tone: "error", title: "Điều chỉnh ví thất bại", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }

  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN / CUSTOMERS" title={user.name} description={user.email} actions={<div className="button-row"><Button variant="outline" onClick={() => setAdjustDialog(true)}>Điều chỉnh ví</Button><Button variant={user.status === "ACTIVE" ? "danger" : "primary"} onClick={() => setStatusDialog(true)}>{user.status === "ACTIVE" ? "Tạm khóa" : "Kích hoạt"}</Button></div>} />
    <div className="admin-detail-grid">
      <Card className="admin-detail-card"><div className="admin-section-head"><h2>Hồ sơ</h2><AdminStatusBadge status={user.status} /></div><AdminDefinitionList items={[{ label: "User ID", value: user.id }, { label: "Vai trò", value: user.role }, { label: "Email", value: user.email }, { label: "Điện thoại", value: user.phone || "—" }, { label: "Tham gia", value: formatDateTime(user.joinedAt) }, { label: "Cập nhật", value: formatDateTime(user.updatedAt) }]} /></Card>
      <Card className="admin-detail-card"><div className="admin-section-head"><h2>Ví</h2></div><div className="admin-balance-hero"><span>Số dư hiện tại</span><strong>{formatCurrency(user.walletBalance)}</strong><small>Dự trữ: {formatCurrency(user.reservedBalance)}</small></div><p className="muted-text">Mọi điều chỉnh đều tạo WalletTransaction và AdminAuditLog; không sửa balance trực tiếp.</p></Card>
    </div>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Giao dịch gần đây</h2></div>{user.transactions.length ? <ResponsiveTable columns={transactionColumns} rows={user.transactions} getRowKey={(row) => row.id} caption="Giao dịch khách hàng" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><strong>{row.type}</strong><span>{formatCurrency(row.amount)}</span></div><small>{formatDateTime(row.createdAt)}</small><p>{row.description}</p></Card>} /> : <p className="muted-text">Chưa có giao dịch.</p>}</Card>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Đơn hàng</h2></div>{user.orders.length ? <ResponsiveTable columns={orderColumns} rows={user.orders} getRowKey={(row) => row.id} caption="Đơn hàng khách hàng" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link href={`/admin/orders/${row.id}`} className="text-link">{row.id}</Link><AdminStatusBadge status={row.status} /></div><span>{row.serviceName}</span><strong>{formatCurrency(row.charge)}</strong></Card>} /> : <p className="muted-text">Chưa có đơn hàng.</p>}</Card>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Yêu cầu nạp tiền</h2></div>{user.deposits.length ? <ResponsiveTable columns={depositColumns} rows={user.deposits} getRowKey={(row) => row.id} caption="Yêu cầu nạp tiền" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><Link href={`/admin/deposits/${row.id}`} className="text-link">{row.id}</Link><AdminStatusBadge status={row.status} /></div><strong>{formatCurrency(row.amount)}</strong><small>{row.methodName}</small></Card>} /> : <p className="muted-text">Chưa có yêu cầu nạp tiền.</p>}</Card>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Hỗ trợ</h2></div><div className="admin-link-list">{user.tickets.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`}><span><strong>{ticket.subject}</strong><small>{ticket.id}</small></span><AdminStatusBadge status={ticket.status} /></Link>)}{user.tickets.length === 0 ? <p className="muted-text">Chưa có yêu cầu hỗ trợ.</p> : null}</div></Card>
    <ConfirmDialog open={statusDialog} onOpenChange={setStatusDialog} destructive={user.status === "ACTIVE"} title={user.status === "ACTIVE" ? "Tạm khóa khách hàng?" : "Kích hoạt lại khách hàng?"} description={user.status === "ACTIVE" ? `${user.name} sẽ bị vô hiệu phiên hiện tại và không thể thực hiện các thao tác Customer cho đến khi được kích hoạt lại.` : `${user.name} sẽ có thể đăng nhập và sử dụng lại các chức năng Customer.`} confirmLabel={user.status === "ACTIVE" ? "Tạm khóa" : "Kích hoạt"} onConfirm={changeStatus} />
    <Modal open={adjustDialog} onOpenChange={setAdjustDialog} title="Điều chỉnh ví" description={`Khách hàng: ${user.name} · Số dư: ${formatCurrency(user.walletBalance)}`} size="sm" footer={<><Button variant="outline" onClick={() => setAdjustDialog(false)}>Hủy</Button><Button loading={busy} onClick={adjust}>Xác nhận điều chỉnh</Button></>}><div className="admin-form-stack"><Input label="Số tiền (VND)" type="number" value={amount} onChange={(event) => setAmount(event.currentTarget.value)} hint="Số dương để cộng, số âm để trừ." /><Textarea label="Lý do" value={reason} onChange={(event) => setReason(event.currentTarget.value)} placeholder="Ví dụ: Điều chỉnh theo biên bản đối soát..." /></div></Modal>
  </div>;
}
