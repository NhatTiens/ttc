import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const baseUrl = (process.env.WORK6_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const customerEmail = process.env.SEED_DEVELOPMENT_EMAIL ?? "minh@example.com";
const customerPassword = process.env.SEED_DEVELOPMENT_PASSWORD ?? "demo1234";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234";
const origin = new URL(baseUrl).origin;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

class Client {
  cookies = new Map();
  absorbCookies(response) {
    const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    for (const header of values) {
      const pair = header.split(";", 1)[0]; const index = pair.indexOf("=");
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
    this.absorbCookies(response); return response;
  }
  async api(path, init = {}, expected = 200) {
    const response = await this.request(path, init); const payload = await response.json().catch(() => ({}));
    if (response.status !== expected) throw new Error(`${init.method ?? "GET"} ${path}: expected ${expected}, got ${response.status}: ${JSON.stringify(payload)}`);
    return payload.data;
  }
  async expectApiError(path, init, expectedStatus, expectedCode) {
    const response = await this.request(path, init); const payload = await response.json().catch(() => ({}));
    assert(response.status === expectedStatus, `${path}: expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(payload)}`);
    assert(!expectedCode || payload.error?.code === expectedCode, `${path}: expected ${expectedCode}, got ${payload.error?.code}`);
  }
  async login(email, password, callbackUrl) {
    const csrf = await this.request("/api/auth/csrf"); const { csrfToken } = await csrf.json();
    const body = new URLSearchParams({ csrfToken, email, password, callbackUrl, json: "true" });
    await this.request("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    return (await (await this.request("/api/auth/session")).json())?.user ?? null;
  }
}

console.log(`Work 06 provider API smoke against ${baseUrl}`);
const anonymous = new Client();
await anonymous.expectApiError("/api/v1/admin/providers?page=1&pageSize=20", {}, 401, "UNAUTHORIZED");

const customer = new Client();
assert(await customer.login(customerEmail, customerPassword, "/dashboard"), "Development customer login failed. Run npm run db:seed.");
await customer.expectApiError("/api/v1/admin/providers?page=1&pageSize=20", {}, 403, "FORBIDDEN");
console.log("PASS provider Admin authorization");

const admin = new Client();
const session = await admin.login(adminEmail, adminPassword, "/admin/providers");
assert(session?.role === "ADMIN", "Admin login failed. Run npm run db:seed.");
const providers = await admin.api("/api/v1/admin/providers?page=1&pageSize=20");
const ttc = providers.items.find((item) => item.code === "TTC");
assert(ttc, "Seeded TTC provider record not found. Run npm run db:seed.");
const detail = await admin.api(`/api/v1/admin/providers/${encodeURIComponent(ttc.id)}`);
const forbiddenProviderKey = /^(api_?key|secret|authorization|password(hash)?|access_?token|refresh_?token|credential)$/i;
function assertNoProviderSecrets(value, path = "provider") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProviderSecrets(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenProviderKey.test(key), `Provider Admin response leaked forbidden key ${path}.${key}`);
    assertNoProviderSecrets(child, `${path}.${key}`);
  }
}
assertNoProviderSecrets(detail);
const serialized = JSON.stringify(detail);
if (process.env.TTC_API_KEY) assert(!serialized.includes(process.env.TTC_API_KEY), "Provider Admin response leaked TTC_API_KEY value");
assert(typeof detail.credentialConfigured === "boolean", "Provider detail must expose only a credential-configured indicator");
console.log("PASS provider detail is database-backed and secret-safe");

const action = await admin.api(`/api/v1/admin/providers/${encodeURIComponent(ttc.id)}/actions`, { method: "POST", body: JSON.stringify({ action: "TEST_CONNECTION" }) }, 202);
assert(action.type === "TEST_CONNECTION" && action.status === "PENDING", "Provider action did not enqueue a durable job");
const jobs = await admin.api("/api/v1/admin/provider-jobs?page=1&pageSize=100");
assert(jobs.items.some((job) => job.id === action.id), "Enqueued provider job not persisted in PostgreSQL read model");
console.log(`PASS durable provider action job ${action.id}`);

const customerServices = await customer.api("/api/v1/services");
const customerPayload = JSON.stringify(customerServices).toLowerCase();
for (const forbidden of ["externalserviceid", "providercost", "grossmargin", "providerorder", "ttc_api_key"]) {
  assert(!customerPayload.includes(forbidden), `Customer service API leaked provider internal field ${forbidden}`);
}
console.log("PASS customer API hides provider internals");
console.log("Work 06 provider API smoke passed (internal API layer; this smoke does not call TTC live).\nUse `npm run qa:ttc:readonly` for an intentional read-only TTC connection test, then run the worker after provider configuration is complete.");
