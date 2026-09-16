import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function read(path) { return readFileSync(join(root, path), "utf8"); }
function requireFile(path) { if (!existsSync(join(root, path))) throw new Error(`Missing Work 04 file: ${path}`); }
function requireText(path, ...needles) {
  const source = read(path);
  for (const needle of needles) if (!source.includes(needle)) throw new Error(`${path} missing contract text: ${needle}`);
}

const schema = "packages/db/prisma/schema.prisma";
requireFile(schema);
for (const model of ["User", "Account", "Session", "VerificationToken", "Wallet", "WalletTransaction", "ServiceCategory", "Service", "Order", "OrderLog", "Deposit", "Payment", "SupportTicket", "SupportMessage", "NotificationPreference"]) {
  requireText(schema, `model ${model} {`);
}
requireText(schema, "@@unique([userId, idempotencyKey])", "balanceMinor", "reservedMinor", "requestFingerprint");

const migration = "packages/db/prisma/migrations/202609160001_work4_backend/migration.sql";
requireFile(migration);
requireText(migration,
  'CREATE TABLE "users"',
  'CREATE TABLE "wallets"',
  'CREATE TABLE "wallet_transactions"',
  'CREATE TABLE "orders"',
  'CREATE TABLE "order_logs"',
  'CREATE TABLE "deposits"',
  'CREATE TABLE "support_tickets"',
  'CONSTRAINT "wallets_balance_non_negative"',
  'CREATE UNIQUE INDEX "orders_user_id_idempotency_key_key"'
);
requireFile("packages/db/prisma/seed.ts");
requireText("packages/db/prisma/seed.ts", "upsert", "seed:development-opening-balance", "WalletTransactionType.ADJUSTMENT");

for (const route of [
  "apps/web/src/app/api/v1/me/route.ts",
  "apps/web/src/app/api/v1/dashboard/route.ts",
  "apps/web/src/app/api/v1/services/route.ts",
  "apps/web/src/app/api/v1/orders/route.ts",
  "apps/web/src/app/api/v1/orders/[id]/route.ts",
  "apps/web/src/app/api/v1/wallet/route.ts",
  "apps/web/src/app/api/v1/wallet/transactions/route.ts",
  "apps/web/src/app/api/v1/deposits/route.ts",
  "apps/web/src/app/api/v1/support/tickets/route.ts",
  "apps/web/src/app/api/v1/support/tickets/[id]/route.ts",
  "apps/web/src/app/api/v1/support/tickets/[id]/messages/route.ts"
]) requireFile(route);

requireText("apps/web/src/services/customer-service.ts", "restCustomerRepository", "new CustomerService(restCustomerRepository)");
if (read("apps/web/src/services/customer-service.ts").includes("mockCustomerRepository")) throw new Error("Production CustomerService must not default to MockCustomerRepository.");
requireText("packages/domain/src/customer-domain.ts", "TransactionIsolationLevel.Serializable", "balanceMinor: { gte: chargeMinor }", "WalletTransactionType.PURCHASE", "OrderStatus.PENDING", "requestFingerprint");
requireText("packages/domain/src/customer-domain.ts", "DepositStatus.PENDING", "WalletTransactionStatus.PENDING", "balanceAfterMinor: wallet.balanceMinor");
requireText("apps/web/src/server/auth-user.ts", "sessionVersion", "UserStatus.ACTIVE", "UserRole.CUSTOMER");
requireText("apps/web/src/app/(app)/layout.tsx", "redirect(\"/login\")");

const mutationRoutes = [
  "apps/web/src/app/api/v1/auth/register/route.ts",
  "apps/web/src/app/api/v1/auth/forgot-password/route.ts",
  "apps/web/src/app/api/v1/me/route.ts",
  "apps/web/src/app/api/v1/me/password/route.ts",
  "apps/web/src/app/api/v1/me/notifications/route.ts",
  "apps/web/src/app/api/v1/orders/route.ts",
  "apps/web/src/app/api/v1/deposits/route.ts",
  "apps/web/src/app/api/v1/support/tickets/route.ts",
  "apps/web/src/app/api/v1/support/tickets/[id]/messages/route.ts"
];
for (const route of mutationRoutes) requireText(route, "requireSameOrigin(request)");

requireText("apps/web/src/repositories/rest-customer-repository.ts", "idempotentApiRequest", "sessionStorage", "Idempotency-Key");

const forbidden = ["tuongtaccheo", "providerOrderId", "setTimeout(() => order.status"];
const backendFiles = [
  "packages/domain/src/customer-domain.ts",
  "apps/web/src/server/customer-queries.ts",
  "apps/web/src/repositories/rest-customer-repository.ts"
];
for (const path of backendFiles) {
  const source = read(path).toLowerCase();
  for (const text of forbidden) if (source.includes(text.toLowerCase())) throw new Error(`${path} contains out-of-scope provider behavior: ${text}`);
}

console.log("Work 04 backend contract check passed.");
