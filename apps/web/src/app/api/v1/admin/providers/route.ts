import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminProviders } from "@/server/admin-queries";
import { adminProviderQuerySchema, adminQueryObject } from "@/server/admin-validation";

export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireAdmin(request);
    const query = adminProviderQuerySchema.parse(adminQueryObject(request.url));
    return apiData(await readAdminProviders(query));
  });
}
