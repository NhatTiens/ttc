"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckIcon, InfoIcon, XIcon } from "./icons";
import { IconButton } from "./button";
import { cn } from "@/lib/cn";

type ToastTone = "info" | "success" | "error";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };
type ToastInput = Omit<ToastItem, "id">;
type ToastContextValue = { toast: (input: ToastInput) => void };

export type ToastProps = ToastItem & { onDismiss?: () => void };

export function Toast({ title, description, tone, onDismiss }: ToastProps) {
  return (
    <div className={cn("toast", `toast--${tone}`)} role={tone === "error" ? "alert" : "status"}>
      <span className="toast__icon">{tone === "success" ? <CheckIcon size={18} /> : <InfoIcon size={18} />}</span>
      <div className="toast__copy"><strong>{title}</strong>{description ? <span>{description}</span> : null}</div>
      {onDismiss ? <IconButton label="Dismiss notification" size="sm" onClick={onDismiss}><XIcon size={16} /></IconButton> : null}
    </div>
  );
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { ...input, id }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
        {items.map((item) => (
          <Toast key={item.id} {...item} onDismiss={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
