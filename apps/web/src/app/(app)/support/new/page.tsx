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
    const nextErrors = { subject: required(subject, "Subject"), message: required(message, "Message") };
    if (message.trim() && message.trim().length < 10) nextErrors.message = "Message should contain at least 10 characters.";
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.message) return;
    setSubmitting(true);
    try {
      const ticket = await customerService.createTicket({ subject: subject.trim(), category, message: message.trim() });
      setTicketId(ticket.id);
      toast({ tone: "success", title: "Ticket created", description: `${ticket.id} is now open.` });
    } catch (reason) {
      toast({ tone: "error", title: "Ticket could not be created", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  }

  if (ticketId) {
    return <div className="customer-page narrow-page"><PageHeader eyebrow="Support" title="Ticket đã được tạo" description="Bo phan hỗ trợ co the tra loi trong cung conversation." /><Card className="success-panel"><span className="success-panel__mark">OK</span><h2>{ticketId}</h2><p>Yêu cầu của bạn đã được ghi nhan.</p><div className="button-row"><Link href={`/support/${ticketId}`} className="button button--primary button--md">Mở hội thoại</Link><Link href="/support" className="button button--outline button--md">Danh sách ticket</Link></div></Card></div>;
  }

  return (
    <div className="customer-page narrow-page">
      <PageHeader eyebrow="Support" title="Tạo ticket mới" description="Mô tả vấn đề rõ ràng và kèm mã đơn nếu liên quan." actions={<Link href="/support" className="button button--outline button--md">Quay lại</Link>} />
      <Card className="form-card">
        <div className="form-stack">
          <Input label="Subject" required value={subject} error={errors.subject} onChange={(event) => { setSubject(event.currentTarget.value); setErrors((current) => ({ ...current, subject: undefined })); }} placeholder="Ví dụ: Đơn TT... chưa cập nhật" />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.currentTarget.value)} options={[{ value: "Order", label: "Order" }, { value: "Wallet", label: "Wallet / Deposit" }, { value: "Service", label: "Service" }, { value: "Account", label: "Account" }, { value: "Other", label: "Other" }]} />
          <Textarea label="Message" required value={message} error={errors.message} onChange={(event) => { setMessage(event.currentTarget.value); setErrors((current) => ({ ...current, message: undefined })); }} rows={7} placeholder="Mô tả chi tiết vấn đề..." />
          <div className="form-actions"><Link href="/support" className="button button--outline button--md">Hủy</Link><Button onClick={submit} loading={submitting}>Gửi ticket</Button></div>
        </div>
      </Card>
    </div>
  );
}
