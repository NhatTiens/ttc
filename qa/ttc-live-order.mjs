import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const { TTCProviderAdapter } = await import("../packages/providers/src/index.ts");

if (process.env.TTC_LIVE_TEST_ALLOW_ORDER !== "YES_I_UNDERSTAND") {
  throw new Error('Refusing to create a real TTC order. Set TTC_LIVE_TEST_ALLOW_ORDER="YES_I_UNDERSTAND" only for an intentional test order.');
}
const serviceId = process.env.TTC_LIVE_TEST_SERVICE_ID?.trim();
const link = process.env.TTC_LIVE_TEST_LINK?.trim();
const quantity = Number(process.env.TTC_LIVE_TEST_QUANTITY ?? "");
if (!serviceId || !link || !Number.isInteger(quantity) || quantity <= 0) {
  throw new Error("TTC_LIVE_TEST_SERVICE_ID, TTC_LIVE_TEST_LINK and positive integer TTC_LIVE_TEST_QUANTITY are required.");
}

const adapter = new TTCProviderAdapter();
console.log("TTC LIVE order smoke - this can spend provider balance.");
const result = await adapter.createOrder({
  internalOrderId: `live-smoke-${Date.now()}`,
  publicOrderId: `LIVE-${Date.now()}`,
  externalServiceId: serviceId,
  target: link,
  quantity
});
if (result.outcome !== "ACCEPTED") {
  console.log(`RESULT ${result.outcome} ${result.code}: ${result.message}`);
  process.exitCode = 1;
} else {
  console.log(`PASS create order -> TTC order ${result.externalOrderId}`);
  const status = await adapter.getOrderStatus({ externalOrderId: result.externalOrderId });
  console.log(`PASS status ${status.status} (raw: ${status.rawStatus ?? "n/a"}, remains: ${status.remaining ?? "n/a"})`);
}
