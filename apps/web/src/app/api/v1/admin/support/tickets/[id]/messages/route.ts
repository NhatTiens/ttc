import { sendAdminSupportReply } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { adminSupportReplySchema } from "@/server/admin-validation";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminSupportReplySchema.parse(await parseJson(request)); const message = await sendAdminSupportReply(actor, id, input.body); return apiData({ id: message.id, createdAt: message.createdAt.toISOString() }, { status: 201 }); }); }
