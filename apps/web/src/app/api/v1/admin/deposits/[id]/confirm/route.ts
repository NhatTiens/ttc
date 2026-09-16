import { confirmDeposit } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminDeposit } from "@/server/admin-queries";
import { adminDepositActionSchema } from "@/server/admin-validation";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminDepositActionSchema.parse(await parseJson(request)); await confirmDeposit(actor, id, input.reason); return apiData(await readAdminDeposit(id)); }); }
