"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/form-controls";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/identity";
import { TicketStatusBadge, supportCategoryLabel } from "@/components/customer/customer-ui";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function SupportThreadView({ ticketId }: { ticketId: string }) {
  const resource = useAsyncResource(() => customerService.getTicket(ticketId), ticketId);
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!message.trim()) { setError("Vui lòng nhập nội dung phản hồi."); return; }
    setSending(true);
    try {
      await customerService.sendSupportMessage(ticketId, message.trim());
      setMessage("");
      resource.reload();
      toast({ tone: "success", title: "Đã gửi phản hồi" });
    } catch (reason) {
      toast({ tone: "error", title: "Không thể gửi phản hồi", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setSending(false);
    }
  }

  if (resource.loading) return <LoadingState label="Đang tải hội thoại..." />;
  if (resource.error) return <ErrorState title="Không thể tải yêu cầu hỗ trợ" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <ErrorState title="Không tìm thấy yêu cầu hỗ trợ" description="Yêu cầu hỗ trợ này không tồn tại." />;

  const { ticket, messages } = resource.data;
  const closed = ticket.status === "Closed" || ticket.status === "Resolved";
  return (
    <div className="customer-page">
      <PageHeader eyebrow="Hội thoại hỗ trợ" title={ticket.subject} description={`${ticket.id} - ${supportCategoryLabel(ticket.category)}`} actions={<><TicketStatusBadge status={ticket.status} /><Link href="/support" className="button button--outline button--md">Quay lại</Link></>} />
      <div className="support-thread-layout">
        <Card className="conversation-card">
          <div className="conversation-list" aria-label="Tin nhắn hỗ trợ">
            {messages.map((item) => <article key={item.id} className={cn("message-bubble-row", item.sender === "customer" && "message-bubble-row--customer")}><UserAvatar name={item.senderName} size="sm" /><div className="message-bubble"><div><strong>{item.senderName}</strong><time>{formatDateTime(item.createdAt)}</time></div><p>{item.body}</p></div></article>)}
          </div>
          <div className="conversation-composer">
            <Textarea label="Phản hồi" value={message} onChange={(event) => { setMessage(event.currentTarget.value); setError(""); }} error={error} rows={4} disabled={closed} placeholder={closed ? "Yêu cầu này đã được xử lý." : "Nhập nội dung phản hồi..."} />
            <div className="form-actions"><span className="muted-text">Phản hồi sẽ xuất hiện trong cuộc hội thoại này sau khi gửi.</span><Button onClick={send} loading={sending} disabled={closed}>Gửi phản hồi</Button></div>
          </div>
        </Card>
        <aside><Card className="ticket-meta-card"><h3>Chi tiết yêu cầu</h3><dl><div><dt>Trạng thái</dt><dd><TicketStatusBadge status={ticket.status} /></dd></div><div><dt>Thời gian tạo</dt><dd>{formatDateTime(ticket.createdAt)}</dd></div><div><dt>Cập nhật lần cuối</dt><dd>{formatDateTime(ticket.updatedAt)}</dd></div></dl></Card></aside>
      </div>
    </div>
  );
}
