import { getOwnedTicket, sendSupportReply } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { supportReplySchema } from "@/server/validation";
import { toSupportMessage } from "@/server/mappers";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const user = await getAuthenticatedCustomer(); const { id } = await params; const input = supportReplySchema.parse(await parseJson(request)); const message = await sendSupportReply(user.id, id, input.body); const ticket = await getOwnedTicket(user.id, id); return apiData(toSupportMessage({ ...message, senderUser: { name: user.name } }, ticket.publicId), { status: 201 }); }); }
