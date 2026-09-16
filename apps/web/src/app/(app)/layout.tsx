import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getOptionalAuthenticatedCustomer } from "@/server/auth-user";
import { getDb } from "@tuong-tac-pro/db";
import { MaintenanceScreen } from "@/components/customer/maintenance-screen";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const user = await getOptionalAuthenticatedCustomer();
  if (!user) redirect("/login");
  const settings = await getDb().systemSetting.findUnique({ where: { id: "default" }, select: { maintenanceMode: true } });
  if (settings?.maintenanceMode) return <MaintenanceScreen />;
  return <AppShell>{children}</AppShell>;
}
