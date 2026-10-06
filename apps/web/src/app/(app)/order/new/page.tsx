"use client";

import { Suspense, useMemo, useRef, useState } from "react";
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
import type { OrderQuote, SocialPlatform } from "@/domain/customer";
import { customerService } from "@/services/customer-service";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { calculateOrderCost, formatCurrency, formatNumber } from "@/lib/format";
import { validUrl } from "@/validation/customer";
import { cn } from "@/lib/cn";

const platforms: SocialPlatform[] = ["facebook", "tiktok", "instagram", "youtube", "threads", "google"];
const platformLabels: Record<SocialPlatform, string> = { facebook: "Facebook", tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", threads: "Threads", google: "Google Maps" };

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
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const quoteRequest = useRef(0);
  const [quoting, setQuoting] = useState(false);
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
    quoteRequest.current += 1;
    setQuoting(false);
    setPlatform(nextPlatform);
    const first = resource.data?.services.find((item) => item.platform === nextPlatform && item.status === "Active");
    setServiceId(first?.id ?? "");
    setQuantity(first?.min ?? 100);
    setQuote(null);
    setErrors({});
  }

  function changeService(nextServiceId: string) {
    quoteRequest.current += 1;
    setQuoting(false);
    setServiceId(nextServiceId);
    const service = resource.data?.services.find((item) => item.id === nextServiceId);
    if (service) setQuantity(service.min);
    setQuote(null);
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
    return Object.keys(nextErrors).length === 0;
  }

  async function requestConfirmation() {
    if (!selectedService || !validateForm()) return;
    const requestVersion = ++quoteRequest.current;
    setQuoting(true);
    try {
      const nextQuote = await customerService.createQuote(selectedService.id, activeQuantity);
      if (requestVersion !== quoteRequest.current) return;
      setQuote(nextQuote);
      setConfirmOpen(true);
    } catch (reason) {
      if (requestVersion === quoteRequest.current) toast({ tone: "error", title: "Không thể tạo báo giá", description: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      if (requestVersion === quoteRequest.current) setQuoting(false);
    }
  }

  async function submitOrder() {
    if (!selectedService || !quote || !validateForm()) return;
    if (quote.serviceId !== selectedService.id || quote.quantity !== activeQuantity) {
      setQuote(null);
      setConfirmOpen(false);
      toast({ tone: "error", title: "Thông tin đơn đã thay đổi", description: "Vui lòng lấy báo giá mới trước khi tạo đơn." });
      return;
    }
    setSubmitting(true);
    try {
      const order = await customerService.createOrder({ quoteId: quote.id, targetUrl });
      setCreatedOrderId(order.id);
      setConfirmOpen(false);
      setQuote(null);
      refreshSession();
      resource.reload();
      toast({ tone: "success", title: "Đơn hàng đã tạo", description: `${order.id} đã được đưa vào hàng chờ xử lý.` });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Không thể tạo đơn hàng.";
      toast({ tone: "error", title: "Không thể tạo đơn", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (resource.loading) return <LoadingState label="Đang chuẩn bị biểu mẫu tạo đơn..." />;
  if (resource.error) return <ErrorState title="Không thể tải biểu mẫu tạo đơn" description={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return <EmptyState title="Biểu mẫu tạo đơn chưa khả dụng" description="Cần có dữ liệu dịch vụ và số dư ví trước khi tạo đơn." />;

  if (createdOrderId) {
    return (
      <div className="customer-page narrow-page">
        <PageHeader eyebrow="Đơn hàng đã tạo" title="Đơn hàng đã được tạo" description="Đơn đang ở trạng thái chờ xử lý. Bạn có thể theo dõi tiến trình trong lịch sử đơn hàng." />
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
      <PageHeader eyebrow="Tạo đơn" title="Tạo đơn mới" description="Chọn nền tảng, dịch vụ, link và số lượng. Hệ thống tính chi phí trước khi bạn xác nhận." />
      <div className="order-builder-grid">
        <div className="order-builder-main">
          <Card className="form-card">
            <div className="form-section"><span className="step-badge">1</span><div><h2>Chọn nền tảng</h2><p>Chọn nền tảng bạn muốn sử dụng.</p></div></div>
            <div className="platform-picker" role="radiogroup" aria-label="Chọn nền tảng">
              {platforms.map((item) => <button key={item} type="button" role="radio" aria-checked={activePlatform === item} className={cn("platform-picker__item", activePlatform === item && "platform-picker__item--active")} onClick={() => changePlatform(item)}><PlatformIcon platform={item} size="md" /><span>{platformLabels[item]}</span></button>)}
            </div>
          </Card>

          <Card className="form-card">
            <div className="form-section"><span className="step-badge">2</span><div><h2>Chọn dịch vụ</h2><p>Chọn dịch vụ phù hợp và kiểm tra giá cùng giới hạn số lượng.</p></div></div>
            <Select label="Dịch vụ" required value={activeServiceId} error={errors.service} onChange={(event) => changeService(event.currentTarget.value)} options={[{ value: "", label: "Chọn dịch vụ", disabled: true }, ...platformServices.map((service) => ({ value: service.id, label: `${service.name} - ${formatCurrency(service.ratePerThousand)}/1.000`, disabled: service.status !== "Active" }))]} />
            {selectedService ? <div className="selected-service-summary"><div><PlatformLabel platform={selectedService.platform} /><ServiceStatusBadge status={selectedService.status} /></div><p>{selectedService.description}</p><div className="selected-service-summary__meta"><span>Giá <strong>{formatCurrency(selectedService.ratePerThousand)} / 1.000</strong></span><span>Tối thiểu <strong>{formatNumber(selectedService.min)}</strong></span><span>Tối đa <strong>{formatNumber(selectedService.max)}</strong></span><span>Thời gian dự kiến <strong>{selectedService.averageTime}</strong></span></div></div> : null}
          </Card>

          <Card className="form-card">
            <div className="form-section"><span className="step-badge">3</span><div><h2>Nhập thông tin đơn</h2><p>Kiểm tra link công khai và số lượng trước khi xác nhận.</p></div></div>
            <div className="form-stack">
              <Input label="URL" required value={targetUrl} onChange={(event) => { setTargetUrl(event.currentTarget.value); setErrors((current) => ({ ...current, targetUrl: undefined })); }} error={errors.targetUrl} placeholder="https://..." inputMode="url" />
              <NumberInput label="Số lượng" required value={activeQuantity} min={selectedService?.min} max={selectedService?.max} step={selectedService ? Math.max(1, Math.min(100, selectedService.min)) : 1} onValueChange={(value) => { quoteRequest.current += 1; setQuoting(false); setQuantity(value); setQuote(null); setErrors((current) => ({ ...current, quantity: undefined })); }} error={errors.quantity} hint={selectedService ? `Cho phép: ${formatNumber(selectedService.min)} - ${formatNumber(selectedService.max)}` : "Vui lòng chọn dịch vụ trước."} disabled={!selectedService} />
            </div>
          </Card>
        </div>

        <aside className="order-summary-column" aria-label="Tóm tắt đơn hàng">
          <Card className="order-summary-card">
            <h2>Tóm tắt đơn hàng</h2>
            <dl className="order-summary-list">
              <div><dt>Dịch vụ</dt><dd>{selectedService?.name ?? "--"}</dd></div>
              <div><dt>Đơn giá</dt><dd>{selectedService ? `${formatCurrency(selectedService.ratePerThousand)} / 1.000` : "--"}</dd></div>
              <div><dt>Số lượng</dt><dd>{formatNumber(activeQuantity)}</dd></div>
              <div className="order-summary-list__total"><dt>Chi phí dự kiến</dt><dd>{formatCurrency(estimatedCost)}</dd></div>
              <div><dt>Số dư hiện tại</dt><dd>{formatCurrency(resource.data.wallet.balance)}</dd></div>
              <div><dt>Số dư sau đơn</dt><dd>{formatCurrency(Math.max(0, resource.data.wallet.balance - estimatedCost))}</dd></div>
            </dl>
            {insufficientBalance ? <div className="inline-alert inline-alert--error" role="alert">Số dư không đủ. Vui lòng nạp thêm tiền trước khi tạo đơn.</div> : null}
            <Button size="lg" className="full-width" loading={quoting} disabled={!selectedService || selectedService.status !== "Active"} onClick={requestConfirmation}>Kiểm tra & xác nhận</Button>
            {insufficientBalance ? <Link href="/wallet/deposit" className="button button--outline button--md full-width">Nạp tiền</Link> : null}
          </Card>
        </aside>
      </div>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen} title="Xác nhận tạo đơn" description="Giá bên dưới đã được máy chủ khóa đến thời điểm hết hạn báo giá." footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>Quay lại</Button><Button onClick={submitOrder} loading={submitting} disabled={!quote}>Tạo đơn</Button></>}>
        <dl className="confirm-summary"><div><dt>Dịch vụ</dt><dd>{quote?.serviceName ?? selectedService?.name}</dd></div><div><dt>URL</dt><dd className="break-text">{targetUrl}</dd></div><div><dt>Số lượng</dt><dd>{formatNumber(quote?.quantity ?? activeQuantity)}</dd></div><div><dt>Chi phí đã báo</dt><dd><strong>{formatCurrency(quote?.charge ?? estimatedCost)}</strong></dd></div><div><dt>Báo giá hết hạn</dt><dd>{quote ? new Date(quote.expiresAt).toLocaleTimeString("vi-VN") : "--"}</dd></div><div><dt>Số dư khả dụng</dt><dd>{formatCurrency(resource.data.wallet.balance)}</dd></div></dl>
      </Modal>
    </div>
  );
}


export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingState label="Đang chuẩn bị biểu mẫu tạo đơn..." />}>
      <NewOrderPageContent />
    </Suspense>
  );
}
