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
    if (!selectedMethod) return "Choose a deposit method.";
    if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid deposit amount.";
    if (amount < selectedMethod.min || amount > selectedMethod.max) return `Amount must be between ${formatCurrency(selectedMethod.min)} and ${formatCurrency(selectedMethod.max)}.`;
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
      toast({ tone: "success", title: "Deposit request created", description: `${deposit.id} is pending confirmation.` });
    } catch (reason) {
      const description = reason instanceof Error ? reason.message : "The deposit request could not be created.";
      toast({ tone: "error", title: "Deposit failed", description });
    } finally {
      setSubmitting(false);
    }
  }

  if (resource.loading) return <LoadingState label="Loading deposit methods..." />;
  if (resource.error) return <ErrorState title="Deposit options could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data || resource.data.methods.length === 0) return <EmptyState title="No deposit methods" description="An administrator must configure at least one deposit method." />;

  if (createdDeposit) {
    return (
      <div className="customer-page narrow-page">
        <PageHeader eyebrow="Wallet" title="Yêu cầu nạp tiền đã được tạo" description="Đây là luồng mock. Tiền chưa được cộng vào ví cho đến khi payment backend xác nhận." />
        <Card className="success-panel"><span className="success-panel__mark">OK</span><h2>{createdDeposit.id}</h2><p>So tien: <strong>{formatCurrency(createdDeposit.amount)}</strong></p><Badge tone="amber">Pending</Badge><div className="button-row"><Link href="/wallet/history" className="button button--primary button--md">Xem lịch sử ví</Link><Button variant="outline" onClick={() => setCreatedDeposit(null)}>Tao yêu cầu khac</Button></div></Card>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Wallet" title="Nạp tiền" description="Chọn một phương thức đã được cấu hình. Payment provider thật chưa được kết nối trong Work này." actions={<Link href="/wallet/history" className="button button--outline button--md">Lịch sử ví</Link>} />
      <div className="wallet-layout">
        <div className="wallet-layout__main">
          <Card className="form-card">
            <div className="section-header"><div><h2>Phuong thuc nạp tiền</h2><p>Cac phuong thuc nay den tu repository cau hinh, không hard-code vao form.</p></div></div>
            <div className="payment-method-grid" role="radiogroup" aria-label="Deposit method">
              {resource.data.methods.map((method) => <button key={method.id} type="button" role="radio" aria-checked={methodId === method.id} disabled={!method.enabled} className={cn("payment-method-card", methodId === method.id && "payment-method-card--active")} onClick={() => { setMethodId(method.id); setError(""); }}><div><strong>{method.name}</strong>{method.enabled ? <Badge tone="green">Available</Badge> : <Badge tone="neutral">Disabled</Badge>}</div><p>{method.description}</p><span>{method.feeLabel}</span></button>)}
            </div>
          </Card>

          <Card className="form-card">
            <h2>So tien nap</h2>
            <Input label="Amount (VND)" type="number" inputMode="numeric" min={selectedMethod?.min ?? 1} max={selectedMethod?.max} value={amountText} onChange={(event) => { setAmountText(event.currentTarget.value); setError(""); }} error={error} hint={selectedMethod ? `Min ${formatCurrency(selectedMethod.min)} - Max ${formatCurrency(selectedMethod.max)}` : "Choose a method to see its configured limits."} />
            <Button onClick={submit} loading={submitting} disabled={!selectedMethod} className="full-width">Tao yêu cầu nạp tiền</Button>
          </Card>
        </div>

        <aside className="wallet-layout__aside">
          <Card className="wallet-balance-card"><span>Số dư hiện tại</span><strong>{formatCurrency(resource.data.wallet.balance)}</strong><small>Available balance</small></Card>
          {selectedMethod ? <Card className="instruction-card"><h3>Huong dan</h3><ol>{selectedMethod.instructions.map((item) => <li key={item}>{item}</li>)}</ol><div className="inline-alert">Trạng thái se la Pending cho den khi backend/payment webhook xác nhận giao dịch.</div></Card> : null}
        </aside>
      </div>
    </div>
  );
}
