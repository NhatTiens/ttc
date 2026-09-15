"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { customerNavigation } from "@/content/navigation";
import { Drawer } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { Sidebar, BrandMark } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNavigation } from "./mobile-navigation";
import { NavigationIcon } from "./navigation-icon";
import { CustomerSessionProvider } from "@/components/customer/customer-session";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <CustomerSessionProvider>
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-shell__desktop-sidebar"><Sidebar /></div>
      <div className="app-shell__tablet-sidebar"><Sidebar compact /></div>
      <div className="app-shell__body">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="app-shell__main" id="main-content">{children}</main>
      </div>
      <MobileNavigation />
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} title="Navigation" side="left">
        <div className="mobile-drawer-brand"><BrandMark /></div>
        <nav className="mobile-drawer-nav" aria-label="Expanded mobile navigation">
          {customerNavigation.map((item) => <Link key={item.href} href={item.href} className={cn("mobile-drawer-link")} onClick={() => setMobileMenuOpen(false)}><NavigationIcon icon={item.icon} /><span>{item.label}</span></Link>)}
        </nav>
      </Drawer>
    </div>
    </CustomerSessionProvider>
  );
}
