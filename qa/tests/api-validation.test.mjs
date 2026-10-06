import assert from "node:assert/strict";
import test from "node:test";
import { createOrderSchema, createQuoteSchema, serviceQuerySchema, orderQuerySchema } from "../../apps/web/src/server/validation.ts";
import { adminOrderQuerySchema, adminServiceQuerySchema } from "../../apps/web/src/server/admin-validation.ts";

test("customer and admin catalog/order filters accept Google Maps", () => {
  assert.equal(serviceQuerySchema.parse({ platform: "google" }).platform, "google");
  assert.equal(orderQuerySchema.parse({ platform: "google" }).platform, "google");
  assert.equal(adminOrderQuerySchema.parse({ platform: "GOOGLE" }).platform, "GOOGLE");
  assert.equal(adminServiceQuerySchema.parse({ platform: "GOOGLE" }).platform, "GOOGLE");
});

test("quote/order request schemas require server quote and ignore browser prices", () => {
  assert.equal(createQuoteSchema.safeParse({ serviceId: "service", quantity: 1.5 }).success, false);
  assert.equal(createOrderSchema.safeParse({ serviceId: "service", quantity: 100, targetUrl: "https://example.com" }).success, false);
  const input = { quoteId: "00000000-0000-4000-8000-000000000001", targetUrl: "https://example.com" };
  assert.deepEqual(createOrderSchema.parse({ ...input, charge: 1, price: 1, userId: "another-user" }), input);
  assert.equal(createOrderSchema.safeParse({ ...input, targetUrl: "javascript:alert(1)" }).success, false);
});
