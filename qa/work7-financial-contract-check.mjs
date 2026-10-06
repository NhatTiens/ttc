import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const required = (path) => assert(existsSync(join(root, path)), `Missing Work 07 file: ${path}`);

const files = [
  "packages/db/prisma/migrations/202610060001_work7_wallet_quotes/migration.sql",
  "packages/domain/src/wallet-domain.ts",
  "apps/web/src/app/api/v1/quotes/route.ts",
  "apps/web/tests/backend/work7.financial.integration.test.ts",
  "WORK7_ARCHITECTURE_HARDENING.md",
  "scripts/work7-verify.sh"
];
files.forEach(required);

const schema = read("packages/db/prisma/schema.prisma");
for (const marker of ["model OrderQuote", "model WalletReservation", "WalletReservationStatus", "reservedMinor", "quoteId"]) {
  assert(schema.includes(marker), `Missing schema marker: ${marker}`);
}

const customer = read("packages/domain/src/customer-domain.ts");
assert(customer.includes('UPDATE "wallets"') && customer.includes('"balance_minor" - "reserved_minor"'), "Order reservation must use one atomic available-balance predicate");
assert(customer.includes("orderQuote.updateMany") && customer.includes("expiresAt: { gt: now }"), "Quote consumption must be conditional and expiry-aware");
assert(!customer.includes("type: WalletTransactionType.PURCHASE"), "Create order must not write a completed PURCHASE");

const wallet = read("packages/domain/src/wallet-domain.ts");
assert(wallet.includes("WalletReservationStatus.CAPTURED") && wallet.includes("WalletReservationStatus.RELEASED"), "Capture/release state guards are missing");
assert(wallet.includes("reservation-capture:"), "Capture ledger idempotency key is missing");

const worker = read("apps/worker/src/provider-worker.ts");
assert(worker.includes("captureOrderReservationInTransaction"), "Provider acceptance must capture the reservation");
assert(worker.includes("releaseOrderReservationInTransaction"), "Provider rejection must release the reservation");
assert(worker.includes("UNKNOWN_SUBMISSION") && worker.includes("manualReviewProviderJob"), "Unknown submission must enter manual review");

const page = read("apps/web/src/app/(app)/order/new/page.tsx");
assert(page.includes("customerService.createQuote") && page.includes("quoteId: quote.id"), "Order UI must use the server quote flow");

console.log("Work 07 financial contract passed: server quotes, atomic reservations, idempotent capture/release and worker uncertainty handling are present.");
