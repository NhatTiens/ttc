"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE, customerNavigation } from "@/content/navigation";
import { cn } from "@/lib/cn";
import { NavigationIcon } from "./navigation-icon";
import { WalletBalance } from "@/components/ui/identity";
import { SupportIcon } from "@/components/ui/icons";
import { useCustomerSession } from "@/components/customer/customer-session";
import { formatCurrency } from "@/lib/format";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("brand", compact && "brand--compact")}>
      <span className="brand__mark" aria-hidden="true"><span>TP</span></span>
      {!compact ? <span className="brand__copy"><strong>{APP_NAME}</strong><small>{APP_TAGLINE}</small></span> : null}
    </div>
  );
}

export function Sidebar({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { wallet } = useCustomerSession();
  return (
    <aside className={cn("sidebar", compact && "sidebar--compact")} aria-label="Primary navigation">
      <div className="sidebar__brand"><BrandMark compact={compact} /></div>
      <nav className="sidebar__nav">
        <p className="sidebar__section-label">MENU</p>
        {customerNavigation.map((item) => (
          <Link key={item.href} href={item.href} className={cn("sidebar__link", isActive(pathname, item.href) && "sidebar__link--active")} aria-current={isActive(pathname, item.href) ? "page" : undefined} title={compact ? item.label : undefined}>
            <NavigationIcon icon={item.icon} />
            {!compact ? <span>{item.label}</span> : null}
          </Link>
        ))}
      </nav>
      <div className="sidebar__bottom">
        {!compact ? <div className="sidebar__wallet"><span className="sidebar__wallet-label">S\u1ed1 d\u01b0 kh\u1ea3 d\u1ee5ng</span><WalletBalance amount={wallet ? formatCurrency(wallet.balance) : "--"} /><Link href="/wallet/deposit" className="sidebar__deposit-link">+ N\u1ea1p ti\u1ec1n</Link></div> : null}
        <Link href="/support" className="sidebar__help" title={compact ? "Support" : undefined}><SupportIcon size={18} />{!compact ? <span><strong>C\u1ea7n h\u1ed7 tr\u1ee3?</strong><small>Ph\u1ea3n h\u1ed3i trong gi\u1edd l\u00e0m vi\u1ec7c</small></span> : null}</Link>
      </div>
    </aside>
  );
}
