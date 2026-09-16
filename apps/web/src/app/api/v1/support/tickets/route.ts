import { createSupportTicket } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { createTicketSchema } from "@/server/validation";
import { readTickets } from "@/server/customer-queries";
import { getDb } from "@tuong-tac-pro/db";
import { toTicket } from "@/server/mappers";
export async function GET() { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); return apiData(await readTickets(user.id)); }); }
export async function POST(request: Request) { return apiHandler(async () => { requireSameOrigin(request); const user = await getAuthenticatedCustomer(); const input = createTicketSchema.parse(await parseJson(request)); const ticket = await createSupportTicket(user.id, input); const withMessages = await getDb().supportTicket.findUniqueOrThrow({ where: { id: ticket.id }, include: { messages: { orderBy: { createdAt: "asc" } } } }); return apiData(toTicket(withMessages), { status: 201 }); }); }
