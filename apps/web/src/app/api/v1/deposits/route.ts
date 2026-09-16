import { createDepositRequest } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireIdempotencyKey, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { createDepositSchema } from "@/server/validation";
import { readDeposits } from "@/server/customer-queries";
import { toDeposit } from "@/server/mappers";
export async function GET() { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); return apiData(await readDeposits(user.id)); }); }
export async function POST(request: Request) { return apiHandler(async () => { requireSameOrigin(request); const user = await getAuthenticatedCustomer(); const input = createDepositSchema.parse(await parseJson(request)); const deposit = await createDepositRequest(user.id, { methodId: input.methodId, amountMinor: BigInt(input.amount) }, requireIdempotencyKey(request)); return apiData(toDeposit(deposit), { status: 201 }); }); }
