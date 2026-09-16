import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminSupportTickets } from "@/server/admin-queries";
import { adminQueryObject, adminSupportQuerySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminSupportTickets(adminSupportQuerySchema.parse(adminQueryObject(request.url)))); }); }
