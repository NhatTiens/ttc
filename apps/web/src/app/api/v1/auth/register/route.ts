import argon2 from "argon2";
import { registerCustomer } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { registerSchema } from "@/server/validation";

export async function POST(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const input = registerSchema.parse(await parseJson(request));
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await registerCustomer({ name: input.name, email: input.email, passwordHash });
    return apiData({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  });
}
