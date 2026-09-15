export const APP_NAME = "T\u01b0\u01a1ng T\u00e1c Pro";
export const APP_TAGLINE = "D\u1ecbch v\u1ee5 m\u1ea1ng x\u00e3 h\u1ed9i";

export type NavigationItem = {
  label: string;
  href: string;
  icon: "home" | "services" | "pricing" | "plus" | "orders" | "wallet" | "support" | "account";
};

export const customerNavigation: NavigationItem[] = [
  { label: "T\u1ed5ng quan", href: "/dashboard", icon: "home" },
  { label: "D\u1ecbch v\u1ee5", href: "/services", icon: "services" },
  { label: "B\u1ea3ng gi\u00e1", href: "/pricing", icon: "pricing" },
  { label: "T\u1ea1o \u0111\u01a1n", href: "/order/new", icon: "plus" },
  { label: "\u0110\u01a1n h\u00e0ng", href: "/orders", icon: "orders" },
  { label: "V\u00ed & n\u1ea1p ti\u1ec1n", href: "/wallet", icon: "wallet" },
  { label: "H\u1ed7 tr\u1ee3", href: "/support", icon: "support" },
  { label: "T\u00e0i kho\u1ea3n", href: "/profile", icon: "account" }
];

export const mobilePrimaryNavigation: NavigationItem[] = [
  customerNavigation[0],
  customerNavigation[1],
  customerNavigation[3],
  customerNavigation[4],
  customerNavigation[5]
];
