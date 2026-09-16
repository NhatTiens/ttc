import { SupportTicketStatus } from "@tuong-tac-pro/db";
import { updateSupportStatus } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { adminSupportStatusSchema } from "@/server/admin-validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminSupportStatusSchema.parse(await parseJson(request)); const statusMap = { OPEN: SupportTicketStatus.OPEN, WAITING_CUSTOMER: SupportTicketStatus.WAITING_CUSTOMER, WAITING_SUPPORT: SupportTicketStatus.WAITING_SUPPORT, RESOLVED: SupportTicketStatus.RESOLVED, CLOSED: SupportTicketStatus.CLOSED } as const; const status = statusMap[input.status]; const ticket = await updateSupportStatus(actor, id, status); return apiData({ id: ticket.publicId, status: ticket.status }); }); }
