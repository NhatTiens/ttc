import { redirect } from "next/navigation";
import { getOptionalAuthenticatedCustomer } from "@/server/auth-user";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getOptionalAuthenticatedCustomer();
  redirect(user ? "/dashboard" : "/login");
}
