import argon2 from "argon2";
import { getDb, UserStatus } from "@tuong-tac-pro/db";
import { normalizeEmail } from "@tuong-tac-pro/domain";

export async function verifyCustomerCredentials(email: string, password: string) {
  const user = await getDb().user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user || user.status !== UserStatus.ACTIVE) return null;
  const valid = await argon2.verify(user.passwordHash, password);
  return valid ? user : null;
}
