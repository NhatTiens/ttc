import { createOrderQuote } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { toOrderQuote } from "@/server/mappers";
import { createQuoteSchema } from "@/server/validation";

export async function POST(request: Request) {
  return apiHandler(async () => {
    requireSameOrigin(request);
    const user = await getAuthenticatedCustomer();
    const input = createQuoteSchema.parse(await parseJson(request));
    return apiData(toOrderQuote(await createOrderQuote(user.id, input)), { status: 201 });
  });
}
