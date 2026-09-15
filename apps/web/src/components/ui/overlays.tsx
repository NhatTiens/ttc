"use client";

import { useEffect, useId, useRef } from "react";
import type { MouseEvent, ReactNode, SyntheticEvent } from "react";
import { Button, IconButton } from "./button";
import { XIcon } from "./icons";
import { cn } from "@/lib/cn";

function useDialog(open: boolean, onOpenChange: (open: boolean) => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onClose = () => onOpenChange(false);
    node.addEventListener("close", onClose);
    return () => node.removeEventListener("close", onClose);
  }, [onOpenChange]);
  return ref;
}

export function Modal({ open, onOpenChange, title, description, children, footer, size = "md" }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  const ref = useDialog(open, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();
  return (
    <dialog ref={ref} className={cn("dialog", `dialog--${size}`)} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event: SyntheticEvent<HTMLDialogElement>) => { event.preventDefault(); onOpenChange(false); }} onClick={(event: MouseEvent<HTMLDialogElement>) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <div className="dialog__surface">
        <div className="dialog__head"><div><h2 id={titleId}>{title}</h2>{description ? <p id={descriptionId}>{description}</p> : null}</div><IconButton label="Close dialog" onClick={() => onOpenChange(false)}><XIcon size={18} /></IconButton></div>
        {children ? <div className="dialog__content">{children}</div> : null}
        {footer ? <div className="dialog__footer">{footer}</div> : null}
      </div>
    </dialog>
  );
}

export function Drawer({ open, onOpenChange, title, children, side = "right" }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode; side?: "left" | "right" }) {
  const ref = useDialog(open, onOpenChange);
  const titleId = useId();
  return (
    <dialog ref={ref} className={cn("drawer", `drawer--${side}`)} aria-labelledby={titleId} onCancel={(event: SyntheticEvent<HTMLDialogElement>) => { event.preventDefault(); onOpenChange(false); }} onClick={(event: MouseEvent<HTMLDialogElement>) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <div className="drawer__surface">
        <div className="drawer__head"><h2 id={titleId}>{title}</h2><IconButton label="Close drawer" onClick={() => onOpenChange(false)}><XIcon size={18} /></IconButton></div>
        <div className="drawer__content">{children}</div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button><Button variant={destructive ? "danger" : "primary"} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button></>}
    />
  );
}
