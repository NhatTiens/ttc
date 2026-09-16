import assert from "node:assert/strict";
import test from "node:test";
import {
  ProviderAdapterError,
  TTCProviderAdapter,
  calculateProviderCost,
  calculateSellingRate,
  classifyHttpError,
  decideProviderRetry,
  normalizeTTCStatus,
  proportionalRefundTarget,
  sanitizeProviderValue
} from "../src/index";

test("pricing is integer-safe", () => {
  assert.equal(calculateProviderCost(15_000n, 1_001, 1_000), 15_015n);
  assert.equal(calculateSellingRate(15_000n, { type: "PERCENTAGE", markupBps: 3_500 }), 20_250n);
  assert.equal(calculateSellingRate(15_000n, { type: "FIXED", fixedMarkupMinor: 2_000n }), 17_000n);
  assert.equal(proportionalRefundTarget(10_001n, 300, 1_000), 3_000n);
});

test("sanitizer redacts secrets recursively including TTC form key", () => {
  const result = sanitizeProviderValue({ apiKey: "abc", key: "ttc-secret", nested: { Authorization: "Bearer x", ok: "yes" } }) as Record<string, unknown>;
  assert.equal(result.apiKey, "[REDACTED]");
  assert.equal(result.key, "[REDACTED]");
  assert.deepEqual(result.nested, { Authorization: "[REDACTED]", ok: "yes" });
});

test("ambiguous create without provider idempotency goes to manual review", () => {
  const decision = decideProviderRetry(
    new ProviderAdapterError("PROVIDER_TIMEOUT", "timeout", { retryable: true, ambiguousSideEffect: true }),
    1,
    6,
    { sideEffecting: true, providerSupportsIdempotency: false }
  );
  assert.equal(decision.action, "MANUAL_REVIEW");
});

test("TTC service sync uses documented services form action and converts XU rate to VND", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody = "";
  globalThis.fetch = async (_input, init) => {
    requestBody = init?.body instanceof URLSearchParams ? init.body.toString() : String(init?.body ?? "");
    return new Response(JSON.stringify([
      { service: 1, name: "Youtube views", type: "Default", category: "Youtube", rate: "2.5", min: "200", max: "10000", refill: true },
      { service: 2, name: "Youtube custom comments", type: "Custom Comments/Texts", category: "Youtube", rate: "3.25", min: "10", max: "500", refill: false }
    ]), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "fake-key", xuToVndRate: "1000" });
    const services = await adapter.getServices();
    assert.match(requestBody, /(^|&)key=fake-key(&|$)/);
    assert.match(requestBody, /(^|&)action=services(&|$)/);
    assert.equal(services[0]?.externalServiceId, "1");
    assert.equal(services[0]?.providerRateMinor, 2500n);
    assert.equal(services[0]?.currency, "VND");
    assert.equal(services[0]?.rateUnit, 1000);
    assert.equal(services[0]?.platform, "YOUTUBE");
    assert.equal(services[0]?.status, "AVAILABLE");
    assert.equal(services[1]?.status, "UNAVAILABLE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TTC create order sends documented add payload and accepts returned order ID", async () => {
  const originalFetch = globalThis.fetch;
  let body = new URLSearchParams();
  globalThis.fetch = async (_input, init) => {
    body = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ""));
    return new Response(JSON.stringify({ order: 99999 }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "fake-key" });
    const result = await adapter.createOrder({
      internalOrderId: "internal-1",
      publicOrderId: "TT-1",
      externalServiceId: "123",
      target: "https://example.com/post/1",
      quantity: 500
    });
    assert.equal(body.get("key"), "fake-key");
    assert.equal(body.get("action"), "add");
    assert.equal(body.get("service"), "123");
    assert.equal(body.get("link"), "https://example.com/post/1");
    assert.equal(body.get("quantity"), "500");
    assert.deepEqual(result, { outcome: "ACCEPTED", externalOrderId: "99999", status: "SUBMITTED", raw: { order: 99999 } });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TTC create order treats a 200 response without order ID as unknown submission", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "fake-key" });
    const result = await adapter.createOrder({
      internalOrderId: "internal-1",
      publicOrderId: "TT-1",
      externalServiceId: "123",
      target: "https://example.com/post/1",
      quantity: 500
    });
    assert.equal(result.outcome, "UNKNOWN");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TTC order status maps documented provider statuses", async () => {
  const originalFetch = globalThis.fetch;
  let body = new URLSearchParams();
  globalThis.fetch = async (_input, init) => {
    body = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ""));
    return new Response(JSON.stringify({ charge: "2.5", start_count: "168", status: "In progress", remains: "42" }), { status: 200 });
  };
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "fake-key" });
    const result = await adapter.getOrderStatus({ externalOrderId: "99999" });
    assert.equal(body.get("action"), "status");
    assert.equal(body.get("order"), "99999");
    assert.equal(result.status, "PROCESSING");
    assert.equal(result.startCount, 168);
    assert.equal(result.remaining, 42);
    assert.equal(normalizeTTCStatus("Completed"), "COMPLETED");
    assert.equal(normalizeTTCStatus("Partial"), "PARTIAL");
    assert.equal(normalizeTTCStatus("Canceled"), "CANCELLED");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TTC balance uses documented balance action", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ balance: "686868", currency: "XU" }), { status: 200 });
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "fake-key" });
    const balance = await adapter.getBalance();
    assert.equal(balance.amountMinor, 686868n);
    assert.equal(balance.currency, "XU");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TTC response errors are normalized without exposing credential", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "Invalid API key" }), { status: 200 });
  try {
    const adapter = new TTCProviderAdapter({ apiKey: "secret-value" });
    await assert.rejects(() => adapter.getBalance(), (error: unknown) => {
      if (!(error instanceof ProviderAdapterError)) return false;
      assert.equal(error.code, "PROVIDER_UNAUTHORIZED");
      assert.equal(error.message.includes("secret-value"), false);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("HTTP error classification distinguishes auth, rate-limit and temporary server failures", () => {
  const auth = classifyHttpError(401);
  assert.equal(auth.code, "PROVIDER_UNAUTHORIZED");
  assert.equal(auth.retryable, false);
  const limited = classifyHttpError(429);
  assert.equal(limited.code, "PROVIDER_RATE_LIMIT");
  assert.equal(limited.retryable, true);
  const server = classifyHttpError(503);
  assert.equal(server.code, "PROVIDER_UNAVAILABLE");
  assert.equal(server.retryable, true);
});

test("retry with provider idempotency keeps ambiguous transient create retryable", () => {
  const decision = decideProviderRetry(
    new ProviderAdapterError("PROVIDER_TIMEOUT", "timeout", { retryable: true, ambiguousSideEffect: true }),
    1,
    6,
    { sideEffecting: true, providerSupportsIdempotency: true }
  );
  assert.equal(decision.action, "RETRY");
  assert.ok((decision.delayMs ?? 0) > 0);
});
