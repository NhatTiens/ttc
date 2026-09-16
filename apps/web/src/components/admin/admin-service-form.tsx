"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/overlays";
import type { AdminCategory, AdminServiceInput } from "@/domain/admin";

const platforms = ["FACEBOOK", "TIKTOK", "INSTAGRAM", "YOUTUBE", "THREADS", "GOOGLE"] as const;
const statuses = ["ACTIVE", "MAINTENANCE", "DISABLED"] as const;

export function AdminServiceForm({ initial, categories, submitLabel, busy, onSubmit }: { initial?: AdminServiceInput; categories: AdminCategory[]; submitLabel: string; busy?: boolean; onSubmit: (input: AdminServiceInput) => void }) {
  const [form, setForm] = useState<AdminServiceInput>(initial ?? { code: "", name: "", description: "", platform: "FACEBOOK", categoryId: categories[0]?.id ?? "", ratePerThousand: 0, min: 100, max: 100000, averageTime: "0–24 giờ", popular: false, status: "ACTIVE", priceChangeReason: "" });
  const [confirmDisable, setConfirmDisable] = useState(false);
  const update = <K extends keyof AdminServiceInput>(key: K, value: AdminServiceInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  function submit() { if (initial && initial.status !== "DISABLED" && form.status === "DISABLED") { setConfirmDisable(true); return; } onSubmit(form); }
  return <div className="admin-form-stack">
    <div className="admin-form-grid"><Input label="Mã dịch vụ" required value={form.code} onChange={(event) => update("code", event.currentTarget.value)} /><Input label="Tên dịch vụ" required value={form.name} onChange={(event) => update("name", event.currentTarget.value)} /><Select label="Nền tảng" value={form.platform} onChange={(event) => update("platform", event.currentTarget.value as AdminServiceInput["platform"])} options={platforms.map((value) => ({ value, label: value }))} /><Select label="Danh mục" value={form.categoryId} onChange={(event) => update("categoryId", event.currentTarget.value)} options={categories.filter((category) => category.enabled || category.id === initial?.categoryId).map((category) => ({ value: category.id, label: `${category.name}${category.enabled ? "" : " (đã tắt)"}` }))} /></div>
    <Textarea label="Mô tả" required value={form.description} onChange={(event) => update("description", event.currentTarget.value)} />
    <div className="admin-form-grid"><Input label="Giá / 1.000 (VND)" type="number" min={0} value={form.ratePerThousand} onChange={(event) => update("ratePerThousand", Number(event.currentTarget.value))} /><Input label="Số lượng tối thiểu" type="number" min={1} value={form.min} onChange={(event) => update("min", Number(event.currentTarget.value))} /><Input label="Số lượng tối đa" type="number" min={1} value={form.max} onChange={(event) => update("max", Number(event.currentTarget.value))} /><Input label="Thời gian trung bình" value={form.averageTime} onChange={(event) => update("averageTime", event.currentTarget.value)} /></div>
    <div className="admin-form-grid"><Select label="Trạng thái" value={form.status} onChange={(event) => update("status", event.currentTarget.value as AdminServiceInput["status"])} options={statuses.map((value) => ({ value, label: value }))} /><Input label="Lý do đổi giá" value={form.priceChangeReason ?? ""} onChange={(event) => update("priceChangeReason", event.currentTarget.value)} hint="Nên ghi rõ lý do khi chỉnh giá; nội dung được lưu vào lịch sử giá/audit." /><label className="admin-checkbox"><input type="checkbox" checked={form.popular} onChange={(event) => update("popular", event.currentTarget.checked)} /><span>Dịch vụ nổi bật</span></label></div>
    <div className="button-row"><Button loading={busy} onClick={submit}>{submitLabel}</Button></div>
    <ConfirmDialog open={confirmDisable} onOpenChange={setConfirmDisable} destructive title="Vô hiệu hóa dịch vụ?" description="Khách hàng sẽ không thể tạo đơn mới cho dịch vụ này. Các đơn và lịch sử cũ vẫn được giữ nguyên." confirmLabel="Vô hiệu hóa" onConfirm={() => onSubmit(form)} />
  </div>;
}
