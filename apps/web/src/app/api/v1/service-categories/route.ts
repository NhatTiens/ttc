import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { readCategories } from "@/server/customer-queries";
export async function GET() { return apiHandler(async () => { await getAuthenticatedCustomer(); return apiData(await readCategories()); }); }
