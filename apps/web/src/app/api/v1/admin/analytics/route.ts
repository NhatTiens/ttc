import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminAnalytics } from "@/server/admin-queries";
import { adminQueryObject, analyticsQuerySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); const input = analyticsQuerySchema.parse(adminQueryObject(request.url)); return apiData(await readAdminAnalytics(input.range === "7d" ? 7 : 30)); }); }
