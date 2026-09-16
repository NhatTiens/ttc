"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { SearchInput, Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { TicketStatusBadge, TextLink, supportCategoryLabel } from "@/components/customer/customer-ui";
import type { SupportTicket, TicketStatus } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatDateTime } from "@/lib/format";

const columns: TableColumn<SupportTicket>[] = [
  { key: "id", header: "Mã yêu cầu", render: (row) => <TextLink href={`/support/${row.id}`}>{row.id}</TextLink> },
  { key: "subject", header: "Tiêu đề", render: (row) => <div className="table-primary"><strong>{row.subject}</strong><small>{supportCategoryLabel(row.category)}</small></div> },
  { key: "status", header: "Trạng thái", render: (row) => <TicketStatusBadge status={row.status} /> },
  { key: "updated", header: "Cập nhật", render: (row) => <span className="table-date">{formatDateTime(row.updatedAt)}</span> },
  { key: "last", header: "Tin nhắn gần nhất", render: (row) => <span className="table-clamp">{row.lastMessage}</span> }
];

export default function SupportPage() {
  const resource = useAsyncResource(() => customerService.listTickets());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (resource.data ?? []).filter((ticket) => (status === "all" || ticket.status === status) && (!query || `${ticket.id} ${ticket.subject} ${ticket.lastMessage}`.toLocaleLowerCase().includes(query)));
  }, [resource.data, search, status]);

  if (resource.loading) return <LoadingState label="Đang tải yêu cầu hỗ trợ..." />;
  if (resource.error) return <ErrorState title="Không thể tải yêu cầu hỗ trợ" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Hỗ trợ chưa khả dụng" description="Không thể tải dữ liệu yêu cầu hỗ trợ." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Hỗ trợ" title="Hỗ trợ" description="Theo dõi các yêu cầu và trao đổi với bộ phận hỗ trợ." actions={<Link href="/support/new" className="button button--primary button--md">Tạo yêu cầu</Link>} />
      <Card className="filter-card"><div className="filter-grid filter-grid--support"><SearchInput value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Tìm mã yêu cầu, tiêu đề..." aria-label="Tìm kiếm yêu cầu hỗ trợ" /><Select value={status} onChange={(event) => setStatus(event.currentTarget.value as TicketStatus | "all")} options={[{ value: "all", label: "Tất cả trạng thái" }, { value: "Open", label: "Đang mở" }, { value: "Waiting", label: "Đang chờ" }, { value: "Resolved", label: "Đã xử lý" }, { value: "Closed", label: "Đã đóng" }]} /></div></Card>
      {filtered.length === 0 ? <EmptyState title="Chưa có yêu cầu phù hợp" description="Tạo yêu cầu mới nếu bạn cần hỗ trợ." action={<Link href="/support/new" className="button button--primary button--sm">Tạo yêu cầu</Link>} /> : <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Danh sách yêu cầu hỗ trợ" renderMobileItem={(row) => <Card className="mobile-list-card"><div className="mobile-list-card__head"><TextLink href={`/support/${row.id}`}>{row.id}</TextLink><TicketStatusBadge status={row.status} /></div><strong>{row.subject}</strong><span className="muted-text">{supportCategoryLabel(row.category)}</span><p className="table-clamp">{row.lastMessage}</p><small>{formatDateTime(row.updatedAt)}</small></Card>} />}
    </div>
  );
}
