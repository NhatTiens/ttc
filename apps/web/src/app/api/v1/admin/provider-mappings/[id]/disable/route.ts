import { disableServiceProviderMapping } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const { actor } = await requireAdmin(request);
    const { id } = await context.params;
    const mapping = await disableServiceProviderMapping(actor, id);
    return apiData({ id: mapping.id, status: mapping.status, enabled: mapping.enabled });
  });
}
