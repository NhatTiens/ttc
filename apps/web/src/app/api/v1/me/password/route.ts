import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { changeCustomerPassword } from "@/server/account-service";
import { passwordSchema } from "@/server/validation";

export async function PATCH(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const user = await getAuthenticatedCustomer();
    const input = passwordSchema.parse(await parseJson(request));
    await changeCustomerPassword(user.id, input.currentPassword, input.nextPassword);
    return apiData({ updated: true, sessionInvalidated: true });
  });
}
