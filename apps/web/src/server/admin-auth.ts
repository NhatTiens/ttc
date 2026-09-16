import { getAuthenticatedAdmin } from "./auth-user";
import type { AdminActor } from "@tuong-tac-pro/domain";

export async function requireAdmin(request?: Request) {
  const user = await getAuthenticatedAdmin();
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const direct = request?.headers.get("x-real-ip")?.trim();
  const actor: AdminActor = { userId: user.id, ipAddress: forwarded || direct || null };
  return { user, actor };
}
