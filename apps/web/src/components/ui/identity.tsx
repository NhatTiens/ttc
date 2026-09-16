import type { ReactNode } from "react";
import Image from "next/image";
import { BellIcon, ChevronDownIcon, WalletIcon } from "./icons";
import { cn } from "@/lib/cn";

export function UserAvatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join("");
  return <span className={cn("avatar", `avatar--${size}`)} aria-label={name}>{src ? <Image src={src} alt="" width={48} height={48} unoptimized /> : <span aria-hidden="true">{initials}</span>}</span>;
}

export function WalletBalance({ amount, compact = false }: { amount: string; compact?: boolean }) {
  return <div className={cn("wallet-balance", compact && "wallet-balance--compact")}><span className="wallet-balance__icon"><WalletIcon size={17} /></span><span><small>{compact ? "Số dư" : "S\u1ed1 d\u01b0"}</small><strong>{amount}</strong></span></div>;
}

export function NotificationMenu({ count = 0, children }: { count?: number; children?: ReactNode }) {
  return (
    <details className="notification-menu">
      <summary className="notification-menu__trigger" aria-label={`Thông báo${count ? ` (${count} chưa đọc)` : ""}`}>
        <BellIcon size={20} />
        {count > 0 ? <span className="notification-menu__count">{count > 9 ? "9+" : count}</span> : null}
      </summary>
      <div className="notification-menu__panel">
        <div className="notification-menu__head"><strong>Thông báo</strong><span>{count} chưa đọc</span></div>
        {children ?? <p className="notification-menu__empty">Không có thông báo mới.</p>}
      </div>
    </details>
  );
}

export function UserMenuTrigger({ name, subtitle }: { name: string; subtitle?: string }) {
  return <button type="button" className="user-menu-trigger"><UserAvatar name={name} /><span className="user-menu-trigger__copy"><strong>{name}</strong>{subtitle ? <small>{subtitle}</small> : null}</span><ChevronDownIcon size={16} /></button>;
}
