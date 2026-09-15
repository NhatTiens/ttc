"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { TicketStatusBadge, TextLink } from "@/components/customer/customer-ui";
import type { SupportTicket, TicketStatus } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatDateTime } from "@/lib/format";

const columns: TableColumn<SupportTicket>[] = [
  { key: "id", header: "Ticket", render: (row) => <TextLink href={`/support/${row.id}`}>{row.id}</TextLink> },
  { key: "subject", header: "Subject", render: (row) => <div className="table-primary"><strong>{row.subject}</strong><small>{row.category}</small></div> },
  { key: "status", header: "Status", render: (row) => <TicketStatusBadge status={row.status} /> },
  { key: "updated", header: "Updated", render: (row) => <span className="table-date">{formatDateTime(row.updatedAt)}</span> },
  { key: "last", header: "Last message", render: (row) => <span className="table-clamp">{row.lastMessage}</span> }
];

export default function SupportPage() {
  const resource = useAsyncResource(() => customerService.listTickets());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (resource.data ?? []).filter((ticket) => (status === "all" || ticket.status === status) && (!query || `${ticket.id} ${ticket.subject} ${ticket.lastMessage}`.toLocaleLowerCase().includes(query)));
  }, [resource.data, search, status]);

  if (resource.loading) return <LoadingState label="Loading support tickets..." />;
  if (resource.error) return <ErrorState title="Support tickets could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Support unavailable" description="Ticket data could not be loaded." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Support" title="Hỗ trợ" description="Theo dõi cac ticket va trao doi voi bộ phận hỗ trợ." actions={<Link href="/support/new" className="button button--primary button--md">Tạo ticket</Link>} />
      <Card className="filter-card"><div className="filter-grid filter-grid--support"><SearchInput value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Tìm ticket, tiêu đề..." aria-label="Search tickets" /><Select value={status} onChange={(event) => setStatus(event.currentTarget.value as TicketStatus | "all")} options={[{ value: "all", label: "Tất cả trạng thái" }, { value: "Open", label: "Open" }, { value: "Waiting", label: "Waiting" }, { value: "Resolved", label: "Resolved" }, { value: "Closed", label: "Closed" }]} /></div></Card>
      {filtered.length === 0 ? <EmptyState title="Chưa có ticket phù hợp" description="Tạo ticket mới nếu bạn cần hỗ trợ." action={<Link href="/support/new" className="button button--primary button--sm">Tạo ticket</Link>} /> : <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Support tickets" renderMobileItem={(row) => <Card className="mobile-list-card"><div className="mobile-list-card__head"><TextLink href={`/support/${row.id}`}>{row.id}</TextLink><TicketStatusBadge status={row.status} /></div><strong>{row.subject}</strong><span className="muted-text">{row.category}</span><p className="table-clamp">{row.lastMessage}</p><small>{formatDateTime(row.updatedAt)}</small></Card>} />}
    </div>
  );
}
