"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminDefinitionList, AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/overlays";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";

const refundable = new Set(["PENDING", "VALIDATING", "FAILED", "CANCELLED"]);

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>(); const id = params.id;
  const resource = useAsyncResource(() => adminService.getOrder(id), id);
  const { toast } = useToast();
  const [dialog, setDialog] = useState(false); const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  if (resource.loading) return <LoadingState label="Đang tải đơn hàng..." />;
  if (resource.error || !resource.data) return <ErrorState title="Không thể tải đơn hàng" description={resource.error ?? "Không tìm thấy đơn hàng."} onRetry={resource.reload} />;
  const order = resource.data;
  async function refund() { if (reason.trim().length < 4) { toast({ tone: "error", title: "Vui lòng nhập lý do hoàn tiền" }); return; } setBusy(true); try { await adminService.refundOrder(id, reason.trim()); toast({ tone: "success", title: "Đã hoàn tiền đơn hàng" }); setDialog(false); resource.reload(); } catch (error) { toast({ tone: "error", title: "Không thể hoàn tiền", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); } finally { setBusy(false); } }
  const canAdminRefund = refundable.has(order.status) && !order.provider;
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / ORDERS" title={order.id} description={`${order.serviceName} · ${order.customerName}`} actions={canAdminRefund ? <Button variant="danger" onClick={() => setDialog(true)}>Hoàn tiền</Button> : undefined} />
    <div className="admin-detail-grid"><Card className="admin-detail-card"><div className="admin-section-head"><h2>Đơn hàng</h2><AdminStatusBadge status={order.status} /></div><AdminDefinitionList items={[{ label: "Khách hàng", value: <Link className="text-link" href={`/admin/users/${order.customerId}`}>{order.customerName}</Link> }, { label: "Dịch vụ", value: order.serviceName }, { label: "Platform", value: order.platform }, { label: "Target URL", value: <a className="text-link admin-break" href={order.targetUrl} target="_blank" rel="noreferrer">{order.targetUrl}</a> }, { label: "Số lượng", value: order.quantity.toLocaleString("vi-VN") }, { label: "Chi phí", value: formatCurrency(order.charge) }, { label: "Còn lại", value: order.remaining.toLocaleString("vi-VN") }, { label: "Tạo lúc", value: formatDateTime(order.createdAt) }, { label: "Cập nhật", value: formatDateTime(order.updatedAt) }]} /></Card>
      <Card className="admin-detail-card"><div className="admin-section-head"><h2>Provider routing</h2></div>{order.provider ? <AdminDefinitionList items={[{ label: "Provider", value: order.provider.providerName }, { label: "Provider service", value: order.provider.providerServiceName }, { label: "External order ID", value: order.provider.externalOrderId || "—" }, { label: "Submission", value: order.provider.submissionState }, { label: "Provider status", value: order.provider.providerStatus }, { label: "Attempts", value: order.provider.attempts }, { label: "Provider cost", value: formatCurrency(order.provider.providerCost) }, { label: "Customer charge", value: formatCurrency(order.provider.customerCharge) }, { label: "Gross margin", value: formatCurrency(order.provider.grossMargin) }, { label: "Submitted", value: order.provider.submittedAt ? formatDateTime(order.provider.submittedAt) : "—" }, { label: "Last check", value: order.provider.lastCheckedAt ? formatDateTime(order.provider.lastCheckedAt) : "—" }]} /> : <><p>Chưa có provider submission cho đơn này.</p><div className="inline-alert">Provider internals chỉ hiển thị trong Admin Console. Customer không nhận provider name, external service ID hoặc provider cost.</div></>}</Card></div>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Timeline</h2></div><div className="admin-timeline">{order.timeline.map((event, index) => <div key={`${event.createdAt}-${index}`} className="admin-timeline__item"><span className="admin-timeline__dot" /><div><strong>{event.toStatus}</strong><p>{event.message}</p><small>{formatDateTime(event.createdAt)}</small></div></div>)}</div></Card>
    <Card className="admin-section-card"><div className="admin-section-head"><h2>Wallet ledger liên quan</h2></div><div className="admin-ledger-list">{order.walletTransactions.map((transaction) => <div key={transaction.id}><span><strong>{transaction.type}</strong><small>{transaction.description}</small></span><span><strong>{formatCurrency(transaction.amount)}</strong><small>{formatDateTime(transaction.createdAt)}</small></span></div>)}{order.walletTransactions.length === 0 ? <p className="muted-text">Không có ledger liên quan.</p> : null}</div></Card>
    <Modal open={dialog} onOpenChange={setDialog} title="Xác nhận hoàn tiền" description={`${order.customerName} · ${order.id} · ${formatCurrency(order.charge)}`} size="sm" footer={<><Button variant="outline" onClick={() => setDialog(false)}>Hủy</Button><Button variant="danger" loading={busy} onClick={refund}>Hoàn tiền</Button></>}><Textarea label="Lý do hoàn tiền" value={reason} onChange={(event) => setReason(event.currentTarget.value)} placeholder="Ghi rõ lý do để lưu audit log..." /></Modal>
  </div>;
}
