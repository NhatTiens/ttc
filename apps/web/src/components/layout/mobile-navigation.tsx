"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobilePrimaryNavigation } from "@/content/navigation";
import { cn } from "@/lib/cn";
import { NavigationIcon } from "./navigation-icon";

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mobile-navigation" aria-label="Điều hướng trên di động">
      {mobilePrimaryNavigation.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        return <Link key={item.href} href={item.href} className={cn("mobile-navigation__item", active && "mobile-navigation__item--active")} aria-current={active ? "page" : undefined}><NavigationIcon icon={item.icon} size={18} /><span>{item.label}</span></Link>;
      })}
    </nav>
  );
}
