import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");

const { TTCProviderAdapter } = await import("../packages/providers/src/index.ts");

const adapter = new TTCProviderAdapter();
console.log("TTC read-only API smoke");
const connection = await adapter.testConnection();
console.log(`PASS connection (${connection.latencyMs ?? 0}ms)`);
const balance = await adapter.getBalance();
console.log(`PASS balance ${balance.amountMinor.toString()} ${balance.currency}`);
if (process.env.TTC_XU_TO_VND_RATE) {
  const services = await adapter.getServices();
  const available = services.filter((item) => item.status === "AVAILABLE").length;
  console.log(`PASS services ${services.length} total / ${available} supported Default|Package`);
} else {
  console.log("SKIP services: set TTC_XU_TO_VND_RATE before importing provider rates into VND economics.");
}
