import { getOwnedOrder } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { toOrder } from "@/server/mappers";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); const { id } = await params; return apiData(toOrder(await getOwnedOrder(user.id, id))); }); }
