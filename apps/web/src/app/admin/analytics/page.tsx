"use client";
import { useState } from "react";
import { AdminBarChart, AdminMoneyMetric } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form-controls";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency } from "@/lib/format";
import { adminService } from "@/services/admin-service";

export default function Analytics() {
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const resource = useAsyncResource(() => adminService.getAnalytics(range), range);
  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN / ANALYTICS" title="Phân tích vận hành" description="Customer spend, provider cost và gross margin được lấy từ snapshot lúc provider submission. Không gọi là net profit." actions={<Select value={range} onChange={(event) => setRange(event.currentTarget.value as "7d" | "30d")} options={[{ value: "7d", label: "7 ngày" }, { value: "30d", label: "30 ngày" }]} />} />
    {resource.loading ? <LoadingState label="Đang tổng hợp dữ liệu..." /> : resource.error || !resource.data ? <ErrorState title="Không thể tải analytics" description={resource.error ?? "Dữ liệu không khả dụng."} onRetry={resource.reload} /> : <>
      <div className="admin-metric-grid">
        <AdminMoneyMetric label="Wallet liability" value={resource.data.walletLiability} note="Tổng balance khách hàng" />
        <AdminMoneyMetric label="Provider cost" value={resource.data.providerEconomics.providerCost} note={`${resource.data.providerEconomics.orderCount} provider orders`} />
        <AdminMoneyMetric label="Gross margin" value={resource.data.providerEconomics.grossMargin} note="Customer charge - provider cost" />
        <AdminMoneyMetric label="Provider customer charge" value={resource.data.providerEconomics.customerCharge} note="Snapshot các order đã route" />
      </div>
      <div className="admin-chart-grid">
        <AdminBarChart title="Đơn theo ngày" values={resource.data.daily.map((item) => ({ label: item.date.slice(5), value: item.orders }))} />
        <AdminBarChart title="Customer spend" format="currency" values={resource.data.daily.map((item) => ({ label: item.date.slice(5), value: item.customerSpend }))} />
        <AdminBarChart title="Deposit volume" format="currency" values={resource.data.daily.map((item) => ({ label: item.date.slice(5), value: item.deposits }))} />
        <AdminBarChart title="Refund volume" format="currency" values={resource.data.daily.map((item) => ({ label: item.date.slice(5), value: item.refunds }))} />
        <AdminBarChart title="Khách hàng mới" values={resource.data.daily.map((item) => ({ label: item.date.slice(5), value: item.newCustomers }))} />
        <AdminBarChart title="Nền tảng" values={resource.data.platformDistribution.map((item) => ({ label: item.label, value: item.count }))} />
        <AdminBarChart title="Trạng thái đơn" values={resource.data.orderStatusDistribution.map((item) => ({ label: item.status, value: item.count }))} />
        <AdminBarChart title="Gross margin theo provider" format="currency" values={resource.data.providerEconomics.byProvider.map((item) => ({ label: item.provider, value: item.grossMargin }))} />
      </div>
      <Card className="admin-section-card"><div className="admin-section-head"><h2>Provider economics</h2></div><div className="admin-ledger-list">{resource.data.providerEconomics.byProvider.map((item) => <div key={item.provider}><span><strong>{item.provider}</strong><small>{item.orders} orders</small></span><span><strong>{formatCurrency(item.grossMargin)} gross margin</strong><small>{formatCurrency(item.providerCost)} provider cost</small></span></div>)}{resource.data.providerEconomics.byProvider.length === 0 ? <p className="muted-text">Chưa có provider order snapshot.</p> : null}</div></Card>
      <Card className="admin-section-card"><div className="admin-section-head"><h2>Top services</h2></div><div className="admin-ledger-list">{resource.data.topServices.map((service) => <div key={service.id}><span><strong>{service.name}</strong><small>{service.id}</small></span><span><strong>{service.orders} đơn</strong><small>{formatCurrency(service.customerSpend)}</small></span></div>)}</div></Card>
    </>}
  </div>;
}
