import { refundOrder } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminOrder } from "@/server/admin-queries";
import { orderRefundSchema } from "@/server/admin-validation";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = orderRefundSchema.parse(await parseJson(request)); await refundOrder(actor, id, input.reason); return apiData(await readAdminOrder(id)); }); }
