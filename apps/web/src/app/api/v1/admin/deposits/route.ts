import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminDeposits } from "@/server/admin-queries";
import { adminDepositQuerySchema, adminQueryObject } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminDeposits(adminDepositQuerySchema.parse(adminQueryObject(request.url)))); }); }
