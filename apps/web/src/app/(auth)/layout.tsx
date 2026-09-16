import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getOptionalAuthenticatedCustomer } from "@/server/auth-user";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getOptionalAuthenticatedCustomer();
  if (user) redirect("/dashboard");
  return <>{children}</>;
}
