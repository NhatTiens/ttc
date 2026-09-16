import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const baseUrl = (process.env.WORK4_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SEED_DEVELOPMENT_EMAIL ?? "minh@example.com";
const password = process.env.SEED_DEVELOPMENT_PASSWORD ?? "demo1234";

const cookieJar = new Map();
function absorbCookies(response) {
  const values = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const header of values) {
    const pair = header.split(";", 1)[0];
    const index = pair.indexOf("=");
    if (index > 0) cookieJar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}
function cookieHeader() { return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join("; "); }
async function request(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  if (cookieJar.size) headers.set("Cookie", cookieHeader());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: init.redirect ?? "manual" });
  absorbCookies(response);
  return response;
}
async function json(path, init = {}, expected = 200) {
  const response = await request(path, init);
  const payload = await response.json().catch(() => ({}));
  if (response.status !== expected) throw new Error(`${init.method ?? "GET"} ${path}: expected ${expected}, got ${response.status}: ${JSON.stringify(payload)}`);
  return payload.data;
}
function assert(condition, message) { if (!condition) throw new Error(message); }

console.log(`Work 04 API smoke against ${baseUrl}`);

const csrfResponse = await request("/api/auth/csrf");
assert(csrfResponse.ok, `Auth CSRF endpoint failed: ${csrfResponse.status}`);
const { csrfToken } = await csrfResponse.json();
assert(typeof csrfToken === "string" && csrfToken.length > 10, "Missing Auth.js CSRF token");

const signInBody = new URLSearchParams({ csrfToken, email, password, callbackUrl: "/dashboard", json: "true" });
const signInResponse = await request("/api/auth/callback/credentials", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: signInBody.toString()
});
assert([200, 302, 303].includes(signInResponse.status), `Credentials sign-in failed: ${signInResponse.status}`);

const profile = await json("/api/v1/me");
const walletBefore = await json("/api/v1/wallet");
assert(profile.email.toLowerCase() === email.toLowerCase(), "Authenticated profile email mismatch");

const services = await json("/api/v1/services");
const service = services.find((item) => item.status === "Active");
assert(service, "No ACTIVE service available for smoke test");
const quantity = service.min;
const expectedCharge = Math.ceil(service.ratePerThousand * quantity / 1000);
assert(walletBefore.balance >= expectedCharge, `Seed wallet is too small for smoke order: need ${expectedCharge}`);
const smokeId = Date.now().toString(36);
const orderKey = `smoke-order-${smokeId}`;
const orderPayload = { serviceId: service.id, targetUrl: `https://example.com/work4-smoke/${smokeId}`, quantity };
const order = await json("/api/v1/orders", {
  method: "POST",
  headers: { "Idempotency-Key": orderKey },
  body: JSON.stringify(orderPayload)
}, 201);
assert(order.status === "Pending", "New Work 04 order must remain Pending without provider integration");
const replayedOrder = await json("/api/v1/orders", {
  method: "POST",
  headers: { "Idempotency-Key": orderKey },
  body: JSON.stringify(orderPayload)
}, 201);
assert(replayedOrder.id === order.id, "Order Idempotency-Key replay created a different order");
const orderDetail = await json(`/api/v1/orders/${encodeURIComponent(order.id)}`);
assert(orderDetail.id === order.id && orderDetail.timeline?.length >= 1, "Order detail/timeline persistence failed");
const walletAfterOrder = await json("/api/v1/wallet");
assert(walletAfterOrder.balance === walletBefore.balance - expectedCharge, "Wallet debit does not match server-side charge");

const methods = await json("/api/v1/deposit-methods");
const method = methods.find((item) => item.enabled);
assert(method, "No enabled deposit method available");
const balanceBeforeDeposit = (await json("/api/v1/wallet")).balance;
const depositKey = `smoke-deposit-${smokeId}`;
const depositPayload = { methodId: method.id, amount: method.min };
const deposit = await json("/api/v1/deposits", {
  method: "POST",
  headers: { "Idempotency-Key": depositKey },
  body: JSON.stringify(depositPayload)
}, 201);
const replayedDeposit = await json("/api/v1/deposits", {
  method: "POST",
  headers: { "Idempotency-Key": depositKey },
  body: JSON.stringify(depositPayload)
}, 201);
assert(replayedDeposit.id === deposit.id, "Deposit Idempotency-Key replay created a different request");
assert(deposit.status === "Pending", "Deposit request must remain Pending");
assert((await json("/api/v1/wallet")).balance === balanceBeforeDeposit, "Pending deposit must not credit wallet");
const deposits = await json("/api/v1/deposits");
assert(deposits.some((item) => item.id === deposit.id && item.status === "Pending"), "Deposit request was not persisted to the database");

const ticket = await json("/api/v1/support/tickets", {
  method: "POST",
  body: JSON.stringify({ subject: `Work 04 smoke ${smokeId}`, category: "General", message: "Tin nhắn kiểm thử persistence." })
}, 201);
await json(`/api/v1/support/tickets/${encodeURIComponent(ticket.id)}/messages`, {
  method: "POST",
  body: JSON.stringify({ body: "Phản hồi kiểm thử từ customer." })
}, 201);
const thread = await json(`/api/v1/support/tickets/${encodeURIComponent(ticket.id)}`);
assert(thread.messages.length >= 2, "Support reply persistence failed");

const phoneMarker = `0900${Date.now().toString().slice(-6)}`;
const updatedProfile = await json("/api/v1/me", {
  method: "PATCH",
  body: JSON.stringify({ name: profile.name, email: profile.email, phone: phoneMarker })
});
assert(updatedProfile.id === profile.id && updatedProfile.phone === phoneMarker, "Profile PATCH failed");
await json("/api/v1/me/notifications", {
  method: "PATCH",
  body: JSON.stringify(updatedProfile.notifications)
});

const transactions = await json("/api/v1/wallet/transactions");
assert(transactions.some((item) => item.reference === order.id && item.type === "Purchase"), "Purchase ledger entry missing");
assert(transactions.some((item) => item.reference === deposit.id && item.type === "Deposit" && item.status === "Pending"), "Pending deposit ledger entry missing");

console.log(`PASS order ${order.id}`);
console.log(`PASS deposit ${deposit.id}`);
console.log(`PASS support ${ticket.id}`);
console.log(`PASS profile phone ${phoneMarker}`);
console.log("Work 04 API smoke passed.");
