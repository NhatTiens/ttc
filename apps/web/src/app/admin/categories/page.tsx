"use client";

import { useState } from "react";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-controls";
import { ConfirmDialog, Modal } from "@/components/ui/overlays";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { adminService } from "@/services/admin-service";
import type { AdminCategory } from "@/domain/admin";

export default function AdminCategoriesPage() {
  const resource = useAsyncResource(() => adminService.listCategories());
  const { toast } = useToast();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [busy, setBusy] = useState(false);

  function openCreate() { setId(""); setName(""); setSortOrder("0"); setNewOpen(true); }
  function openEdit(category: AdminCategory) { setEditing(category); setName(category.name); setSortOrder(String(category.sortOrder)); }
  async function create() {
    setBusy(true);
    try { await adminService.createCategory({ id: id.trim().toLowerCase(), name: name.trim(), sortOrder: Number(sortOrder), enabled: true }); toast({ tone: "success", title: "Đã tạo danh mục" }); setNewOpen(false); resource.reload(); }
    catch (error) { toast({ tone: "error", title: "Không thể tạo danh mục", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }
  async function save(enabled = editing?.enabled ?? true) {
    if (!editing) return;
    setBusy(true);
    try { await adminService.updateCategory(editing.id, { name: name.trim(), sortOrder: Number(sortOrder), enabled }); toast({ tone: "success", title: "Đã cập nhật danh mục" }); setEditing(null); resource.reload(); }
    catch (error) { toast({ tone: "error", title: "Không thể cập nhật danh mục", description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }
  if (resource.loading) return <LoadingState label="Đang tải danh mục..." />;
  if (resource.error || !resource.data) return <ErrorState title="Không thể tải danh mục" description={resource.error ?? "Dữ liệu không khả dụng."} onRetry={resource.reload} />;
  return <div className="admin-page"><PageHeader eyebrow="ADMIN / CATEGORIES" title="Danh mục dịch vụ" description="Danh mục đang được dịch vụ tham chiếu được bảo vệ khỏi thao tác gây lỗi dữ liệu." actions={<Button onClick={openCreate}>Tạo danh mục</Button>} />
    <div className="admin-category-grid">{resource.data.map((category) => <Card key={category.id} className="admin-category-card"><div className="admin-category-card__head"><div><strong>{category.name}</strong><small>{category.id}</small></div><AdminStatusBadge status={category.enabled ? "ACTIVE" : "DISABLED"} /></div><div className="admin-category-card__meta"><span>{category.serviceCount} dịch vụ</span><span>Thứ tự {category.sortOrder}</span></div><Button variant="outline" size="sm" onClick={() => openEdit(category)}>Chỉnh sửa</Button></Card>)}</div>
    <Modal open={newOpen} onOpenChange={setNewOpen} title="Tạo danh mục" size="sm" footer={<><Button variant="outline" onClick={() => setNewOpen(false)}>Hủy</Button><Button loading={busy} onClick={create}>Tạo</Button></>}><div className="admin-form-stack"><Input label="Mã danh mục" value={id} onChange={(event) => setId(event.currentTarget.value)} hint="Chữ thường, số, dấu gạch ngang/gạch dưới." /><Input label="Tên danh mục" value={name} onChange={(event) => setName(event.currentTarget.value)} /><Input label="Thứ tự" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value)} /></div></Modal>
    <Modal open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title="Chỉnh sửa danh mục" description={editing?.id} size="sm" footer={<><Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>{editing?.enabled ? <Button variant="danger" onClick={() => setConfirmDisable(true)}>Tắt danh mục</Button> : <Button variant="secondary" onClick={() => save(true)}>Bật lại</Button>}<Button loading={busy} onClick={() => save()}>Lưu</Button></>}><div className="admin-form-stack"><Input label="Tên danh mục" value={name} onChange={(event) => setName(event.currentTarget.value)} /><Input label="Thứ tự" type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.currentTarget.value)} /></div></Modal>
    <ConfirmDialog open={confirmDisable} onOpenChange={setConfirmDisable} destructive title="Tắt danh mục?" description="Chỉ có thể tắt khi không còn dịch vụ chưa bị vô hiệu hóa tham chiếu đến danh mục này." confirmLabel="Tắt danh mục" onConfirm={() => save(false)} />
  </div>;
}
