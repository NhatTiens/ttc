import { DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler } from "@/server/api";
import { getAuthenticatedCustomer } from "@/server/auth-user";
import { readService } from "@/server/customer-queries";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { await getAuthenticatedCustomer(); const { id } = await params; const service = await readService(id); if (!service) throw new DomainError("SERVICE_NOT_FOUND", "Không tìm thấy dịch vụ.", 404); return apiData(service); }); }
