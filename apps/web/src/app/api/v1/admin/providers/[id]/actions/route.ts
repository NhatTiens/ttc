import { ProviderJobType } from "@tuong-tac-pro/db";
import { enqueueAdminProviderJob } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { adminProviderActionSchema } from "@/server/admin-validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const { actor } = await requireAdmin(request);
    const { id } = await context.params;
    const input = adminProviderActionSchema.parse(await parseJson(request));
    const type = input.action === "TEST_CONNECTION" ? ProviderJobType.TEST_CONNECTION
      : input.action === "SYNC_BALANCE" ? ProviderJobType.SYNC_BALANCE
        : ProviderJobType.SYNC_SERVICES;
    const job = await enqueueAdminProviderJob(actor, id, type);
    return apiData({ id: job.id, type: job.type, status: job.status }, { status: 202 });
  });
}
