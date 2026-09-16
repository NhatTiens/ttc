"use client";

import type { AdminRepository } from "./admin-repository";
import type {
  AdminAnalytics, AdminAuditLog, AdminCategory, AdminDashboard, AdminDeposit, AdminOrder, AdminOrderDetail, AdminPage, AdminService,
  AdminServiceDetail, AdminSettings, AdminSupportThread, AdminSupportTicket, AdminTransaction, AdminUserDetail, AdminUserListItem, AdminWallet
} from "@/domain/admin";

class AdminApiError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) { super(message); this.name = "AdminApiError"; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "same-origin", cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { code?: string; message?: string } };
  if (!response.ok) throw new AdminApiError(payload.error?.code ?? "REQUEST_FAILED", response.status, payload.error?.message ?? "Yêu cầu quản trị không thể hoàn tất.");
  if (payload.data === undefined) throw new AdminApiError("INVALID_RESPONSE", 500, "Phản hồi máy chủ không hợp lệ.");
  return payload.data;
}

function query(path: string, values: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value));
  const suffix = params.toString(); return suffix ? `${path}?${suffix}` : path;
}
function key(prefix: string) { return `${prefix}-${globalThis.crypto.randomUUID()}`; }

const adminMutationKeys = new Map<string, string>();
async function digest(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function retainedIdempotencyKey(scope: string, payload: unknown) {
  const storageKey = `ttp:admin-idempotency:${scope}:${await digest(payload)}`;
  const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(storageKey) : adminMutationKeys.get(storageKey);
  if (stored) return { key: stored, storageKey };
  const next = key(scope);
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(storageKey, next);
  else adminMutationKeys.set(storageKey, next);
  return { key: next, storageKey };
}
function clearRetainedKey(storageKey: string) {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(storageKey);
  adminMutationKeys.delete(storageKey);
}
async function idempotentAdminRequest<T>(scope: string, payload: unknown, path: string, init: RequestInit) {
  const retained = await retainedIdempotencyKey(scope, payload);
  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", retained.key);
  try {
    const result = await request<T>(path, { ...init, headers });
    clearRetainedKey(retained.storageKey);
    return result;
  } catch (error) {
    if (error instanceof AdminApiError && error.status < 500) clearRetainedKey(retained.storageKey);
    throw error;
  }
}

export const restAdminRepository: AdminRepository = {
  getDashboard: () => request<AdminDashboard>("/api/v1/admin/dashboard"),
  listUsers: (filters = {}) => request<AdminPage<AdminUserListItem>>(query("/api/v1/admin/users", filters)),
  getUser: (id) => request<AdminUserDetail>(`/api/v1/admin/users/${encodeURIComponent(id)}`),
  setUserStatus: (id, status) => request<AdminUserDetail>(`/api/v1/admin/users/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adjustWallet: (id, amount, reason) => {
    const payload = { amount, reason };
    return idempotentAdminRequest<AdminTransaction>(`wallet-adjust:${id}`, payload, `/api/v1/admin/users/${encodeURIComponent(id)}/wallet-adjustments`, { method: "POST", body: JSON.stringify(payload) });
  },
  listOrders: (filters = {}) => request<AdminPage<AdminOrder>>(query("/api/v1/admin/orders", filters)),
  getOrder: (id) => request<AdminOrderDetail>(`/api/v1/admin/orders/${encodeURIComponent(id)}`),
  refundOrder: (id, reason) => request<AdminOrderDetail>(`/api/v1/admin/orders/${encodeURIComponent(id)}/refund`, { method: "POST", body: JSON.stringify({ reason }) }),
  listServices: (filters = {}) => request<AdminPage<AdminService>>(query("/api/v1/admin/services", filters)),
  getService: (id) => request<AdminServiceDetail>(`/api/v1/admin/services/${encodeURIComponent(id)}`),
  createService: (input) => request<AdminServiceDetail>("/api/v1/admin/services", { method: "POST", body: JSON.stringify(input) }),
  updateService: (id, input) => request<AdminServiceDetail>(`/api/v1/admin/services/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  listCategories: () => request<AdminCategory[]>("/api/v1/admin/categories"),
  createCategory: (input) => request<AdminCategory>("/api/v1/admin/categories", { method: "POST", body: JSON.stringify(input) }),
  updateCategory: (id, input) => request<AdminCategory>(`/api/v1/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  listWallets: (filters = {}) => request<AdminPage<AdminWallet>>(query("/api/v1/admin/wallets", filters)),
  listTransactions: (filters = {}) => request<AdminPage<AdminTransaction>>(query("/api/v1/admin/transactions", filters)),
  listDeposits: (filters = {}) => request<AdminPage<AdminDeposit>>(query("/api/v1/admin/deposits", filters)),
  getDeposit: (id) => request<AdminDeposit>(`/api/v1/admin/deposits/${encodeURIComponent(id)}`),
  confirmDeposit: (id, reason) => request<AdminDeposit>(`/api/v1/admin/deposits/${encodeURIComponent(id)}/confirm`, { method: "POST", body: JSON.stringify({ reason }) }),
  failDeposit: (id, reason) => request<AdminDeposit>(`/api/v1/admin/deposits/${encodeURIComponent(id)}/fail`, { method: "POST", body: JSON.stringify({ reason }) }),
  cancelDeposit: (id, reason) => request<AdminDeposit>(`/api/v1/admin/deposits/${encodeURIComponent(id)}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  listSupport: (filters = {}) => request<AdminPage<AdminSupportTicket>>(query("/api/v1/admin/support/tickets", filters)),
  getSupport: (id) => request<AdminSupportThread>(`/api/v1/admin/support/tickets/${encodeURIComponent(id)}`),
  sendSupportReply: async (id, body) => { await request(`/api/v1/admin/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) }); return request<AdminSupportThread>(`/api/v1/admin/support/tickets/${encodeURIComponent(id)}`); },
  setSupportStatus: async (id, status) => { await request(`/api/v1/admin/support/tickets/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); return request<AdminSupportThread>(`/api/v1/admin/support/tickets/${encodeURIComponent(id)}`); },
  getAnalytics: (range = "30d") => request<AdminAnalytics>(query("/api/v1/admin/analytics", { range })),
  listAuditLogs: (filters = {}) => request<AdminPage<AdminAuditLog>>(query("/api/v1/admin/audit-logs", filters)),
  getSettings: () => request<AdminSettings>("/api/v1/admin/settings"),
  updateSettings: (input) => request<AdminSettings>("/api/v1/admin/settings", { method: "PATCH", body: JSON.stringify(input) })
};
