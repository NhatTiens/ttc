import { DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminDeposit } from "@/server/admin-queries";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await requireAdmin(request); const { id } = await params; const deposit = await readAdminDeposit(id); if (!deposit) throw new DomainError("DEPOSIT_NOT_FOUND", "Không tìm thấy yêu cầu nạp tiền.", 404); return apiData(deposit); }); }
