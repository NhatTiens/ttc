import { createCategory, DomainError } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminCategories } from "@/server/admin-queries";
import { adminCategorySchema } from "@/server/admin-validation";
export async function GET(request: Request) { return apiHandler(async () => { await requireAdmin(request); return apiData(await readAdminCategories()); }); }
export async function POST(request: Request) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const input = adminCategorySchema.parse(await parseJson(request)); if (!input.id) throw new DomainError("VALIDATION_ERROR", "Cần mã danh mục khi tạo mới.", 400); const category = await createCategory(actor, { id: input.id, name: input.name, sortOrder: input.sortOrder, enabled: input.enabled }); const rows = await readAdminCategories(); return apiData(rows.find((row) => row.id === category.id), { status: 201 }); }); }
