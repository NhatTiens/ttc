import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getDb, UserRole, UserStatus } from "@tuong-tac-pro/db";
import { DomainError } from "@tuong-tac-pro/domain";

export function requireSessionIdentity(session: Session | null) {
  const sessionUser = session?.user;
  if (!sessionUser?.id || typeof sessionUser.sessionVersion !== "number") {
    throw new DomainError("UNAUTHORIZED", "Vui lòng đăng nhập để tiếp tục.", 401);
  }
  return { userId: sessionUser.id, sessionVersion: sessionUser.sessionVersion };
}

export async function getAuthenticatedCustomer() {
  const identity = requireSessionIdentity(await auth());
  const user = await getDb().user.findUnique({ where: { id: identity.userId } });
  if (!user || user.status !== UserStatus.ACTIVE || user.sessionVersion !== identity.sessionVersion) {
    throw new DomainError("UNAUTHORIZED", "Phiên đăng nhập không còn hợp lệ.", 401);
  }
  if (user.role !== UserRole.CUSTOMER) {
    throw new DomainError("FORBIDDEN", "Tài khoản không có quyền truy cập khu vực khách hàng.", 403);
  }
  return user;
}

export async function getOptionalAuthenticatedCustomer() {
  try {
    return await getAuthenticatedCustomer();
  } catch (error) {
    if (error instanceof DomainError && (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN")) return null;
    throw error;
  }
}
