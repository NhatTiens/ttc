import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminProviderJobs } from "@/server/admin-queries";
import { adminProviderJobQuerySchema, adminQueryObject } from "@/server/admin-validation";

export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireAdmin(request);
    return apiData(await readAdminProviderJobs(adminProviderJobQuerySchema.parse(adminQueryObject(request.url))));
  });
}
