import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "apps/web/src");
const failures = [];
const expect = (label, condition) => { if (!condition) failures.push(label); };
const exists = (relative) => fs.existsSync(path.join(src, relative));
const read = (relative) => fs.readFileSync(path.join(src, relative), "utf8");

const requiredRoutes = {
  "/dashboard": "app/(app)/dashboard/page.tsx",
  "/services": "app/(app)/services/page.tsx",
  "/order/new": "app/(app)/order/new/page.tsx",
  "/orders": "app/(app)/orders/page.tsx",
  "/orders/[id]": "app/(app)/orders/[id]/page.tsx",
  "/wallet/deposit": "app/(app)/wallet/deposit/page.tsx",
  "/wallet/history": "app/(app)/wallet/history/page.tsx",
  "/pricing": "app/(app)/pricing/page.tsx",
  "/support": "app/(app)/support/page.tsx",
  "/support/new": "app/(app)/support/new/page.tsx",
  "/support/[id]": "app/(app)/support/[id]/page.tsx",
  "/profile": "app/(app)/profile/page.tsx",
  "/login": "app/(auth)/login/page.tsx",
  "/register": "app/(auth)/register/page.tsx",
  "/forgot-password": "app/(auth)/forgot-password/page.tsx"
};

for (const [route, file] of Object.entries(requiredRoutes)) expect(`route missing ${route}`, exists(file));

const aliases = ["app/(app)/orders/new/page.tsx", "app/(app)/wallet/transactions/page.tsx", "app/(app)/account/page.tsx"];
for (const file of aliases) expect(`legacy alias missing ${file}`, exists(file));

expect("customer repository interface missing", exists("repositories/customer-repository.ts"));
expect("mock repository missing", exists("repositories/mock/mock-customer-repository.ts"));
expect("customer service missing", exists("services/customer-service.ts"));
expect("domain types missing", exists("domain/customer.ts"));
expect("validation missing", exists("validation/customer.ts"));

for (const file of Object.values(requiredRoutes)) {
  const source = read(file);
  expect(`page directly imports mock data: ${file}`, !source.includes("mock-customer-data") && !source.includes("mock-customer-repository"));
}

const service = read("services/customer-service.ts");
expect("service does not use repository abstraction", service.includes("CustomerRepository") && service.includes("mockCustomerRepository"));

const navigation = read("content/navigation.ts");
for (const href of ["/dashboard", "/services", "/pricing", "/order/new", "/orders", "/wallet", "/support", "/profile"]) expect(`sidebar navigation missing ${href}`, navigation.includes(`href: "${href}"`));

const css = read("app/globals.css");
for (const breakpoint of ["max-width: 1279px", "max-width: 1024px", "max-width: 767px", "max-width: 430px", "max-width: 389px"]) expect(`responsive rule missing ${breakpoint}`, css.includes(breakpoint));
expect("mobile customer layouts missing", css.includes(".order-builder-grid") && css.includes(".support-thread-layout") && css.includes(".auth-page"));
expect("customer app must not create admin pages", !exists("app/(app)/admin/page.tsx"));

if (failures.length) {
  console.error("Customer application contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Customer application contract passed.");
console.log(`Required routes: ${Object.keys(requiredRoutes).length}; legacy aliases: ${aliases.length}.`);
