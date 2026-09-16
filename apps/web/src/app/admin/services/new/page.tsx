"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminServiceForm } from "@/components/admin/admin-service-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { adminService } from "@/services/admin-service";
import type { AdminServiceInput } from "@/domain/admin";

export default function AdminNewServicePage() {
  const categories = useAsyncResource(() => adminService.listCategories()); const router = useRouter(); const { toast } = useToast(); const [busy, setBusy] = useState(false);
  if (categories.loading) return <LoadingState label="Đang tải danh mục..." />;
  if (categories.error || !categories.data) return <ErrorState title="Không thể tải danh mục" description={categories.error ?? "Dữ liệu không khả dụng."} onRetry={categories.reload} />;
  async function submit(input: AdminServiceInput) { setBusy(true); try { const service = await adminService.createService(input); toast({ tone: "success", title: "Đã tạo dịch vụ" }); router.push(`/admin/services/${service.id}`); } catch (error) { toast({ tone: "error", title: "Không thể tạo dịch vụ", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); } finally { setBusy(false); } }
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / SERVICES" title="Tạo dịch vụ" description="Giá là customer selling price; Work 05 chưa có provider cost." /><Card className="admin-form-card"><AdminServiceForm categories={categories.data} submitLabel="Tạo dịch vụ" busy={busy} onSubmit={submit} /></Card></div>;
}
