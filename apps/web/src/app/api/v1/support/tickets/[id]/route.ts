import { getOwnedTicket } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { mapTicketThread } from "@/server/customer-queries";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); const { id } = await params; return apiData(mapTicketThread(await getOwnedTicket(user.id, id))); }); }
