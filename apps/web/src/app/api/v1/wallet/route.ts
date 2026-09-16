import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { readWallet } from "@/server/customer-queries";
export async function GET() { return apiHandler(async () => { const user = await getAuthenticatedCustomer(); return apiData(await readWallet(user.id)); }); }
