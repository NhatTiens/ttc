"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AdminServiceForm } from "@/components/admin/admin-service-form";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminServiceInput } from "@/domain/admin";

export default function AdminServiceDetailPage() {
  const params = useParams<{ id: string }>(); const id = params.id;
  const serviceResource = useAsyncResource(() => adminService.getService(id), id); const categoryResource = useAsyncResource(() => adminService.listCategories());
  const { toast } = useToast(); const [busy, setBusy] = useState(false);
  if (serviceResource.loading || categoryResource.loading) return <LoadingState label="Đang tải dịch vụ..." />;
  if (serviceResource.error || categoryResource.error || !serviceResource.data || !categoryResource.data) return <ErrorState title="Không thể tải dịch vụ" description={serviceResource.error ?? categoryResource.error ?? "Dữ liệu không khả dụng."} onRetry={() => { serviceResource.reload(); categoryResource.reload(); }} />;
  const service = serviceResource.data;
  const initial: AdminServiceInput = { code: service.code, name: service.name, description: service.description, platform: service.platform, categoryId: service.categoryId, ratePerThousand: service.ratePerThousand, min: service.min, max: service.max, averageTime: service.averageTime, popular: service.popular, status: service.status, priceChangeReason: "" };
  async function submit(input: AdminServiceInput) { if (input.ratePerThousand !== service.ratePerThousand && (input.priceChangeReason?.trim().length ?? 0) < 4) { toast({ tone: "error", title: "Cần lý do thay đổi giá", description: "Nhập lý do ít nhất 4 ký tự để audit thay đổi giá." }); return; } setBusy(true); try { await adminService.updateService(id, input); toast({ tone: "success", title: "Đã cập nhật dịch vụ" }); serviceResource.reload(); } catch (error) { toast({ tone: "error", title: "Không thể cập nhật dịch vụ", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); } finally { setBusy(false); } }
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / SERVICES" title={service.name} description={`${service.code} · ${service.platform}`} actions={<AdminStatusBadge status={service.status} />} /><Card className="admin-form-card"><AdminServiceForm key={service.updatedAt} initial={initial} categories={categoryResource.data} submitLabel="Lưu thay đổi" busy={busy} onSubmit={submit} /></Card><Card className="admin-section-card"><div className="admin-section-head"><div><h2>Lịch sử giá</h2><p>Mọi thay đổi customer selling price đều được lưu dấu vết.</p></div></div><div className="admin-ledger-list">{service.priceHistory.map((history, index) => <div key={`${history.createdAt}-${index}`}><span><strong>{formatCurrency(history.previousRate)} → {formatCurrency(history.newRate)}</strong><small>{history.reason || "Không có ghi chú"}</small></span><span><strong>{history.adminName}</strong><small>{formatDateTime(history.createdAt)}</small></span></div>)}{service.priceHistory.length === 0 ? <p className="muted-text">Chưa có thay đổi giá.</p> : null}</div></Card></div>;
}
