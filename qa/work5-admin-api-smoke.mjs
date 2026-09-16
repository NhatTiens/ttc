import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const baseUrl = (process.env.WORK5_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const customerEmail = process.env.SEED_DEVELOPMENT_EMAIL ?? "minh@example.com";
const customerPassword = process.env.SEED_DEVELOPMENT_PASSWORD ?? "demo1234";
const secondEmail = process.env.SEED_DEVELOPMENT_SECOND_EMAIL ?? "lan@example.com";
const secondPassword = process.env.SEED_DEVELOPMENT_SECOND_PASSWORD ?? "demo1234";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234";
const origin = new URL(baseUrl).origin;

function assert(condition, message) { if (!condition) throw new Error(message); }

class Client {
  cookies = new Map();

  absorbCookies(response) {
    const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    for (const header of values) {
      const pair = header.split(";", 1)[0];
      const index = pair.indexOf("=");
      if (index > 0) this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }

  cookieHeader() { return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; "); }

  async request(path, init = {}) {
    const headers = new Headers(init.headers ?? {});
    if (this.cookies.size) headers.set("Cookie", this.cookieHeader());
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (init.method && init.method !== "GET" && init.method !== "HEAD" && !headers.has("Origin")) headers.set("Origin", origin);
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: init.redirect ?? "manual" });
    this.absorbCookies(response);
    return response;
  }

  async api(path, init = {}, expected = 200) {
    const response = await this.request(path, init);
    const payload = await response.json().catch(() => ({}));
    if (response.status !== expected) throw new Error(`${init.method ?? "GET"} ${path}: expected ${expected}, got ${response.status}: ${JSON.stringify(payload)}`);
    return payload.data;
  }

  async expectApiError(path, init, expectedStatus, expectedCode) {
    const response = await this.request(path, init);
    const payload = await response.json().catch(() => ({}));
    assert(response.status === expectedStatus, `${init?.method ?? "GET"} ${path}: expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(payload)}`);
    if (expectedCode) assert(payload.error?.code === expectedCode, `${path}: expected ${expectedCode}, got ${payload.error?.code ?? "no error code"}`);
    return payload;
  }

  async login(email, password, callbackUrl) {
    const csrf = await this.request("/api/auth/csrf");
    assert(csrf.ok, `Auth CSRF endpoint failed: ${csrf.status}`);
    const { csrfToken } = await csrf.json();
    assert(typeof csrfToken === "string" && csrfToken.length > 10, "Missing Auth.js CSRF token");
    const body = new URLSearchParams({ csrfToken, email, password, callbackUrl, json: "true" });
    const response = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    assert([200, 302, 303].includes(response.status), `Credentials sign-in failed for ${email}: ${response.status}`);
    const sessionResponse = await this.request("/api/auth/session");
    const session = await sessionResponse.json().catch(() => ({}));
    return session?.user ?? null;
  }
}

console.log(`Work 05 admin API smoke against ${baseUrl}`);
const anonymous = new Client();
await anonymous.expectApiError("/api/v1/admin/dashboard", {}, 401, "UNAUTHORIZED");

const customer = new Client();
const customerSession = await customer.login(customerEmail, customerPassword, "/dashboard");
assert(customerSession?.email?.toLowerCase() === customerEmail.toLowerCase(), "Customer login failed");
await customer.expectApiError("/api/v1/admin/dashboard", {}, 403, "FORBIDDEN");

const admin = new Client();
const adminSession = await admin.login(adminEmail, adminPassword, "/admin");
assert(adminSession?.email?.toLowerCase() === adminEmail.toLowerCase(), "Admin login failed");
assert(adminSession?.role === "ADMIN", `Expected ADMIN session, got ${adminSession?.role ?? "none"}`);
const dashboard = await admin.api("/api/v1/admin/dashboard");
assert(typeof dashboard.metrics?.customers === "number", "Admin dashboard did not return database metrics");

const smokeId = Date.now().toString(36);
const users = await admin.api(`/api/v1/admin/users?search=${encodeURIComponent(secondEmail)}&page=1&pageSize=20`);
const secondUser = users.items.find((item) => item.email.toLowerCase() === secondEmail.toLowerCase());
assert(secondUser, `Second development customer ${secondEmail} not found. Run npm run db:seed.`);

const secondCustomer = new Client();
assert(await secondCustomer.login(secondEmail, secondPassword, "/dashboard"), "Second customer login failed before suspension");
await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/status`, { method: "PATCH", body: JSON.stringify({ status: "SUSPENDED" }) });
await secondCustomer.expectApiError("/api/v1/me", {}, 401, "UNAUTHORIZED");
const suspendedLogin = new Client();
assert(!(await suspendedLogin.login(secondEmail, secondPassword, "/dashboard")), "Suspended customer unexpectedly received a new session");
await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/status`, { method: "PATCH", body: JSON.stringify({ status: "ACTIVE" }) });
const reactivated = new Client();
assert(await reactivated.login(secondEmail, secondPassword, "/dashboard"), "Reactivated customer could not log in");
console.log("PASS authorization + suspend/reactivate");

const beforeAdjustment = await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}`);
const adjustmentKey = `work5-adjust-${smokeId}`;
const adjustment = await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/wallet-adjustments`, {
  method: "POST", headers: { "Idempotency-Key": adjustmentKey }, body: JSON.stringify({ amount: 50000, reason: "Work 05 API smoke credit" })
}, 201);
const adjustmentReplay = await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/wallet-adjustments`, {
  method: "POST", headers: { "Idempotency-Key": adjustmentKey }, body: JSON.stringify({ amount: 50000, reason: "Work 05 API smoke credit" })
}, 201);
assert(adjustmentReplay.id === adjustment.id, "Wallet adjustment idempotency replay created another ledger entry");
const afterAdjustment = await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}`);
assert(afterAdjustment.walletBalance === beforeAdjustment.walletBalance + 50000, "Wallet adjustment did not change balance exactly once");
await admin.api(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/wallet-adjustments`, {
  method: "POST", headers: { "Idempotency-Key": `work5-adjust-restore-${smokeId}` }, body: JSON.stringify({ amount: -50000, reason: "Work 05 API smoke restore" })
}, 201);
await admin.expectApiError(`/api/v1/admin/users/${encodeURIComponent(secondUser.id)}/wallet-adjustments`, {
  method: "POST", headers: { "Idempotency-Key": `work5-adjust-invalid-${smokeId}` }, body: JSON.stringify({ amount: -9007199254740991, reason: "Work 05 invalid negative balance" })
}, 409, "INSUFFICIENT_BALANCE");
console.log("PASS ledger-backed wallet adjustment + idempotency");

const methods = await customer.api("/api/v1/deposit-methods");
const method = methods.find((item) => item.enabled);
assert(method, "No enabled deposit method available");
const walletBeforeDeposit = await customer.api("/api/v1/wallet");
const deposit = await customer.api("/api/v1/deposits", {
  method: "POST", headers: { "Idempotency-Key": `work5-deposit-${smokeId}` }, body: JSON.stringify({ methodId: method.id, amount: method.min })
}, 201);
assert(deposit.status === "Pending", "Customer deposit must start Pending");
const confirmed = await admin.api(`/api/v1/admin/deposits/${encodeURIComponent(deposit.id)}/confirm`, { method: "POST", body: JSON.stringify({ reason: "Work 05 verified deposit" }) });
assert(confirmed.status === "CONFIRMED", "Admin deposit confirmation failed");
await admin.api(`/api/v1/admin/deposits/${encodeURIComponent(deposit.id)}/confirm`, { method: "POST", body: JSON.stringify({ reason: "Work 05 verified deposit retry" }) });
const walletAfterDeposit = await customer.api("/api/v1/wallet");
assert(walletAfterDeposit.balance === walletBeforeDeposit.balance + deposit.amount, "Double deposit confirmation credited wallet incorrectly");
console.log(`PASS atomic deposit confirmation ${deposit.id}`);

const services = await customer.api("/api/v1/services");
const activeService = services.find((item) => item.status === "Active");
assert(activeService, "No active service available for refund smoke");
const walletBeforeOrder = await customer.api("/api/v1/wallet");
const order = await customer.api("/api/v1/orders", {
  method: "POST", headers: { "Idempotency-Key": `work5-refund-order-${smokeId}` }, body: JSON.stringify({ serviceId: activeService.id, targetUrl: `https://example.com/work5-refund/${smokeId}`, quantity: activeService.min })
}, 201);
await admin.api(`/api/v1/admin/orders/${encodeURIComponent(order.id)}/refund`, { method: "POST", body: JSON.stringify({ reason: "Work 05 smoke refund before provider submission" }) });
await admin.api(`/api/v1/admin/orders/${encodeURIComponent(order.id)}/refund`, { method: "POST", body: JSON.stringify({ reason: "Work 05 smoke refund retry" }) });
const walletAfterRefund = await customer.api("/api/v1/wallet");
assert(walletAfterRefund.balance === walletBeforeOrder.balance, "Order refund did not credit exactly once");
assert((await admin.api(`/api/v1/admin/orders/${encodeURIComponent(order.id)}`)).status === "REFUNDED", "Admin order detail did not persist REFUNDED state");
console.log(`PASS atomic/idempotent order refund ${order.id}`);

const categories = await admin.api("/api/v1/admin/categories");
const category = categories.find((item) => item.enabled);
assert(category, "No enabled service category available");
const serviceCode = `W5${smokeId.toUpperCase()}`.replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
const servicePayload = {
  code: serviceCode,
  name: `Work 05 smoke ${smokeId}`,
  description: "Dịch vụ kiểm thử quản trị Work 05",
  platform: "THREADS",
  categoryId: category.id,
  ratePerThousand: 12345,
  min: 100,
  max: 10000,
  averageTime: "0–24 giờ",
  popular: false,
  status: "ACTIVE"
};
const createdService = await admin.api("/api/v1/admin/services", { method: "POST", body: JSON.stringify(servicePayload) }, 201);
assert(createdService.code === serviceCode, "Admin service creation failed");
assert((await customer.api("/api/v1/services")).some((item) => item.id === createdService.id && item.status === "Active"), "Customer catalog did not reflect created service");
const serviceOrder = await customer.api("/api/v1/orders", {
  method: "POST", headers: { "Idempotency-Key": `work5-service-order-${smokeId}` }, body: JSON.stringify({ serviceId: createdService.id, targetUrl: `https://example.com/work5-service/${smokeId}`, quantity: createdService.min })
}, 201);
const disabledService = await admin.api(`/api/v1/admin/services/${encodeURIComponent(createdService.id)}`, {
  method: "PATCH",
  body: JSON.stringify({ ...servicePayload, ratePerThousand: 13000, status: "DISABLED", priceChangeReason: "Work 05 smoke price/status change" })
});
assert(disabledService.status === "DISABLED" && disabledService.priceHistory.length >= 1, "Service status/price history update failed");
await customer.expectApiError("/api/v1/orders", {
  method: "POST", headers: { "Idempotency-Key": `work5-disabled-order-${smokeId}` }, body: JSON.stringify({ serviceId: createdService.id, targetUrl: `https://example.com/work5-disabled/${smokeId}`, quantity: createdService.min })
}, 409, "SERVICE_UNAVAILABLE");
await admin.api(`/api/v1/admin/orders/${encodeURIComponent(serviceOrder.id)}/refund`, { method: "POST", body: JSON.stringify({ reason: "Cleanup Work 05 service smoke order" }) });
console.log(`PASS service CRUD/status/price history ${createdService.id}`);

const ticket = await customer.api("/api/v1/support/tickets", {
  method: "POST", body: JSON.stringify({ subject: `Work 05 admin support ${smokeId}`, category: "General", message: "Customer message for admin smoke." })
}, 201);
await admin.api(`/api/v1/admin/support/tickets/${encodeURIComponent(ticket.id)}/messages`, { method: "POST", body: JSON.stringify({ body: "Admin reply from Work 05 smoke." }) }, 201);
await admin.api(`/api/v1/admin/support/tickets/${encodeURIComponent(ticket.id)}/status`, { method: "PATCH", body: JSON.stringify({ status: "RESOLVED" }) });
const customerThread = await customer.api(`/api/v1/support/tickets/${encodeURIComponent(ticket.id)}`);
assert(customerThread.messages.some((message) => message.body === "Admin reply from Work 05 smoke."), "Customer could not see admin support reply");
console.log(`PASS support administration ${ticket.id}`);

const originalSettings = await admin.api("/api/v1/admin/settings");
const changedSettings = await admin.api("/api/v1/admin/settings", {
  method: "PATCH",
  body: JSON.stringify({ ...originalSettings, siteName: `Tương Tác Pro QA ${smokeId}`, orderCreationEnabled: false })
});
assert(changedSettings.orderCreationEnabled === false, "Admin settings update failed");
const anotherActiveService = (await customer.api("/api/v1/services")).find((item) => item.status === "Active");
assert(anotherActiveService, "No active service available to verify orderCreationEnabled");
await customer.expectApiError("/api/v1/orders", {
  method: "POST", headers: { "Idempotency-Key": `work5-disabled-global-order-${smokeId}` }, body: JSON.stringify({ serviceId: anotherActiveService.id, targetUrl: `https://example.com/work5-settings/${smokeId}`, quantity: anotherActiveService.min })
}, 409, "SERVICE_UNAVAILABLE");
await admin.api("/api/v1/admin/settings", {
  method: "PATCH",
  body: JSON.stringify({ siteName: originalSettings.siteName, supportEmail: originalSettings.supportEmail, maintenanceMode: originalSettings.maintenanceMode, minimumDeposit: originalSettings.minimumDeposit, orderCreationEnabled: originalSettings.orderCreationEnabled, supportEnabled: originalSettings.supportEnabled })
});
console.log("PASS system settings enforcement + restore");

const analytics = await admin.api("/api/v1/admin/analytics?range=7d");
assert(Array.isArray(analytics.daily) && analytics.rangeDays === 7, "Admin analytics response invalid");
const auditLogs = await admin.api("/api/v1/admin/audit-logs?page=1&pageSize=100");
const actions = new Set(auditLogs.items.map((item) => item.action));
for (const action of ["USER_SUSPEND", "USER_ACTIVATE", "WALLET_ADJUSTMENT", "DEPOSIT_CONFIRM", "ORDER_REFUND", "SERVICE_CREATE", "SERVICE_UPDATE", "SUPPORT_REPLY", "SYSTEM_SETTING_UPDATE"]) {
  assert(actions.has(action), `Missing audit action ${action}`);
}
console.log("PASS analytics + audit log");

console.log(`PASS deposit ${deposit.id}`);
console.log(`PASS refund ${order.id}`);
console.log(`PASS service ${createdService.id}`);
console.log(`PASS support ${ticket.id}`);
console.log("Work 05 admin API smoke passed.");
