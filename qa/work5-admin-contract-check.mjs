import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const pages = [
  "apps/web/src/app/admin/page.tsx",
  "apps/web/src/app/admin/users/page.tsx",
  "apps/web/src/app/admin/users/[id]/page.tsx",
  "apps/web/src/app/admin/orders/page.tsx",
  "apps/web/src/app/admin/orders/[id]/page.tsx",
  "apps/web/src/app/admin/services/page.tsx",
  "apps/web/src/app/admin/services/new/page.tsx",
  "apps/web/src/app/admin/services/[id]/page.tsx",
  "apps/web/src/app/admin/categories/page.tsx",
  "apps/web/src/app/admin/wallets/page.tsx",
  "apps/web/src/app/admin/transactions/page.tsx",
  "apps/web/src/app/admin/deposits/page.tsx",
  "apps/web/src/app/admin/deposits/[id]/page.tsx",
  "apps/web/src/app/admin/support/page.tsx",
  "apps/web/src/app/admin/support/[id]/page.tsx",
  "apps/web/src/app/admin/analytics/page.tsx",
  "apps/web/src/app/admin/settings/page.tsx",
  "apps/web/src/app/admin/audit-logs/page.tsx",
  "apps/web/src/app/admin/providers/page.tsx"
];
for (const page of pages) assert(existsSync(join(root, page)), `Missing admin page: ${page}`);

const apiRoutes = [
  "dashboard/route.ts", "users/route.ts", "users/[id]/route.ts", "users/[id]/status/route.ts", "users/[id]/wallet-adjustments/route.ts",
  "orders/route.ts", "orders/[id]/route.ts", "orders/[id]/refund/route.ts", "services/route.ts", "services/[id]/route.ts",
  "categories/route.ts", "categories/[id]/route.ts", "wallets/route.ts", "transactions/route.ts", "deposits/route.ts", "deposits/[id]/route.ts",
  "deposits/[id]/confirm/route.ts", "deposits/[id]/fail/route.ts", "deposits/[id]/cancel/route.ts", "support/tickets/route.ts",
  "support/tickets/[id]/route.ts", "support/tickets/[id]/messages/route.ts", "support/tickets/[id]/status/route.ts", "analytics/route.ts",
  "audit-logs/route.ts", "settings/route.ts"
].map((path) => `apps/web/src/app/api/v1/admin/${path}`);
for (const route of apiRoutes) {
  assert(existsSync(join(root, route)), `Missing admin API route: ${route}`);
  assert(read(route).includes("requireAdmin"), `Admin API route is not protected by requireAdmin: ${route}`);
}

const mutationRoutes = apiRoutes.filter((path) => /export async function (POST|PATCH)/.test(read(path)));
for (const route of mutationRoutes) {
  const source = read(route);
  assert(source.includes("requireSameOrigin"), `Mutation route missing same-origin guard: ${route}`);
}

const schema = read("packages/db/prisma/schema.prisma");
for (const model of ["AdminAuditLog", "ServicePriceHistory", "SystemSetting"]) assert(schema.includes(`model ${model} {`), `Missing Prisma model ${model}`);
for (const field of ["adminUserId", "reason", "minimumDepositMinor", "maintenanceMode", "orderCreationEnabled", "supportEnabled"]) assert(schema.includes(field), `Missing Work 05 Prisma field ${field}`);
assert(existsSync(join(root, "packages/db/prisma/migrations/202609160002_work5_admin/migration.sql")), "Missing Work 05 Prisma migration");

const domain = read("packages/domain/src/admin-domain.ts");
for (const operation of ["adjustCustomerWallet", "confirmDeposit", "refundOrder", "changeCustomerStatus", "createService", "updateService", "sendAdminSupportReply", "updateSystemSettings"]) {
  assert(domain.includes(`function ${operation}`) || domain.includes(`function ${operation}(`) || domain.includes(`async function ${operation}`), `Missing admin domain operation ${operation}`);
}
assert(domain.includes("TransactionIsolationLevel.Serializable"), "Money mutations must use Serializable transactions");
assert(domain.includes("AdminAuditLog") || domain.includes("adminAuditLog.create"), "Admin audit log write missing");
assert(!domain.includes('OrderStatus.COMPLETED\n') || !domain.includes('"Mark Completed"'), "Work 05 must not fake provider completion");

const adminAuth = read("apps/web/src/server/admin-auth.ts");
assert(adminAuth.includes("getAuthenticatedAdmin"), "requireAdmin must centralize ADMIN authorization");
const adminService = read("apps/web/src/services/admin-service.ts");
assert(adminService.includes("restAdminRepository") && !adminService.toLowerCase().includes("mock"), "Admin runtime must use REST repository, not mock data");

const layout = read("apps/web/src/app/admin/layout.tsx");
assert(layout.includes("getAuthenticatedAdmin"), "Admin page layout is not server-side protected");
const css = read("apps/web/src/app/globals.css");
for (const bp of ["1279", "899", "767", "430", "390", "375"]) assert(css.includes(bp), `Missing Admin responsive breakpoint ${bp}px`);
assert(css.includes("admin-mobile-nav") && css.includes("admin-sidebar"), "Admin navigation responsive styles missing");

const adminPages = pages.map(read).join("\n");
assert(!adminPages.includes("window.confirm("), "Dangerous admin actions must use product confirmation UI, not window.confirm");
assert(adminPages.includes("ConfirmDialog") || adminPages.includes("<Modal"), "Dangerous action confirmation UI not found");

const providerPage = read("apps/web/src/app/admin/providers/page.tsx");
assert(!/fetch\(|axios|api[_-]?key|tuongtaccheo/i.test(providerPage), "Providers placeholder must not call provider/Tuong Tac Cheo");
const productionSource = [read("packages/domain/src/admin-domain.ts"), read("apps/web/src/repositories/rest-admin-repository.ts"), ...apiRoutes.map(read)].join("\n");
assert(!/tuongtaccheo|external provider api|provider\.createOrder/i.test(productionSource), "Provider integration leaked into Work 05 runtime");

console.log(`Work 05 admin contract passed: ${pages.length} pages, ${apiRoutes.length} API routes, ${mutationRoutes.length} mutation-route guards.`);
