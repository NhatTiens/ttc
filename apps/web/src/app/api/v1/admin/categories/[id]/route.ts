import { DomainError, updateCategory } from "@tuong-tac-pro/domain";
import { apiData, apiHandler, parseJson, requireSameOrigin } from "@/server/api";
import { requireAdmin } from "@/server/admin-auth";
import { readAdminCategories } from "@/server/admin-queries";
import { adminCategorySchema } from "@/server/admin-validation";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return apiHandler(async () => { requireSameOrigin(request); const { actor } = await requireAdmin(request); const { id } = await params; const input = adminCategorySchema.parse(await parseJson(request)); await updateCategory(actor, id, { name: input.name, sortOrder: input.sortOrder, enabled: input.enabled }); const category = (await readAdminCategories()).find((row) => row.id === id); if (!category) throw new DomainError("VALIDATION_ERROR", "Không tìm thấy danh mục.", 404); return apiData(category); }); }
