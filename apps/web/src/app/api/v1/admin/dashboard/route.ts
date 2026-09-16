import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminDashboard } from "@/server/admin-queries";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminDashboard()); }); }
