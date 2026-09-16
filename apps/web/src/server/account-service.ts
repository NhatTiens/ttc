import argon2 from "argon2";
import { getDb } from "@tuong-tac-pro/db";
import { DomainError, updateCustomerPassword } from "@tuong-tac-pro/domain";

export async function changeCustomerPassword(userId: string, currentPassword: string, nextPassword: string) {
  const user = await getDb().user.findUnique({ where: { id: userId } });
  if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
    throw new DomainError("INVALID_CREDENTIALS", "Mật khẩu hiện tại không đúng.", 400);
  }
  const nextHash = await argon2.hash(nextPassword, { type: argon2.argon2id });
  await updateCustomerPassword(userId, nextHash);
}
