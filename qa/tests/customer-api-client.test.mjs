import assert from "node:assert/strict";
import test from "node:test";
import { restCustomerRepository } from "../../apps/web/src/repositories/rest-customer-repository.ts";

test("malformed successful mutation responses preserve the same idempotency key on retry", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const keys = [];
  let call = 0;
  globalThis.fetch = async (_url, init) => {
    keys.push(new Headers(init.headers).get("Idempotency-Key"));
    call += 1;
    if (call === 1) return new Response("not-json", { status: 200 });
    return Response.json({ data: { id: "TT-RECOVERED" } });
  };
  const payload = { quoteId: crypto.randomUUID(), targetUrl: "https://example.com/replay" };
  await assert.rejects(() => restCustomerRepository.createOrder(payload), (error) => error.code === "MALFORMED_RESPONSE");
  assert.equal((await restCustomerRepository.createOrder(payload)).id, "TT-RECOVERED");
  assert.ok(keys[0]);
  assert.equal(keys[0], keys[1]);
});
