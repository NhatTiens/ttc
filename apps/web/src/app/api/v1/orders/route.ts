import { createCustomerOrder } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireIdempotencyKey, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { createOrderSchema, orderQuerySchema, queryObject } from "@/server/validation";
import { readOrders } from "@/server/customer-queries";
import { toOrder } from "@/server/mappers";

export async function GET(request: Request) { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); const filters = orderQuerySchema.parse(queryObject(request.url)); return apiData(await readOrders(user.id, filters)); }); }
export async function POST(request: Request) { return apiHandler(async () => { requireSameOrigin(request); const user = await getAuthenticatedCustomer(); const input = createOrderSchema.parse(await parseJson(request)); const order = await createCustomerOrder(user.id, input, requireIdempotencyKey(request)); return apiData(toOrder(order), { status: 201 }); }); }
