import { createService } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminService, readAdminServices } from "@/server/admin-queries";
import { adminQueryObject, adminServiceQuerySchema, adminServiceSchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminServices(adminServiceQuerySchema.parse(adminQueryObject(request.url)))); }); }
export async function POST(request: Request) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const input = adminServiceSchema.parse(await parseJson(request)); const service = await createService(actor, { ...input, ratePerThousandMinor: BigInt(input.ratePerThousand) }); return apiData(await readAdminService(service.id), { status: 201 }); }); }
