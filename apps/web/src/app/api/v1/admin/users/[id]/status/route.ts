import { changeCustomerStatus } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminUser } from "@/server/admin-queries";
import { adminUserStatusSchema } from "@/server/admin-validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminUserStatusSchema.parse(await parseJson(request)); await changeCustomerStatus(actor, id, input.status); return apiData(await readAdminUser(id)); }); }
