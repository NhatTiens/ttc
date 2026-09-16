import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminWallets } from "@/server/admin-queries";
import { adminQueryObject, adminWalletQuerySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminWallets(adminWalletQuerySchema.parse(adminQueryObject(request.url)))); }); }
