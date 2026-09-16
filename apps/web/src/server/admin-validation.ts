import { z } from "zod";

const pageFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
};

export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "all"]).default("all"),
  sort: z.enum(["newest", "oldest", "name"]).default("newest"),
  ...pageFields
});
export const adminUserStatusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });
export const walletAdjustmentSchema = z.object({
  amount: z.number().int().safe().refine((value) => value !== 0, "Số tiền phải khác 0."),
  reason: z.string().trim().min(4).max(255)
});
export const adminOrderQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  customer: z.string().trim().max(320).optional(),
  serviceId: z.string().trim().max(64).optional(),
  platform: z.enum(["FACEBOOK", "TIKTOK", "INSTAGRAM", "YOUTUBE", "THREADS", "all"]).default("all"),
  status: z.enum(["PENDING", "VALIDATING", "SUBMITTED", "PROCESSING", "COMPLETED", "PARTIAL", "FAILED", "CANCELLED", "REFUNDED", "all"]).default("all"),
  dateRange: z.enum(["all", "today", "7d", "30d", "90d"]).default("all"),
  ...pageFields
});
export const orderRefundSchema = z.object({ reason: z.string().trim().min(4).max(255) });
export const adminServiceQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  platform: z.enum(["FACEBOOK", "TIKTOK", "INSTAGRAM", "YOUTUBE", "THREADS", "all"]).default("all"),
  category: z.string().trim().max(64).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "DISABLED", "all"]).default("all"),
  ...pageFields
});
export const adminServiceSchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().min(3).max(5000),
  platform: z.enum(["FACEBOOK", "TIKTOK", "INSTAGRAM", "YOUTUBE", "THREADS"]),
  categoryId: z.string().trim().min(1).max(64),
  ratePerThousand: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  min: z.number().int().min(1).max(10_000_000),
  max: z.number().int().min(1).max(10_000_000),
  averageTime: z.string().trim().min(1).max(80),
  popular: z.boolean(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "DISABLED"]),
  priceChangeReason: z.string().trim().max(255).optional()
}).refine((value) => value.max >= value.min, { message: "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu.", path: ["max"] });
export const adminCategorySchema = z.object({
  id: z.string().trim().min(2).max(64).regex(/^[a-z0-9_-]+$/).optional(),
  name: z.string().trim().min(2).max(120),
  sortOrder: z.number().int().min(0).max(100000),
  enabled: z.boolean()
});
export const adminWalletQuerySchema = z.object({ search: z.string().trim().max(160).optional(), ...pageFields });
export const adminTransactionQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  type: z.enum(["DEPOSIT", "PURCHASE", "REFUND", "ADJUSTMENT", "all"]).default("all"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "all"]).default("all"),
  ...pageFields
});
export const adminDepositQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "FAILED", "CANCELLED", "REFUNDED", "all"]).default("all"),
  dateRange: z.enum(["all", "today", "7d", "30d", "90d"]).default("all"),
  ...pageFields
});
export const adminDepositActionSchema = z.object({ reason: z.string().trim().min(4).max(255) });
export const adminSupportQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["OPEN", "WAITING_CUSTOMER", "WAITING_SUPPORT", "RESOLVED", "CLOSED", "all"]).default("all"),
  ...pageFields
});
export const adminSupportReplySchema = z.object({ body: z.string().trim().min(1).max(5000) });
export const adminSupportStatusSchema = z.object({ status: z.enum(["OPEN", "WAITING_CUSTOMER", "WAITING_SUPPORT", "RESOLVED", "CLOSED"]) });
export const adminAuditQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(80).optional(),
  admin: z.string().trim().max(160).optional(),
  adminUserId: z.string().uuid().optional(),
  dateRange: z.enum(["all", "today", "7d", "30d", "90d"]).default("all"),
  ...pageFields
});
export const adminSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(120),
  supportEmail: z.string().trim().email().max(320),
  maintenanceMode: z.boolean(),
  minimumDeposit: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  orderCreationEnabled: z.boolean(),
  supportEnabled: z.boolean()
});
export const analyticsQuerySchema = z.object({ range: z.enum(["7d", "30d"]).default("30d") });

export function adminQueryObject(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}

export const adminProviderQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "DEGRADED", "all"]).default("all"),
  ...pageFields
});
export const adminProviderStatusSchema = z.object({ enabled: z.boolean() });
export const adminProviderActionSchema = z.object({ action: z.enum(["TEST_CONNECTION", "SYNC_SERVICES", "SYNC_BALANCE"]) });
export const adminProviderMappingSchema = z.object({
  serviceId: z.string().trim().min(1).max(64),
  providerServiceId: z.string().uuid(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(10_000).default(100),
  markupType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  markupBps: z.number().int().min(0).max(1_000_000).default(0),
  fixedMarkup: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  minimumMargin: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  pricingMode: z.enum(["MANUAL", "AUTO_MARKUP"]).default("MANUAL")
});
export const adminProviderJobQuerySchema = z.object({
  status: z.enum(["PENDING", "RUNNING", "RETRY", "MANUAL_REVIEW", "COMPLETED", "FAILED", "all"]).default("all"),
  ...pageFields
});
