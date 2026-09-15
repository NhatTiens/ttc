"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformIcon } from "@/components/brand/platform-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NumberInput, Select } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/overlays";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { PlatformLabel, ServiceStatusBadge } from "@/components/customer/customer-ui";
import { useCustomerSession } from "@/components/customer/customer-session";
import type { SocialPlatform } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { calculateOrderCost, formatCurrency, formatNumber } from "@/lib/format";
import { validUrl } from "@/validation/customer";
import { cn } from "@/lib/cn";

const platforms: SocialPlatform[] = ["facebook", "tiktok", "instagram", "youtube", "threads"];
const platformLabels: Record<SocialPlatform, string> = { facebook: "Facebook", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", threads: "Threads" };

function NewOrderPageContent() {
  const searchParams = useSearchParams();
  const preferredServiceId = searchParams.get("service");
  const resource = useAsyncResource(async () => {
    const [services, wallet] = await Promise.all([customerService.listServices(), customerService.getWallet()]);
    return { services, wallet };
  });
  const { refresh: refreshSession } = useCustomerSession();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<SocialPlatform | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ service?: string; targetUrl?: string; quantity?: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const defaultService = useMemo(() => {
    if (!resource.data) return null;
    const preferred = preferredServiceId
      ? resource.data.services.find((item) => item.id === preferredServiceId && item.status === "Active")
      : undefined;
    return preferred ?? resource.data.services.find((item) => item.platform === "facebook" && item.status === "Active") ?? resource.data.services.find((item) => item.status === "Active") ?? null;
  }, [resource.data, preferredServiceId]);

  const activePlatform = platform ?? defaultService?.platform ?? "facebook";
  const activeServiceId = serviceId ?? defaultService?.id ?? "";
  const platformServices = useMemo(() => (resource.data?.services ?? []).filter((service) => service.platform === activePlatform), [resource.data, activePlatform]);
  const selectedService = useMemo(() => resource.data?.services.find((service) => service.id === activeServiceId) ?? null, [resource.data, activeServiceId]);
  const activeQuantity = quantity ?? selectedService?.min ?? 100;
  const estimatedCost = selectedService ? calculateOrderCost(selectedService.ratePerThousand, activeQuantity) : 0;
  const insufficientBalance = Boolean(resource.data && estimatedCost > resource.data.wallet.balance);

  function changePlatform(nextPlatform: SocialPlatform) {
    setPlatform(nextPlatform);
    const first = resource.data?.services.find((item) => item.platform === nextPlatform && item.status === "Active");
    setServiceId(first?.id ?? "");
    setQuantity(first?.min ?? 100);
    setErrors({});
  }

  function changeService(nextServiceId: string) {
    setServiceId(nextServiceId);
    const service = resource.data?.services.find((item) => item.id === nextServiceId);
    if (service) setQuantity(service.min);
    setErrors((current) => ({ ...current, service: undefined, quantity: undefined }));
  }

  function validateForm() {
    const nextErrors: typeof errors = {};
    if (!selectedService) nextErrors.service = "Vui lòng chọn dịch vụ đang khả dụng.";
    else if (selectedService.status !== "Active") nextErrors.service = "Dịch vụ này hiện không nhận đơn.";
    const linkError = validUrl(targetUrl);
    if (linkError) nextErrors.targetUrl = linkError;
    if (selectedService && (activeQuantity < selectedService.min || activeQuantity > selectedService.max)) nextErrors.quantity = `Số lượng phải từ ${formatNumber(selectedService.min)} đến ${formatNumber(selectedService.max)}.`;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 && !insufficientBalance;
  }

  function requestConfirmation() {
    if (validateForm()) setConfirmOpen(true);
  }

  async function submitOrder() {
    if (!selectedService || !validateForm()) return;
    setSubmitting(true);
    try {
      const order = await customerService.createOrder({ serviceId: selectedService.id, targetUrl, quantity: activeQuantity });
      setCreatedOrderId(order.id);
      setConfirmOpen(false);
      refreshSession();
      resource.reload();
      toast({ tone: "success", title: "Order created", description: `${order.id} has been queued for processing.` });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Không thể tạo đơn hàng.";
      toast({ tone: "error", title: "Order failed", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (resource.loading) return <LoadingState label="Preparing order form..." />;
  if (resource.error) return <ErrorState title="Order form could not be loaded" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Order form unavailable" description="Service and wallet data are required before an order can be created." />;

  if (createdOrderId) {
    return (
      <div className="customer-page narrow-page">
        <PageHeader eyebrow="Order created" title="Đơn hàng đã được tạo" description="Đơn đang ở trạng thái chờ xử lý và sẽ được gửi qua provider layer khi backend thật được kết nối." />
        <Card className="success-panel">
          <span className="success-panel__mark" aria-hidden="true">OK</span>
          <h2>{createdOrderId}</h2>
          <p>Yêu cầu đã được ghi nhận thành công. Bạn có thể theo dõi trạng thái trong lịch sử đơn hàng.</p>
          <div className="button-row"><Link href={`/orders/${createdOrderId}`} className="button button--primary button--md">Xem chi tiết đơn</Link><Button variant="outline" onClick={() => { setCreatedOrderId(null); setTargetUrl(""); }}>Tạo đơn khác</Button></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <PageHeader eyebrow="New order" title="Tạo đơn mới" description="Chọn nền tảng, dịch vụ, link và số lượng. Hệ thống tính chi phí trước khi bạn xác nhận." />
      <div className="order-builder-grid">
        <div className="order-builder-main">
          <Card className="form-card">
            <div className="form-section"><span className="step-badge">1</span><div><h2>Chọn nền tảng</h2><p>Chỉ hiển thị các nền tảng được hỗ trợ trong catalog.</p></div></div>
            <div className="platform-picker" role="radiogroup" aria-label="Select platform">
              {platforms.map((item) => <button key={item} type="button" role="radio" aria-checked={activePlatform === item} className={cn("platform-picker__item", activePlatform === item && "platform-picker__item--active")} onClick={() => changePlatform(item)}><PlatformIcon platform={item} size="md" /><span>{platformLabels[item]}</span></button>)}
            </div>
          </Card>

          <Card className="form-card">
            <div className="form-section"><span className="step-badge">2</span><div><h2>Chọn dịch vụ</h2><p>Giá bán và giới hạn số lượng được lấy từ service layer.</p></div></div>
            <Select label="Dịch vụ" required value={activeServiceId} error={errors.service} onChange={(event) => changeService(event.currentTarget.value)} options={[{ value: "", label: "Chọn dịch vụ", disabled: true }, ...platformServices.map((service) => ({ value: service.id, label: `${service.name} - ${formatCurrency(service.ratePerThousand)}/1K`, disabled: service.status !== "Active" }))]} />
            {selectedService ? <div className="selected-service-summary"><div><PlatformLabel platform={selectedService.platform} /><ServiceStatusBadge status={selectedService.status} /></div><p>{selectedService.description}</p><div className="selected-service-summary__meta"><span>Rate <strong>{formatCurrency(selectedService.ratePerThousand)} / 1K</strong></span><span>Min <strong>{formatNumber(selectedService.min)}</strong></span><span>Max <strong>{formatNumber(selectedService.max)}</strong></span><span>ETA <strong>{selectedService.averageTime}</strong></span></div></div> : null}
          </Card>

          <Card className="form-card">
            <div className="form-section"><span className="step-badge">3</span><div><h2>Nhập thông tin đơn</h2><p>Kiểm tra link công khai và số lượng trước khi xác nhận.</p></div></div>
            <div className="form-stack">
              <Input label="Link" required value={targetUrl} onChange={(event) => { setTargetUrl(event.currentTarget.value); setErrors((current) => ({ ...current, targetUrl: undefined })); }} error={errors.targetUrl} placeholder="https://..." inputMode="url" />
              <NumberInput label="Quantity" required value={activeQuantity} min={selectedService?.min} max={selectedService?.max} step={selectedService ? Math.max(1, Math.min(100, selectedService.min)) : 1} onValueChange={(value) => { setQuantity(value); setErrors((current) => ({ ...current, quantity: undefined })); }} error={errors.quantity} hint={selectedService ? `Allowed: ${formatNumber(selectedService.min)} - ${formatNumber(selectedService.max)}` : "Choose a service first."} disabled={!selectedService} />
            </div>
          </Card>
        </div>

        <aside className="order-summary-column" aria-label="Order summary">
          <Card className="order-summary-card">
            <h2>Tom tat đơn hàng</h2>
            <dl className="order-summary-list">
              <div><dt>Service</dt><dd>{selectedService?.name ?? "--"}</dd></div>
              <div><dt>Rate</dt><dd>{selectedService ? `${formatCurrency(selectedService.ratePerThousand)} / 1K` : "--"}</dd></div>
              <div><dt>Quantity</dt><dd>{formatNumber(activeQuantity)}</dd></div>
              <div className="order-summary-list__total"><dt>Estimated cost</dt><dd>{formatCurrency(estimatedCost)}</dd></div>
              <div><dt>Current wallet</dt><dd>{formatCurrency(resource.data.wallet.balance)}</dd></div>
              <div><dt>After order</dt><dd>{formatCurrency(Math.max(0, resource.data.wallet.balance - estimatedCost))}</dd></div>
            </dl>
            {insufficientBalance ? <div className="inline-alert inline-alert--error" role="alert">Số dư không du. Vui long nap them tien truoc khi tạo đơn.</div> : null}
            <Button size="lg" className="full-width" disabled={!selectedService || selectedService.status !== "Active" || insufficientBalance} onClick={requestConfirmation}>Kiểm tra & xác nhận</Button>
            {insufficientBalance ? <Link href="/wallet/deposit" className="button button--outline button--md full-width">Nạp tiền</Link> : null}
          </Card>
        </aside>
      </div>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="Xác nhận tạo đơn" description="Kiểm tra lại thông tin trước khi gửi yêu cầu." footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>Quay lại</Button><Button onClick={submitOrder} loading={submitting}>Tạo đơn</Button></>}>
        <dl className="confirm-summary"><div><dt>Service</dt><dd>{selectedService?.name}</dd></div><div><dt>Link</dt><dd className="break-text">{targetUrl}</dd></div><div><dt>Quantity</dt><dd>{formatNumber(activeQuantity)}</dd></div><div><dt>Estimated cost</dt><dd><strong>{formatCurrency(estimatedCost)}</strong></dd></div><div><dt>Wallet balance</dt><dd>{formatCurrency(resource.data.wallet.balance)}</dd></div></dl>
      </Modal>
    </div>
  );
}


export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingState label="Preparing order form..." />}>
      <NewOrderPageContent />
    </Suspense>
  );
}
