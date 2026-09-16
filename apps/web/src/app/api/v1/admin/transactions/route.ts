import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminTransactions } from "@/server/admin-queries";
import { adminQueryObject, adminTransactionQuerySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminTransactions(adminTransactionQuerySchema.parse(adminQueryObject(request.url)))); }); }
