import { DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminSupportThread } from "@/server/admin-queries";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await requireAdmin(request); const { id } = await params; const thread = await readAdminSupportThread(id); if (!thread) throw new DomainError("TICKET_NOT_FOUND", "Không tìm thấy yêu cầu hỗ trợ.", 404); return apiData(thread); }); }
