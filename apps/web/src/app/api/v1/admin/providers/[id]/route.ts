import { setProviderEnabled } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminProvider } from "@/server/admin-queries";
import { adminProviderStatusSchema } from "@/server/admin-validation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    await requireAdmin(request);
    const { id } = await context.params;
    const provider = await readAdminProvider(id);
    if (!provider) return Response.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy provider." } }, { status: 404 });
    return apiData(provider);
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const { actor } = await requireAdmin(request);
    const { id } = await context.params;
    const input = adminProviderStatusSchema.parse(await parseJson(request));
    await setProviderEnabled(actor, id, input.enabled);
    const provider = await readAdminProvider(id);
    if (!provider) return Response.json({ error: { code: "NOT_FOUND", message: "Không tìm thấy provider." } }, { status: 404 });
    return apiData(provider);
  });
}
