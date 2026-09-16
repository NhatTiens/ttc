import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getOptionalAuthenticatedCustomer } from "@/server/auth-user";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: ReactNode }) {
  const user = await getOptionalAuthenticatedCustomer();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
