import { updateNotificationPreferences } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { notificationSchema } from "@/server/validation";
import { readProfile } from "@/server/customer-queries";

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const user = await getAuthenticatedCustomer();
    const input = notificationSchema.parse(await parseJson(request));
    await updateNotificationPreferences(user.id, input);
    return apiData(await readProfile(user.id));
  });
}
