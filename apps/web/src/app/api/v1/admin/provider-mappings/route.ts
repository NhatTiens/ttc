import { upsertServiceProviderMapping } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { adminProviderMappingSchema } from "@/server/admin-validation";

export async function POST(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const { actor } = await requireAdmin(request);
    const input = adminProviderMappingSchema.parse(await parseJson(request));
    const mapping = await upsertServiceProviderMapping(actor, {
      ...input,
      fixedMarkupMinor: BigInt(input.fixedMarkup),
      minimumMarginMinor: BigInt(input.minimumMargin)
    });
    return apiData({ id: mapping.id, status: mapping.status, enabled: mapping.enabled }, { status: 201 });
  });
}
