"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/form-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { useCustomerSession } from "@/components/customer/customer-session";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function DepositPage() {
  const resource = useAsyncResource(async () => {
    const [methods, wallet] = await Promise.all([customerService.listDepositMethods(), customerService.getWallet()]);
    return { methods, wallet };
  });
  const { refresh: refreshSession } = useCustomerSession();
  const { toast } = useToast();
  const [methodId, setMethodId] = useState("");
  const [amountText, setAmountText] = useState("500000");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdDeposit, setCreatedDeposit] = useState<{ id: string; amount: number } | null>(null);

  const selectedMethod = useMemo(() => resource.data?.methods.find((item) => item.id === methodId) ?? null, [resource.data, methodId]);
  const amount = Number(amountText);

  function validate() {
    if (!selectedMethod) return "Vui lòng chọn phương thức nạp tiền.";
    if (!Number.isFinite(amount) || amount <= 0) return "Vui lòng nhập số tiền nạp hợp lệ.";
    if (amount < selectedMethod.min || amount > selectedMethod.max) return `Số tiền phải nằm trong khoảng ${formatCurrency(selectedMethod.min)} đến ${formatCurrency(selectedMethod.max)}.`;
    return "";
  }

  async function submit() {
    const message = validate();
    setError(message);
    if (message || !selectedMethod) return;
    setSubmitting(true);
    try {
      const deposit = await customerService.createDeposit(selectedMethod.id, amount);
      setCreatedDeposit({ id: deposit.id, amount: deposit.amount });
      refreshSession();
      toast({ tone: "success", title: "Đã tạo yêu cầu nạp tiền", description: `${deposit.id} đang chờ xác nhận.` });
    } catch (reason) {
      const description = reason instanceof Error ? reason.message : "Không thể tạo yêu cầu nạp tiền.";
      toast({ tone: "error", title: "Nạp tiền thất bại", description });
    } finally {
      setSubmitting(false);
    }
  }

  if (resource.loading) return <LoadingState label="Đang tải phương thức nạp tiền..." />;
  if (resource.error) return <ErrorState title="Không thể tải phương thức nạp tiền" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data || resource.data.methods.length === 0) return <EmptyState title="Chưa có phương thức nạp tiền" description="Hệ thống cần được cấu hình ít nhất một phương thức nạp tiền." />;

  if (createdDeposit) {
    return (
      <div className="customer-page narrow-page">
        <PageHeader eyebrow="Ví" title="Yêu cầu nạp tiền đã được tạo" description="Yêu cầu nạp tiền đã được ghi nhận và đang chờ xác nhận." />
        <Card className="success-panel"><span className="success-panel__mark">OK</span><h2>{createdDeposit.id}</h2><p>Số tiền: <strong>{formatCurrency(createdDeposit.amount)}</strong></p><Badge tone="amber">Đang chờ</Badge><div className="button-row"><Link href="/wallet/history" className="button button--primary button--md">Xem lịch sử ví</Link><Button variant="outline" onClick={() => setCreatedDeposit(null)}>Tạo yêu cầu khác</Button></div></Card>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Ví" title="Nạp tiền" description="Chọn phương thức nạp tiền phù hợp và nhập số tiền bạn muốn nạp." actions={<Link href="/wallet/history" className="button button--outline button--md">Lịch sử ví</Link>} />
      <div className="wallet-layout">
        <div className="wallet-layout__main">
          <Card className="form-card">
            <div className="section-header"><div><h2>Phương thức nạp tiền</h2><p>Các phương thức khả dụng được cấu hình bởi hệ thống.</p></div></div>
            <div className="payment-method-grid" role="radiogroup" aria-label="Phương thức nạp tiền">
              {resource.data.methods.map((method) => <button key={method.id} type="button" role="radio" aria-checked={methodId === method.id} disabled={!method.enabled} className={cn("payment-method-card", methodId === method.id && "payment-method-card--active")} onClick={() => { setMethodId(method.id); setError(""); }}><div><strong>{method.name}</strong>{method.enabled ? <Badge tone="green">Khả dụng</Badge> : <Badge tone="neutral">Tạm tắt</Badge>}</div><p>{method.description}</p><span>{method.feeLabel}</span></button>)}
            </div>
          </Card>

          <Card className="form-card">
            <h2>Số tiền nạp</h2>
            <Input label="Số tiền (VND)" type="number" inputMode="numeric" min={selectedMethod?.min ?? 1} max={selectedMethod?.max} value={amountText} onChange={(event) => { setAmountText(event.currentTarget.value); setError(""); }} error={error} hint={selectedMethod ? `Tối thiểu ${formatCurrency(selectedMethod.min)} - Tối đa ${formatCurrency(selectedMethod.max)}` : "Chọn phương thức để xem giới hạn đã cấu hình."} />
            <Button onClick={submit} loading={submitting} disabled={!selectedMethod} className="full-width">Tạo yêu cầu nạp tiền</Button>
          </Card>
        </div>

        <aside className="wallet-layout__aside">
          <Card className="wallet-balance-card"><span>Số dư hiện tại</span><strong>{formatCurrency(resource.data.wallet.balance)}</strong><small>Số dư khả dụng</small></Card>
          {selectedMethod ? <Card className="instruction-card"><h3>Hướng dẫn</h3><ol>{selectedMethod.instructions.map((item) => <li key={item}>{item}</li>)}</ol><div className="inline-alert">Trạng thái sẽ là Đang chờ cho đến khi giao dịch được xác nhận.</div></Card> : null}
        </aside>
      </div>
    </div>
  );
}
