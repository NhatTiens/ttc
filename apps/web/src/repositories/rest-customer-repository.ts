"use client";

import { signIn, signOut } from "next-auth/react";
import type { CustomerRepository } from "./customer-repository";
import type {
  AuthResult, CreateOrderInput, CreateTicketInput, CustomerProfile, DashboardData, DepositMethod, DepositRequest,
  Order, Service, ServiceCategory, SupportMessage, SupportThread, SupportTicket, Wallet, WalletTransaction
} from "@/domain/customer";

type ApiSuccess<T> = { data: T };
type ApiFailure = { error?: { code?: string; message?: string } };

class ApiClientError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

function idempotencyKey(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

const memoryMutationKeys = new Map<string, string>();

async function payloadDigest(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getMutationKey(scope: "order" | "deposit", payload: unknown) {
  const digest = await payloadDigest(payload);
  const storageKey = `ttp:idempotency:${scope}:${digest}`;
  const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(storageKey) : memoryMutationKeys.get(storageKey);
  if (stored) return { key: stored, storageKey };
  const key = idempotencyKey(scope);
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(storageKey, key);
  else memoryMutationKeys.set(storageKey, key);
  return { key, storageKey };
}

function clearMutationKey(storageKey: string) {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(storageKey);
  memoryMutationKeys.delete(storageKey);
}

async function idempotentApiRequest<T>(scope: "order" | "deposit", payload: unknown, path: string, init: RequestInit) {
  const { key, storageKey } = await getMutationKey(scope, payload);
  const headers = new Headers(init.headers);
  headers.set("Idempotency-Key", key);
  try {
    const result = await apiRequest<T>(path, { ...init, headers });
    clearMutationKey(storageKey);
    return result;
  } catch (error) {
    // Keep the same key for ambiguous network/server failures so a retry cannot duplicate a committed mutation.
    if (error instanceof ApiClientError && error.status < 500) clearMutationKey(storageKey);
    throw error;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({})) as ApiSuccess<T> & ApiFailure;
  if (!response.ok) throw new ApiClientError(payload.error?.code ?? "REQUEST_FAILED", response.status, payload.error?.message ?? "Yêu cầu không thể hoàn tất.");
  return payload.data;
}

function withQuery(path: string, values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value && value !== "all") params.set(key, value);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export const restCustomerRepository: CustomerRepository = {
  async getShellData() {
    const [profile, wallet] = await Promise.all([apiRequest<CustomerProfile>("/api/v1/me"), apiRequest<Wallet>("/api/v1/wallet")]);
    return { profile, wallet };
  },
  getDashboard() { return apiRequest<DashboardData>("/api/v1/dashboard"); },
  listCategories() { return apiRequest<ServiceCategory[]>("/api/v1/service-categories"); },
  listServices(filters = {}) {
    return apiRequest<Service[]>(withQuery("/api/v1/services", { search: filters.search, platform: filters.platform, category: filters.category }));
  },
  getService(id: string) { return apiRequest<Service>(`/api/v1/services/${encodeURIComponent(id)}`).catch((error: unknown) => error instanceof ApiClientError && error.code === "SERVICE_NOT_FOUND" ? null : Promise.reject(error)); },
  listOrders(filters = {}) {
    return apiRequest<Order[]>(withQuery("/api/v1/orders", { search: filters.search, platform: filters.platform, status: filters.status, dateRange: filters.dateRange }));
  },
  getOrder(id: string) { return apiRequest<Order>(`/api/v1/orders/${encodeURIComponent(id)}`).catch((error: unknown) => error instanceof ApiClientError && error.code === "ORDER_NOT_FOUND" ? null : Promise.reject(error)); },
  createOrder(input: CreateOrderInput) {
    const payload = { serviceId: input.serviceId, targetUrl: input.targetUrl.trim(), quantity: input.quantity };
    return idempotentApiRequest<Order>("order", payload, "/api/v1/orders", { method: "POST", body: JSON.stringify(payload) });
  },
  getWallet() { return apiRequest<Wallet>("/api/v1/wallet"); },
  listWalletTransactions() { return apiRequest<WalletTransaction[]>("/api/v1/wallet/transactions"); },
  listDepositMethods() { return apiRequest<DepositMethod[]>("/api/v1/deposit-methods"); },
  createDeposit(methodId: string, amount: number) {
    const payload = { methodId, amount };
    return idempotentApiRequest<DepositRequest>("deposit", payload, "/api/v1/deposits", { method: "POST", body: JSON.stringify(payload) });
  },
  listTickets() { return apiRequest<SupportTicket[]>("/api/v1/support/tickets"); },
  getTicket(id: string) { return apiRequest<SupportThread>(`/api/v1/support/tickets/${encodeURIComponent(id)}`).catch((error: unknown) => error instanceof ApiClientError && error.code === "TICKET_NOT_FOUND" ? null : Promise.reject(error)); },
  createTicket(input: CreateTicketInput) { return apiRequest<SupportTicket>("/api/v1/support/tickets", { method: "POST", body: JSON.stringify(input) }); },
  sendSupportMessage(ticketId: string, body: string) { return apiRequest<SupportMessage>(`/api/v1/support/tickets/${encodeURIComponent(ticketId)}/messages`, { method: "POST", body: JSON.stringify({ body }) }); },
  getProfile() { return apiRequest<CustomerProfile>("/api/v1/me"); },
  updateProfile(input: Pick<CustomerProfile, "name" | "email" | "phone">) { return apiRequest<CustomerProfile>("/api/v1/me", { method: "PATCH", body: JSON.stringify(input) }); },
  async changePassword(currentPassword: string, nextPassword: string) {
    await apiRequest<{ updated: boolean }>("/api/v1/me/password", { method: "PATCH", body: JSON.stringify({ currentPassword, nextPassword }) });
  },
  updateNotificationPreferences(input: CustomerProfile["notifications"]) { return apiRequest<CustomerProfile>("/api/v1/me/notifications", { method: "PATCH", body: JSON.stringify(input) }); },
  async login(email: string, password: string) {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) throw new Error("Email hoặc mật khẩu không đúng.");
    const profile = await apiRequest<CustomerProfile>("/api/v1/me");
    return { ok: true, user: { id: profile.id, name: profile.name, email: profile.email } } satisfies AuthResult;
  },
  async register(name: string, email: string, password: string) {
    const user = await apiRequest<AuthResult["user"]>("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) throw new Error("Tài khoản đã tạo nhưng chưa thể đăng nhập. Vui lòng đăng nhập lại.");
    return { ok: true, user };
  },
  async requestPasswordReset(email: string) { await apiRequest<{ accepted: boolean }>("/api/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); },
  async logout() { await signOut({ redirect: false }); }
};
