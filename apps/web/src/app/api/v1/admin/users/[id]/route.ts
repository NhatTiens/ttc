import { DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminUser } from "@/server/admin-queries";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await requireAdmin(request); const { id } = await params; const user = await readAdminUser(id); if (!user) throw new DomainError("VALIDATION_ERROR", "Không tìm thấy khách hàng.", 404); return apiData(user); }); }
