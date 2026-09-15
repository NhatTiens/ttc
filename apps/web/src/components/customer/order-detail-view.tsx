"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { OrderStatus } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { DetailGrid, PlatformLabel } from "@/components/customer/customer-ui";
import { CheckIcon, ClockIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const resource = useAsyncResource(() => customerService.getOrder(orderId), orderId);
  if (resource.loading) return <LoadingState label="Loading order details..." />;
  if (resource.error) return <ErrorState title="Order could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <ErrorState title="Order not found" description="The order ID does not exist in the current customer repository." />;

  const order = resource.data;
  const submitted = order.status !== "Pending" && order.status !== "Failed";
  const processing = ["Processing", "Completed", "Partial", "Refunded"].includes(order.status);
  const terminal = ["Completed", "Failed", "Cancelled", "Partial", "Refunded"].includes(order.status);
  const timeline = [
    { label: "Created", done: true, detail: formatDateTime(order.createdAt) },
    { label: "Submitted", done: submitted, detail: submitted ? "Provider submission acknowledged" : "Waiting for submission" },
    { label: "Processing", done: processing, detail: processing ? "Provider is processing the order" : "Not started" },
    { label: terminal ? order.status : "Final status", done: terminal, detail: terminal ? formatDateTime(order.updatedAt) : "Waiting for completion" }
  ];

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Order detail" title={order.id} description="Thông tin chi tiết, chi phí và tiến trình xử lý đơn hàng." actions={<><Link href="/orders" className="button button--outline button--md">Quay lại</Link><Link href={`/order/new?service=${order.serviceId}`} className="button button--primary button--md">Đặt lại dịch vụ</Link></>} />
      <div className="detail-layout">
        <div className="detail-layout__main">
          <Card className="detail-card">
            <div className="detail-card__header"><div><span className="detail-card__label">Trạng thái hiện tại</span><OrderStatus status={order.status} /></div><PlatformLabel platform={order.platform} /></div>
            <DetailGrid items={[
              { label: "Service", value: order.serviceName, wide: true },
              { label: "Link", value: <a href={order.targetUrl} target="_blank" rel="noreferrer" className="text-link break-text">{order.targetUrl} <ExternalLinkIcon size={14} /></a>, wide: true },
              { label: "Quantity", value: formatNumber(order.quantity) },
              { label: "Start count", value: order.startCount === undefined ? "--" : formatNumber(order.startCount) },
              { label: "Charge", value: formatCurrency(order.charge) },
              { label: "Remaining", value: formatNumber(order.remaining) },
              { label: "Created", value: formatDateTime(order.createdAt) },
              { label: "Updated", value: formatDateTime(order.updatedAt) }
            ]} />
          </Card>
        </div>
        <aside className="detail-layout__aside">
          <Card className="timeline-card">
            <h2>Timeline</h2>
            <ol className="order-timeline">
              {timeline.map((item, index) => <li key={`${item.label}-${index}`} className={cn(item.done && "order-timeline__item--done")}><span className="order-timeline__icon">{item.done ? <CheckIcon size={15} /> : <ClockIcon size={15} />}</span><div><strong>{item.label}</strong><span>{item.detail}</span></div></li>)}
            </ol>
          </Card>
          <Card className="help-card"><h3>Can hỗ trợ?</h3><p>Neu don dung o mot trạng thái qua lau, tao ticket va kem ma don de bộ phận hỗ trợ kiểm tra.</p><Link href="/support/new" className="button button--outline button--sm">Tạo ticket</Link></Card>
        </aside>
      </div>
    </div>
  );
}
