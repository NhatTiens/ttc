import type { NavigationItem } from "@/content/navigation";
import { GridIcon, HomeIcon, OrdersIcon, PlusIcon, SupportIcon, TagIcon, UserIcon, WalletIcon } from "@/components/ui/icons";

export function NavigationIcon({ icon, size = 19 }: { icon: NavigationItem["icon"]; size?: number }) {
  const props = { size };
  if (icon === "home") return <HomeIcon {...props} />;
  if (icon === "services") return <GridIcon {...props} />;
  if (icon === "pricing") return <TagIcon {...props} />;
  if (icon === "plus") return <PlusIcon {...props} />;
  if (icon === "orders") return <OrdersIcon {...props} />;
  if (icon === "wallet") return <WalletIcon {...props} />;
  if (icon === "support") return <SupportIcon {...props} />;
  return <UserIcon {...props} />;
}
