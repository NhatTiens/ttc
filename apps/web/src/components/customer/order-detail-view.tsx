"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { OrderStatus, orderStatusLabel } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { DetailGrid, PlatformLabel } from "@/components/customer/customer-ui";
import { CheckIcon, ExternalLinkIcon } from "@/components/ui/icons";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const resource = useAsyncResource(() => customerService.getOrder(orderId), orderId);
  if (resource.loading) return <LoadingState label="Đang tải chi tiết đơn hàng..." />;
  if (resource.error) return <ErrorState title="Không thể tải đơn hàng" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <ErrorState title="Không tìm thấy đơn hàng" description="Mã đơn này không tồn tại trong dữ liệu hiện tại." />;

  const order = resource.data;
  const timeline = order.timeline?.length
    ? order.timeline.map((event) => ({
        label: orderStatusLabel(event.status),
        detail: `${event.message} · ${formatDateTime(event.createdAt)}`
      }))
    : [{ label: orderStatusLabel(order.status), detail: `Đơn hàng được tạo lúc ${formatDateTime(order.createdAt)}` }];

  return (
    <div className="customer-page">
      <PageHeader eyebrow="Chi tiết đơn hàng" title={order.id} description="Thông tin chi tiết, chi phí và tiến trình xử lý đơn hàng." actions={<><Link href="/orders" className="button button--outline button--md">Quay lại</Link><Link href={`/order/new?service=${order.serviceId}`} className="button button--primary button--md">Đặt lại dịch vụ</Link></>} />
      <div className="detail-layout">
        <div className="detail-layout__main">
          <Card className="detail-card">
            <div className="detail-card__header"><div><span className="detail-card__label">Trạng thái hiện tại</span><OrderStatus status={order.status} /></div><PlatformLabel platform={order.platform} /></div>
            <DetailGrid items={[
              { label: "Dịch vụ", value: order.serviceName, wide: true },
              { label: "URL", value: <a href={order.targetUrl} target="_blank" rel="noreferrer" className="text-link break-text">{order.targetUrl} <ExternalLinkIcon size={14} /></a>, wide: true },
              { label: "Số lượng", value: formatNumber(order.quantity) },
              { label: "Số lượng ban đầu", value: order.startCount === undefined ? "--" : formatNumber(order.startCount) },
              { label: "Chi phí", value: formatCurrency(order.charge) },
              { label: "Còn lại", value: formatNumber(order.remaining) },
              { label: "Thời gian tạo", value: formatDateTime(order.createdAt) },
              { label: "Cập nhật lần cuối", value: formatDateTime(order.updatedAt) }
            ]} />
          </Card>
        </div>
        <aside className="detail-layout__aside">
          <Card className="timeline-card">
            <h2>Tiến trình</h2>
            <ol className="order-timeline">
              {timeline.map((item, index) => <li key={`${item.label}-${index}`} className="order-timeline__item--done"><span className="order-timeline__icon"><CheckIcon size={15} /></span><div><strong>{item.label}</strong><span>{item.detail}</span></div></li>)}
            </ol>
          </Card>
          <Card className="help-card"><h3>Cần hỗ trợ?</h3><p>Nếu đơn dừng ở một trạng thái quá lâu, hãy tạo yêu cầu hỗ trợ và kèm mã đơn để bộ phận hỗ trợ kiểm tra.</p><Link href="/support/new" className="button button--outline button--sm">Tạo yêu cầu hỗ trợ</Link></Card>
        </aside>
      </div>
    </div>
  );
}
