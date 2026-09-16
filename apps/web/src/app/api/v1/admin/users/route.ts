import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminUsers } from "@/server/admin-queries";
import { adminQueryObject, adminUserQuerySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminUsers(adminUserQuerySchema.parse(adminQueryObject(request.url)))); }); }
