import { DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminOrder } from "@/server/admin-queries";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await requireAdmin(request); const { id } = await params; const order = await readAdminOrder(id); if (!order) throw new DomainError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng.", 404); return apiData(order); }); }
