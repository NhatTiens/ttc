import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminAuditLogs } from "@/server/admin-queries";
import { adminAuditQuerySchema, adminQueryObject } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminAuditLogs(adminAuditQuerySchema.parse(adminQueryObject(request.url)))); }); }
