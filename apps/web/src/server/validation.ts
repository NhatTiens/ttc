import { z } from "zod";

const httpUrl = z.string().trim().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL phải bắt đầu bằng http:// hoặc https://.");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200).regex(/[A-Za-z]/).regex(/\d/)
});
export const forgotPasswordSchema = z.object({ email: z.string().trim().email().max(320) });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(32)
});
export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  nextPassword: z.string().min(8).max(200).regex(/[A-Za-z]/).regex(/\d/)
});
export const notificationSchema = z.object({
  orderUpdates: z.boolean(), walletUpdates: z.boolean(), promotions: z.boolean(), supportReplies: z.boolean()
});
export const createOrderSchema = z.object({ serviceId: z.string().trim().min(1).max(64), targetUrl: httpUrl, quantity: z.number().int().positive().max(10_000_000) });
export const serviceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  platform: z.enum(["facebook", "tiktok", "instagram", "youtube", "threads", "all"]).optional(),
  category: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(200)
});
export const orderQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  platform: z.enum(["facebook", "tiktok", "instagram", "youtube", "threads", "all"]).optional(),
  status: z.enum(["Processing", "Completed", "Pending", "Failed", "Cancelled", "Partial", "Refunded", "all"]).optional(),
  dateRange: z.enum(["all", "7d", "30d", "90d"]).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(200)
});
export const createDepositSchema = z.object({ methodId: z.string().trim().min(1).max(64), amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
export const createTicketSchema = z.object({ subject: z.string().trim().min(4).max(180), category: z.string().trim().min(2).max(80), message: z.string().trim().min(4).max(5000) });
export const supportReplySchema = z.object({ body: z.string().trim().min(1).max(5000) });

export function queryObject(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}
