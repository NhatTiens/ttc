"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { customerService } from "@/services/customer-service";
import { required } from "@/validation/customer";

export default function NewSupportTicketPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  async function submit() {
    const nextErrors = { subject: required(subject, "Tiêu đề"), message: required(message, "Nội dung") };
    if (message.trim() && message.trim().length < 10) nextErrors.message = "Nội dung cần có ít nhất 10 ký tự.";
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.message) return;
    setSubmitting(true);
    try {
      const ticket = await customerService.createTicket({ subject: subject.trim(), category, message: message.trim() });
      setTicketId(ticket.id);
      toast({ tone: "success", title: "Đã tạo yêu cầu hỗ trợ", description: `${ticket.id} đã được mở.` });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể tạo yêu cầu hỗ trợ", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketId) {
    return <div className="customer-page narrow-page"><PageHeader eyebrow="Hỗ trợ" title="Yêu cầu hỗ trợ đã được tạo" description="Bộ phận hỗ trợ có thể trả lời trong cùng cuộc hội thoại." /><Card className="success-panel"><span className="success-panel__mark">OK</span><h2>{ticketId}</h2><p>Yêu cầu của bạn đã được ghi nhận.</p><div className="button-row"><Link href={`/support/${ticketId}`} className="button button--primary button--md">Mở hội thoại</Link><Link href="/support" className="button button--outline button--md">Danh sách yêu cầu</Link></div></Card></div>;
  }

  return (
    <div className="customer-page narrow-page">
      <PageHeader eyebrow="Hỗ trợ" title="Tạo yêu cầu hỗ trợ mới" description="Mô tả vấn đề rõ ràng và kèm mã đơn nếu liên quan." actions={<Link href="/support" className="button button--outline button--md">Quay lại</Link>} />
      <Card className="form-card">
        <div className="form-stack">
          <Input label="Tiêu đề" required value={subject} error={errors.subject} onChange={(event) => { setSubject(event.currentTarget.value); setErrors((current) => ({ ...current, subject: undefined })); }} placeholder="Ví dụ: Đơn TT... chưa cập nhật" />
          <Select label="Danh mục" value={category} onChange={(event) => setCategory(event.currentTarget.value)} options={[{ value: "Order", label: "Đơn hàng" }, { value: "Wallet", label: "Ví / Nạp tiền" }, { value: "Service", label: "Dịch vụ" }, { value: "Account", label: "Tài khoản" }, { value: "Other", label: "Khác" }]} />
          <Textarea label="Nội dung" required value={message} error={errors.message} onChange={(event) => { setMessage(event.currentTarget.value); setErrors((current) => ({ ...current, message: undefined })); }} rows={7} placeholder="Mô tả chi tiết vấn đề..." />
          <div className="form-actions"><Link href="/support" className="button button--outline button--md">Hủy</Link><Button onClick={submit} loading={submitting}>Gửi yêu cầu</Button></div>
        </div>
      </Card>
    </div>
  );
}
