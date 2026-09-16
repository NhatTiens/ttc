import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@tuong-tac-pro/db";
import { normalizeEmail } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { forgotPasswordSchema } from "@/server/validation";

export async function POST(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const input = forgotPasswordSchema.parse(await parseJson(request));
    const email = normalizeEmail(input.email);
    const user = await getDb().user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await getDb().$transaction([
        getDb().passwordResetToken.deleteMany({ where: { email, usedAt: null } }),
        getDb().passwordResetToken.create({ data: { email, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) } })
      ]);
      // Work 04 intentionally does not expose the token or send email. Email delivery belongs to a later integration.
    }
    return apiData({ accepted: true });
  });
}
