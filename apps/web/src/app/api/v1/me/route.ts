import { updateCustomerProfile } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { profileSchema } from "@/server/validation";
import { readProfile } from "@/server/customer-queries";

export async function GET() {
  return apiHandler(async () => { const user = await getAuthenticatedCustomer(); return apiData(await readProfile(user.id)); });
}
export async function PATCH(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const user = await getAuthenticatedCustomer();
    const input = profileSchema.parse(await parseJson(request));
    await updateCustomerProfile(user.id, input);
    return apiData(await readProfile(user.id));
  });
}
