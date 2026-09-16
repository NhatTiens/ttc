import type { ReactNode } from "react";
import { AlertIcon, InboxIcon, RefreshIcon } from "./icons";
import { Button } from "./button";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton", className)} aria-hidden="true" />;
}

export function LoadingState({ label = "Đang tải..." }: { label?: string }) {
  return <div className="state-panel" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><strong>{label}</strong><span className="state-panel__muted">Vui lòng chờ trong giây lát.</span></div>;
}

export function EmptyState({ title = "Chưa có dữ liệu", description = "Dữ liệu mới sẽ xuất hiện tại đây.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="state-panel"><span className="state-panel__icon state-panel__icon--empty"><InboxIcon size={24} /></span><strong>{title}</strong><span className="state-panel__muted">{description}</span>{action}</div>;
}

export function ErrorState({ title = "Đã xảy ra lỗi", description = "Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="state-panel" role="alert"><span className="state-panel__icon state-panel__icon--error"><AlertIcon size={24} /></span><strong>{title}</strong><span className="state-panel__muted">{description}</span>{onRetry ? <Button variant="outline" size="sm" leadingIcon={<RefreshIcon size={16} />} onClick={onRetry}>Thử lại</Button> : null}</div>;
}
