import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { readServices } from "@/server/customer-queries";
import { queryObject, serviceQuerySchema } from "@/server/validation";
export async function GET(request: Request) { return apiHandler(async () => { await getAuthenticatedCustomer(); const filters = serviceQuerySchema.parse(queryObject(request.url)); return apiData(await readServices(filters)); }); }
