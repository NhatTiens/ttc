"use client";

import { AdminBarChart, AdminMetricCard, AdminMoneyMetric } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { OrdersIcon, SupportIcon, UserIcon, WalletIcon } from "@/components/ui/icons";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { adminService } from "@/services/admin-service";

export default function AdminDashboardPage() {
  const resource = useAsyncResource(() => adminService.getDashboard());
  if (resource.loading) return <LoadingState label="Đang tải dữ liệu vận hành..." />;
  if (resource.error || !resource.data) return <ErrorState title="Không thể tải Admin Dashboard" description={resource.error ?? "Dữ liệu không khả dụng."} onRetry={resource.reload} />;
  const { metrics, analytics } = resource.data;
  return <div className="admin-page">
    <PageHeader eyebrow="ADMIN" title="Tổng quan vận hành" description="Số liệu được tổng hợp từ PostgreSQL theo dữ liệu thực của hệ thống." />
    <div className="admin-metric-grid">
      <AdminMetricCard label="Khách hàng" value={metrics.customers} note={`${metrics.activeUsers} hoạt động · ${metrics.suspendedUsers} tạm khóa`} icon={<UserIcon size={18} />} />
      <AdminMetricCard label="Đơn hôm nay" value={metrics.ordersToday} note={`${metrics.pendingOrders} đang chờ`} icon={<OrdersIcon size={18} />} />
      <AdminMoneyMetric label="Customer spend" value={metrics.totalCustomerSpend} note="Tổng PURCHASE đã hoàn tất" />
      <AdminMoneyMetric label="Nạp đã xác nhận" value={metrics.confirmedDepositVolume} note={`${metrics.pendingDeposits} yêu cầu đang chờ`} />
      <AdminMoneyMetric label="Wallet liability" value={metrics.walletLiability} note="Tổng số dư khách hàng" />
      <AdminMetricCard label="Hỗ trợ đang mở" value={metrics.openSupportTickets} icon={<SupportIcon size={18} />} />
      <AdminMetricCard label="Đơn đang xử lý" value={metrics.processingOrders} icon={<WalletIcon size={18} />} />
      <AdminMetricCard label="Đơn lỗi" value={metrics.failedOrders} note={`${metrics.completedOrders} đơn hoàn thành`} />
    </div>
    <div className="admin-chart-grid">
      <AdminBarChart title="Đơn hàng 14 ngày gần nhất" values={analytics.daily.slice(-14).map((item) => ({ label: item.date.slice(5), value: item.orders }))} />
      <AdminBarChart title="Customer spend 14 ngày gần nhất" format="currency" values={analytics.daily.slice(-14).map((item) => ({ label: item.date.slice(5), value: item.customerSpend }))} />
      <AdminBarChart title="Phân bố trạng thái đơn" values={analytics.orderStatusDistribution.map((item) => ({ label: item.status, value: item.count }))} />
      <AdminBarChart title="Nền tảng" values={analytics.platformDistribution.map((item) => ({ label: item.label, value: item.count }))} />
    </div>
  </div>;
}
