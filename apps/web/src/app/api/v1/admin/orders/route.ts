import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminOrders } from "@/server/admin-queries";
import { adminOrderQuerySchema, adminQueryObject } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminOrders(adminOrderQuerySchema.parse(adminQueryObject(request.url)))); }); }
