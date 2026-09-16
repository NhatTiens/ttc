import { DomainError, updateService } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminService } from "@/server/admin-queries";
import { adminServiceSchema } from "@/server/admin-validation";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await requireAdmin(request); const { id } = await params; const service = await readAdminService(id); if (!service) throw new DomainError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.", 404); return apiData(service); }); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminServiceSchema.parse(await parseJson(request)); await updateService(actor, id, { ...input, ratePerThousandMinor: BigInt(input.ratePerThousand) }); return apiData(await readAdminService(id)); }); }
