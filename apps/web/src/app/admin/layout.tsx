import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DomainError } from "@tuong-tac-pro/domain";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuthenticatedAdmin } from "@/server/auth-user";

export const dynamic = "force-dynamic";

async function getAdminForLayout() {
  try {
    return await getAuthenticatedAdmin();
  } catch (error) {
    if (error instanceof DomainError && error.code === "FORBIDDEN") redirect("/dashboard");
    redirect("/login?callbackUrl=/admin");
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminForLayout();
  return <AdminShell adminName={admin.name} adminEmail={admin.email}>{children}</AdminShell>;
}
