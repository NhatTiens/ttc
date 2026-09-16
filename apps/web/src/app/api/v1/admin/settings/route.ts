import { updateSystemSettings } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminSettings } from "@/server/admin-queries";
import { adminSettingsSchema } from "@/server/admin-validation";

export async function GET(request: Request) {
  return apiHandler(async () => {
    await requireAdmin(request);
    return apiData(await readAdminSettings());
  });
}

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const { actor } = await requireAdmin(request);
    const input = adminSettingsSchema.parse(await parseJson(request));

    await updateSystemSettings(actor, {
      siteName: input.siteName,
      supportEmail: input.supportEmail,
      maintenanceMode: input.maintenanceMode,
      minimumDepositMinor: BigInt(input.minimumDeposit),
      orderCreationEnabled: input.orderCreationEnabled,
      supportEnabled: input.supportEnabled
    });

    return apiData(await readAdminSettings());
  });
}
