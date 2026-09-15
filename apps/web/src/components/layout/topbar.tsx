"use client";

import { BrandMark } from "./sidebar";
import { IconButton } from "@/components/ui/button";
import { MenuIcon } from "@/components/ui/icons";
import { NotificationMenu, UserMenuTrigger, WalletBalance } from "@/components/ui/identity";
import { SearchInput } from "@/components/ui/form-controls";
import { useCustomerSession } from "@/components/customer/customer-session";
import { formatCurrency } from "@/lib/format";

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { profile, wallet } = useCustomerSession();
  const balance = wallet ? formatCurrency(wallet.balance) : "--";
  return (
    <header className="topbar">
      <div className="topbar__mobile-brand"><IconButton label="Open navigation" onClick={onOpenMobileMenu}><MenuIcon size={21} /></IconButton><BrandMark /></div>
      <div className="topbar__search"><SearchInput placeholder="T\u00ecm d\u1ecbch v\u1ee5, m\u00e3 \u0111\u01a1n..." aria-label="Search" /></div>
      <div className="topbar__actions">
        <div className="topbar__wallet-desktop"><WalletBalance amount={balance} /></div>
        <div className="topbar__wallet-mobile"><WalletBalance amount={wallet ? `${Math.round(wallet.balance / 1000)}K` : "--"} compact /></div>
        <NotificationMenu count={3}>
          <div className="notification-item"><span className="notification-item__dot" /><span><strong>Order #TT240812</strong><small>Completed successfully.</small></span></div>
          <div className="notification-item"><span className="notification-item__dot" /><span><strong>Wallet credited</strong><small>Your balance was updated.</small></span></div>
        </NotificationMenu>
        <div className="topbar__user"><UserMenuTrigger name={profile?.name ?? "Customer"} subtitle="Customer" /></div>
      </div>
    </header>
  );
}
