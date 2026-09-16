"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Drawer } from "@/components/ui/overlays";
import { Button, IconButton } from "@/components/ui/button";
import { GridIcon, HomeIcon, LockIcon, MenuIcon, OrdersIcon, SupportIcon, TagIcon, TrendIcon, UserIcon, WalletIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type AdminNavItem = { href: string; label: string; icon: ReactNode; disabled?: boolean; badge?: string };

const adminNavigation: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <HomeIcon size={18} /> },
  { href: "/admin/users", label: "Khách hàng", icon: <UserIcon size={18} /> },
  { href: "/admin/orders", label: "Đơn hàng", icon: <OrdersIcon size={18} /> },
  { href: "/admin/services", label: "Dịch vụ", icon: <GridIcon size={18} /> },
  { href: "/admin/categories", label: "Danh mục", icon: <TagIcon size={18} /> },
  { href: "/admin/deposits", label: "Nạp tiền", icon: <WalletIcon size={18} /> },
  { href: "/admin/wallets", label: "Ví", icon: <WalletIcon size={18} /> },
  { href: "/admin/transactions", label: "Giao dịch", icon: <OrdersIcon size={18} /> },
  { href: "/admin/support", label: "Hỗ trợ", icon: <SupportIcon size={18} /> },
  { href: "/admin/analytics", label: "Phân tích", icon: <TrendIcon size={18} /> },
  { href: "/admin/audit-logs", label: "Nhật ký", icon: <LockIcon size={18} /> },
  { href: "/admin/settings", label: "Cài đặt", icon: <GridIcon size={18} /> },
  { href: "/admin/providers", label: "Nhà cung cấp", icon: <GridIcon size={18} />, badge: "Sắp tới" }
];

function active(pathname: string, href: string) { return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`); }

function AdminBrand() {
  return <Link href="/admin" className="admin-brand"><span className="admin-brand__mark">TP</span><span><strong>Tương Tác Pro</strong><small>ADMIN CONSOLE</small></span></Link>;
}

function Nav({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return <nav className="admin-nav" aria-label="Điều hướng quản trị">{adminNavigation.map((item) => <Link key={item.href} href={item.href} onClick={close} className={cn("admin-nav__link", active(pathname, item.href) && "admin-nav__link--active")} aria-current={active(pathname, item.href) ? "page" : undefined}><span className="admin-nav__icon">{item.icon}</span><span>{item.label}</span>{item.badge ? <small>{item.badge}</small> : null}</Link>)}</nav>;
}

export function AdminShell({ children, adminName, adminEmail }: { children: ReactNode; adminName: string; adminEmail: string }) {
  const [drawer, setDrawer] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  async function logout() { await signOut({ redirect: false }); router.replace("/login"); router.refresh(); }
  return <div className="admin-shell">
    <a className="skip-link" href="#admin-main">Chuyển đến nội dung quản trị</a>
    <aside className="admin-sidebar"><AdminBrand /><div className="admin-sidebar__label">VẬN HÀNH</div><Nav /><div className="admin-sidebar__footer"><span className="admin-role-note">Khu vực quản trị nội bộ</span></div></aside>
    <div className="admin-shell__body">
      <header className="admin-topbar"><div className="admin-topbar__mobile"><IconButton label="Mở điều hướng quản trị" onClick={() => setDrawer(true)}><MenuIcon size={20} /></IconButton><AdminBrand /></div><div className="admin-topbar__identity"><span><strong>{adminName}</strong><small>{adminEmail}</small></span><Button variant="outline" size="sm" onClick={logout}>Đăng xuất</Button></div></header>
      <main className="admin-main" id="admin-main">{children}</main>
    </div>
    <nav className="admin-mobile-nav" aria-label="Điều hướng quản trị nhanh">{adminNavigation.slice(0, 5).map((item) => <Link key={item.href} href={item.href} className={cn(active(pathname, item.href) && "admin-mobile-nav--active")}>{item.icon}<span>{item.label}</span></Link>)}</nav>
    <Drawer open={drawer} onOpenChange={setDrawer} title="Quản trị" side="left"><div className="admin-drawer-brand"><AdminBrand /></div><Nav close={() => setDrawer(false)} /></Drawer>
  </div>;
}
