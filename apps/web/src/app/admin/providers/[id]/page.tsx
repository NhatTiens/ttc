"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminDefinitionList, AdminStatusBadge } from "@/components/admin/admin-ui";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-controls";
import { ConfirmDialog, Modal } from "@/components/ui/overlays";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ResponsiveTable, type TableColumn } from "@/components/ui/table";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { formatCurrency, formatDateTime, formatProviderMoney } from "@/lib/format";
import { adminService } from "@/services/admin-service";
import type { AdminProviderMappingInput, AdminProviderService } from "@/domain/admin";

function MappingForm({ providerService, onDone }: { providerService: AdminProviderService; onDone: () => void }) {
  const services = useAsyncResource(() => adminService.listServices({ page: 1, pageSize: 100, status: "ACTIVE" }), "provider-mapping-services");
  const [serviceId, setServiceId] = useState("");
  const [priority, setPriority] = useState(100);
  const [markupType, setMarkupType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [markupValue, setMarkupValue] = useState(35);
  const [minimumMargin, setMinimumMargin] = useState(0);
  const [pricingMode, setPricingMode] = useState<"MANUAL" | "AUTO_MARKUP">("MANUAL");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    if (!serviceId) { setError("Chọn dịch vụ nội bộ."); return; }
    const input: AdminProviderMappingInput = {
      serviceId, providerServiceId: providerService.id, enabled: true, priority, markupType,
      markupBps: markupType === "PERCENTAGE" ? Math.round(markupValue * 100) : 0,
      fixedMarkup: markupType === "FIXED" ? markupValue : 0,
      minimumMargin, pricingMode
    };
    setSaving(true); setError("");
    try { await adminService.saveProviderMapping(input); onDone(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể lưu mapping."); } finally { setSaving(false); }
  }
  return <div className="admin-form-stack">
    <Select label="Internal service" value={serviceId} onChange={(event) => setServiceId(event.currentTarget.value)} options={[{ value: "", label: "Chọn dịch vụ..." }, ...(services.data?.items ?? []).map((service) => ({ value: service.id, label: `${service.code} — ${service.name}` }))]} />
    <Input label="Priority" type="number" min={1} max={10000} value={priority} onChange={(event) => setPriority(Number(event.currentTarget.value))} />
    <Select label="Markup" value={markupType} onChange={(event) => setMarkupType(event.currentTarget.value as "PERCENTAGE" | "FIXED")} options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED", label: "Fixed VND / rate unit" }]} />
    <Input label={markupType === "PERCENTAGE" ? "Markup %" : "Fixed markup VND"} type="number" min={0} value={markupValue} onChange={(event) => setMarkupValue(Number(event.currentTarget.value))} />
    <Input label="Minimum margin / order (VND)" type="number" min={0} value={minimumMargin} onChange={(event) => setMinimumMargin(Number(event.currentTarget.value))} />
    <Select label="Pricing mode" value={pricingMode} onChange={(event) => setPricingMode(event.currentTarget.value as "MANUAL" | "AUTO_MARKUP")} options={[{ value: "MANUAL", label: "Manual selling price + margin guard" }, { value: "AUTO_MARKUP", label: "Auto update selling price on provider sync" }]} />
    {error ? <p className="field-error">{error}</p> : null}
    <Button onClick={submit} loading={saving}>Lưu mapping</Button>
  </div>;
}

export default function AdminProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const [version, setVersion] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const [mapService, setMapService] = useState<AdminProviderService | null>(null);
  const [disableMappingId, setDisableMappingId] = useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState(false);
  const resource = useAsyncResource(() => adminService.getProvider(params.id), `${params.id}:${version}`);
  const provider = resource.data;
  const columns = useMemo<TableColumn<AdminProviderService>[]>(() => [
    { key: "service", header: "Provider service", render: (row) => <div className="table-primary"><strong>{row.name}</strong><small>ID: {row.externalServiceId}</small></div> },
    { key: "cost", header: "Provider cost", render: (row) => <div className="table-primary"><strong>{formatCurrency(row.providerRate)}</strong><small>/ {row.rateUnit.toLocaleString("vi-VN")} · {row.currency}</small></div> },
    { key: "limits", header: "Min / Max", render: (row) => `${row.min.toLocaleString("vi-VN")} / ${row.max.toLocaleString("vi-VN")}` },
    { key: "status", header: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    { key: "mapping", header: "Mapping", render: (row) => row.mappings.length ? <div className="table-primary">{row.mappings.map((mapping) => <span key={mapping.id}><strong>{mapping.internalServiceCode}</strong> · {formatCurrency(mapping.customerRate)} · margin {formatCurrency(mapping.marginPerRateUnit)} <AdminStatusBadge status={mapping.status} /> <button className="text-link" onClick={() => setDisableMappingId(mapping.id)}>Disable</button></span>)}</div> : <span>Unmapped</span> },
    { key: "action", header: "", render: (row) => <Button size="sm" variant="outline" onClick={() => setMapService(row)}>Map / Update</Button> }
  ], []);
  async function runAction(action: "TEST_CONNECTION" | "SYNC_SERVICES" | "SYNC_BALANCE") {
    setActionMessage("");
    try { const job = await adminService.runProviderAction(params.id, action); setActionMessage(`Đã xếp job ${job.type} (${job.id}). Worker sẽ xử lý server-side.`); setVersion((value) => value + 1); } catch (cause) { setActionMessage(cause instanceof Error ? cause.message : "Không thể tạo provider job."); }
  }
  if (resource.loading) return <LoadingState label="Đang tải provider..." />;
  if (resource.error || !provider) return <ErrorState title="Không thể tải provider" description={resource.error ?? "Provider không tồn tại."} onRetry={resource.reload} />;
  return <div className="admin-page">
    <PageHeader eyebrow={`ADMIN / PROVIDERS / ${provider.code}`} title={provider.name} description="External provider is isolated behind the server adapter and durable worker. Browser never receives provider credentials." actions={<div className="admin-action-row"><Button variant="outline" onClick={() => runAction("TEST_CONNECTION")}>Test connection</Button><Button variant="outline" onClick={() => runAction("SYNC_SERVICES")}>Sync services</Button><Button variant="outline" onClick={() => runAction("SYNC_BALANCE")}>Sync balance</Button><Button variant={provider.enabled ? "danger" : "primary"} onClick={() => setToggleConfirm(true)}>{provider.enabled ? "Disable" : "Enable"}</Button></div>} />
    {actionMessage ? <Card className="admin-placeholder-card"><p>{actionMessage}</p></Card> : null}
    <Card><AdminDefinitionList items={[
      { label: "Status", value: <AdminStatusBadge status={provider.status} /> }, { label: "Health", value: provider.health },
      { label: "Base URL", value: provider.baseUrlConfigured ? "Configured server-side" : "Not configured / not verified" },
      { label: "Credential", value: provider.credentialConfigured ? "•••••••• (configured)" : "Not configured" },
      { label: "Balance", value: provider.balance === null ? "—" : formatProviderMoney(provider.balance, provider.balanceCurrency) },
      { label: "Last success", value: provider.lastSuccessfulAt ? formatDateTime(provider.lastSuccessfulAt) : "—" },
      { label: "Last error", value: provider.lastErrorCode || "—" }
    ]} /></Card>
    <div className="admin-section-head"><div><h2>Provider services</h2><p>{provider.mappedServices} mapped · {provider.unmappedServices} unmapped. Sync never publishes provider services directly to customers.</p></div></div>
    {provider.servicesList.length ? <ResponsiveTable columns={columns} rows={provider.servicesList} getRowKey={(row) => row.id} caption="Provider services" renderMobileItem={(row) => <Card className="admin-mobile-card"><div className="admin-mobile-card__head"><strong>{row.name}</strong><AdminStatusBadge status={row.status} /></div><span>ID {row.externalServiceId}</span><div className="admin-mobile-card__meta"><span>{formatCurrency(row.providerRate)}/{row.rateUnit}</span><span>{row.mappings.length} mapping</span></div><Button size="sm" variant="outline" onClick={() => setMapService(row)}>Map / Update</Button></Card>} /> : <Card className="admin-placeholder-card"><h2>Chưa có provider service</h2><p>Chỉ xuất hiện sau khi adapter thật sync được service list. Không có dữ liệu provider giả.</p></Card>}
    <div className="admin-grid-2"><Card><div className="admin-section-head"><div><h2>Recent jobs</h2><p>PostgreSQL-backed durable queue.</p></div></div><div className="admin-activity-list">{provider.jobs.slice(0, 10).map((job) => <div key={job.id}><strong>{job.type}</strong><span>{job.status} · attempt {job.attempts}/{job.maxAttempts}</span>{job.lastErrorCode ? <small>{job.lastErrorCode}: {job.lastErrorMessage}</small> : null}</div>)}</div></Card><Card><div className="admin-section-head"><div><h2>Operation log</h2><p>Sanitized provider operations.</p></div></div><div className="admin-activity-list">{provider.operations.slice(0, 10).map((operation) => <div key={operation.id}><strong>{operation.operation}</strong><span>{operation.result} · {operation.durationMs ?? 0}ms</span>{operation.errorCode ? <small>{operation.errorCode}</small> : null}</div>)}</div></Card></div>
    <Modal open={Boolean(mapService)} onOpenChange={(open) => { if (!open) setMapService(null); }} title="Map provider service" description={mapService ? `${mapService.name} — ${formatCurrency(mapService.providerRate)}/${mapService.rateUnit}` : undefined}>{mapService ? <MappingForm providerService={mapService} onDone={() => { setMapService(null); setVersion((value) => value + 1); }} /> : null}</Modal>
    <ConfirmDialog open={toggleConfirm} onOpenChange={setToggleConfirm} title={provider.enabled ? "Disable provider?" : "Enable provider?"} description={provider.enabled ? "New orders will no longer route through this provider. Existing accepted provider orders remain tracked." : "Only enable a provider after its adapter contract, mapping and credentials are verified."} destructive={provider.enabled} confirmLabel={provider.enabled ? "Disable" : "Enable"} onConfirm={() => void adminService.setProviderEnabled(provider.id, !provider.enabled).then(() => setVersion((value) => value + 1))} />
    <ConfirmDialog open={Boolean(disableMappingId)} onOpenChange={(open) => { if (!open) setDisableMappingId(null); }} title="Disable mapping?" description="New orders will not route through this mapping. Historical provider economics are unchanged." destructive confirmLabel="Disable mapping" onConfirm={() => { if (disableMappingId) void adminService.disableProviderMapping(disableMappingId).then(() => { setDisableMappingId(null); setVersion((value) => value + 1); }); }} />
  </div>;
}
