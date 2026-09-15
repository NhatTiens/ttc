"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, StatCard } from "@/components/ui/card";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { OrderStatus } from "@/components/ui/badge";
import { CheckCircleIcon, ClockIcon, TrendIcon, WalletIcon } from "@/components/ui/icons";
import { PlatformLabel, SectionHeader, TextLink, platformName } from "@/components/customer/customer-ui";
import { PlatformIcon } from "@/components/brand/platform-icons";
import type { Order } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

const orderColumns: TableColumn<Order>[] = [
  { key: "id", header: "Order", render: (row) => <TextLink href={`/orders/${row.id}`}>{row.id}</TextLink> },
  { key: "service", header: "Service", render: (row) => <div className="table-primary"><strong>{row.serviceName}</strong><small>{row.targetUrl}</small></div> },
  { key: "platform", header: "Platform", render: (row) => <PlatformLabel platform={row.platform} compact /> },
  { key: "quantity", header: "Quantity", render: (row) => formatNumber(row.quantity) },
  { key: "charge", header: "Charge", render: (row) => formatCurrency(row.charge) },
  { key: "status", header: "Status", render: (row) => <OrderStatus status={row.status} /> }
];

export default function DashboardPage() {
  const resource = useAsyncResource(() => customerService.getDashboard());

  if (resource.loading) return <LoadingState label="Loading dashboard..." />;
  if (resource.error) return <ErrorState title="Dashboard could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="No dashboard data" description="Dashboard information will appear here when available." />;

  const data = resource.data;
  return (
    <div className="customer-page">
      <PageHeader
        eyebrow="Customer overview"
        title={`Xin chào, ${data.profile.name}`}
        description="Theo dõi số dư, đơn hàng đang chạy và các dịch vụ bạn dùng nhiều nhất."
        actions={<Link className="button button--primary button--md" href="/order/new">Tạo đơn mới</Link>}
      />

      <section className="stats-grid" aria-label="Account summary">
        <StatCard label="Số dư" value={formatCurrency(data.wallet.balance)} hint="Available balance" icon={<WalletIcon size={19} />} />
        <StatCard label="Đơn đang chạy" value={formatNumber(data.runningOrders)} hint="Processing / pending" icon={<ClockIcon size={19} />} />
        <StatCard label="Đơn hoàn thành" value={formatNumber(data.completedOrders)} hint="Completed orders" icon={<CheckCircleIcon size={19} />} />
        <StatCard label="Tổng chi tiêu" value={formatCurrency(data.totalSpent)} hint="Captured purchases" icon={<TrendIcon size={19} />} />
      </section>

      <section className="dashboard-overview-grid">
        <Card className="dashboard-platform-card">
          <CardHeader><SectionHeader title="Nền tảng phổ biến" description="Được tính từ lịch sử đơn hàng hiện tại." /></CardHeader>
          <CardContent>
            <div className="popular-platform">
              <PlatformIcon platform={data.popularPlatform} size="lg" />
              <div><strong>{platformName(data.popularPlatform)}</strong><span>Nền tảng bạn đặt hàng nhiều nhất</span></div>
            </div>
            <Link href={`/services?platform=${data.popularPlatform}`} className="text-link">Xem dịch vụ</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><SectionHeader title="Ví của bạn" description="Số dư khả dụng để tạo đơn mới." /></CardHeader>
          <CardContent className="wallet-summary-card">
            <strong>{formatCurrency(data.wallet.balance)}</strong>
            <div className="button-row">
              <Link href="/wallet/deposit" className="button button--primary button--sm">Nạp tiền</Link>
              <Link href="/wallet/history" className="button button--outline button--sm">Lịch sử ví</Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionHeader title="Dịch vụ phổ biến" description="Một số dịch vụ đang được sử dụng nhiều." action={<Link href="/services" className="text-link">Xem tất cả</Link>} />
        <div className="popular-service-grid">
          {data.popularServices.map((service) => (
            <Card key={service.id} className="compact-service-card">
              <div className="compact-service-card__top"><PlatformLabel platform={service.platform} /><span className="compact-service-card__code">{service.code}</span></div>
              <div><h3>{service.name}</h3><p>{service.description}</p></div>
              <div className="compact-service-card__bottom"><span><small>Từ</small><strong>{formatCurrency(service.ratePerThousand)} / 1K</strong></span><Link href={`/order/new?service=${service.id}`} className="button button--outline button--sm">Đặt ngay</Link></div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Đơn gần đây" description="5 đơn hàng mới nhất của tài khoản." action={<Link href="/orders" className="text-link">Xem lịch sử đơn</Link>} />
        {data.recentOrders.length === 0 ? (
          <EmptyState title="Chưa có đơn hàng" description="Đơn hàng mới sẽ xuất hiện tại đây." action={<Link href="/order/new" className="button button--primary button--sm">Tạo đơn đầu tiên</Link>} />
        ) : (
          <ResponsiveTable columns={orderColumns} rows={data.recentOrders} getRowKey={(row) => row.id} caption="Recent orders" renderMobileItem={(row) => (
            <Card className="mobile-list-card">
              <div className="mobile-list-card__head"><TextLink href={`/orders/${row.id}`}>{row.id}</TextLink><OrderStatus status={row.status} /></div>
              <strong>{row.serviceName}</strong>
              <PlatformLabel platform={row.platform} compact />
              <div className="mobile-list-card__meta"><span>{formatNumber(row.quantity)} đơn vị</span><span>{formatCurrency(row.charge)}</span></div>
              <small>{formatDateTime(row.createdAt)}</small>
            </Card>
          )} />
        )}
      </section>
    </div>
  );
}
