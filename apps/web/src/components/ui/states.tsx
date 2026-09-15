import type { ReactNode } from "react";
import { AlertIcon, InboxIcon, RefreshIcon } from "./icons";
import { Button } from "./button";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton", className)} aria-hidden="true" />;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="state-panel" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><strong>{label}</strong><span className="state-panel__muted">Please wait a moment.</span></div>;
}

export function EmptyState({ title = "No data yet", description = "New items will appear here.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="state-panel"><span className="state-panel__icon state-panel__icon--empty"><InboxIcon size={24} /></span><strong>{title}</strong><span className="state-panel__muted">{description}</span>{action}</div>;
}

export function ErrorState({ title = "Something went wrong", description = "Try again or contact support if the problem continues.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="state-panel" role="alert"><span className="state-panel__icon state-panel__icon--error"><AlertIcon size={24} /></span><strong>{title}</strong><span className="state-panel__muted">{description}</span>{onRetry ? <Button variant="outline" size="sm" leadingIcon={<RefreshIcon size={16} />} onClick={onRetry}>Try again</Button> : null}</div>;
}
