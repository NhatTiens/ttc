"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { MoneyValue, TransactionStatusBadge, TransactionTypeBadge } from "@/components/customer/customer-ui";
import type { TransactionType, WalletTransaction } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime } from "@/lib/format";

const columns: TableColumn<WalletTransaction>[] = [
  { key: "type", header: "Loại", render: (row) => <TransactionTypeBadge type={row.type} /> },
  { key: "description", header: "Nội dung", render: (row) => <div className="table-primary"><strong>{row.description}</strong>{row.reference ? <small>{row.reference}</small> : null}</div> },
  { key: "amount", header: "Số tiền", render: (row) => <MoneyValue value={row.amount} /> },
  { key: "balance", header: "Số dư sau giao dịch", render: (row) => formatCurrency(row.balanceAfter) },
  { key: "date", header: "Thời gian", render: (row) => <span className="table-date">{formatDateTime(row.date)}</span> },
  { key: "status", header: "Trạng thái", render: (row) => <TransactionStatusBadge status={row.status} /> }
];

export default function WalletHistoryPage() {
  const resource = useAsyncResource(async () => {
    const [wallet, transactions] = await Promise.all([customerService.getWallet(), customerService.listWalletTransactions()]);
    return { wallet, transactions };
  });
  const [type, setType] = useState<TransactionType | "all">("all");
  const filtered = useMemo(() => (resource.data?.transactions ?? []).filter((item) => type === "all" || item.type === type), [resource.data, type]);

  if (resource.loading) return <LoadingState label="Đang tải lịch sử ví..." />;
  if (resource.error) return <ErrorState title="Không thể tải lịch sử ví" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Không tìm thấy ví" description="Không tìm thấy thông tin ví hiện tại." />;

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Ví" title="Lịch sử giao dịch" description="Theo dõi nạp tiền, mua dịch vụ, hoàn tiền và điều chỉnh trên ví." actions={<Link href="/wallet/deposit" className="button button--primary button--md">Nạp tiền</Link>} />
      <div className="wallet-history-summary"><Card><span>Số dư hiện tại</span><strong>{formatCurrency(resource.data.wallet.balance)}</strong></Card><Card><span>Tiền tệ</span><strong>{resource.data.wallet.currency}</strong></Card></div>
      <Card className="filter-card filter-card--compact"><Select value={type} onChange={(event) => setType(event.currentTarget.value as TransactionType | "all")} options={[{ value: "all", label: "Tất cả giao dịch" }, { value: "Deposit", label: "Nạp tiền" }, { value: "Purchase", label: "Mua dịch vụ" }, { value: "Refund", label: "Hoàn tiền" }, { value: "Adjustment", label: "Điều chỉnh" }]} aria-label="Lọc theo loại giao dịch" /></Card>
      {filtered.length === 0 ? <EmptyState title="Chưa có giao dịch" description="Giao dịch phù hợp sẽ xuất hiện tại đây." /> : <ResponsiveTable columns={columns} rows={filtered} getRowKey={(row) => row.id} caption="Lịch sử giao dịch ví" renderMobileItem={(row) => <Card className="mobile-list-card"><div className="mobile-list-card__head"><TransactionTypeBadge type={row.type} /><TransactionStatusBadge status={row.status} /></div><strong>{row.description}</strong><div className="mobile-list-card__meta"><MoneyValue value={row.amount} /><span>{formatCurrency(row.balanceAfter)}</span></div><small>{formatDateTime(row.date)}</small></Card>} />}
    </div>
  );
}
