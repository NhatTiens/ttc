# Tương Tác Pro — Work 3 QA Report

## Scope

This report covers the Customer Application checkpoint built on the existing Architecture + Design System/AppShell. Admin, real provider integration, real payment integration, and deployment remain out of scope.

## Source preservation and audit

Work 2 source was retained and extended rather than replaced. The existing design tokens, responsive AppShell, 33 shared components, five platform identities, seven order statuses, and `/design-system` route remain present.

Work 3 adds domain/repository/service layers plus customer/auth routes. Customer pages do not directly import mock data or `MockCustomerRepository`.

## Checks executed

### 1. Offline source lint — PASS

Command:

```bash
npm --workspace @tuong-tac-pro/web run lint:offline
```

Result: `UI source lint passed.`

The check covers accidental inline styles, component hard-coded hex colors, console logging, TODO markers, and client-hook/client-boundary mistakes.

### 2. Strict offline TypeScript — PASS

Command:

```bash
npm --workspace @tuong-tac-pro/web run typecheck:offline
```

Result: PASS with zero diagnostics.

The offline config uses framework stubs because this container has no installed React/Next dependencies. `strict: true` remains enabled in the application configuration.

### 3. Existing design-system contract — PASS

```bash
node qa/component-contract-check.mjs
```

Result:

- 33 shared components present;
- 5 platforms present;
- 7 order statuses present;
- `/design-system` remains present.

### 4. Responsive contract — PASS

```bash
node qa/responsive-check.mjs
```

Verified shell behavior:

```text
1440 -> desktop sidebar, ~32 px main inline padding
1280 -> desktop sidebar, ~32 px main inline padding
1024 -> tablet rail, ~20 px main inline padding
768  -> tablet rail, ~20 px main inline padding
430  -> mobile bottom navigation, ~16 px main inline padding
390  -> mobile bottom navigation, ~16 px main inline padding
375  -> compact mobile bottom navigation, ~12 px main inline padding
```

Customer-specific CSS also contains responsive handling for order builder, service cards/tables, support thread, profile/security sections, wallet views, and auth pages.

### 5. Customer application contract — PASS

```bash
node qa/customer-application-check.mjs
```

Result: 15 required routes present plus retained legacy aliases.

The check also verifies:

- repository interface exists;
- mock repository is isolated from page components;
- customer service layer exists;
- domain types and validation exist;
- navigation includes every primary customer destination;
- customer responsive CSS exists;
- no Admin page was introduced.

### 6. Combined offline gate — PASS

```bash
npm run check:offline
```

All offline lint, TypeScript, design-system, responsive, and customer-contract checks pass in one run.

### 7. Static runtime fallback — PASS

A dependency-free Work 3 dashboard preview was served locally:

```text
GET /customer-app/dashboard.html -> HTTP 200
```

This verifies the generated static visual harness can be served in the current container. It is not a substitute for a real Next.js runtime test.

### 8. Real Next.js development server — BLOCKED BY ENVIRONMENT

Attempted:

```bash
npm run dev:web
```

Result: `next: not found` because this container does not contain project `node_modules`.

### 9. Real ESLint — BLOCKED BY ENVIRONMENT

Attempted:

```bash
npm run lint:web
```

Result: `eslint: not found` for the same dependency-availability reason.

### 10. Real TypeScript config — BLOCKED BY MISSING FRAMEWORK TYPES

Attempted:

```bash
npm run typecheck:web
```

The command reaches `tsc`, but reports missing `next`, `react`, `next/navigation`, and JSX framework declarations because the packages/types are not installed. Cascading JSX diagnostics therefore cannot be treated as source-code regressions. The dependency-free strict check above is green.

### 11. Production build — BLOCKED BY ENVIRONMENT

Attempted:

```bash
npm run build:web
```

Result: `next: not found`.

Package installation was also previously attempted, but package-registry DNS access was unavailable in this execution environment. A real build must be rerun in a normal Node environment before merge/deploy.

### 12. Console-error check

The application source contains no `console.*` statements. A browser-console runtime check cannot be completed without a runnable Next.js runtime in this container. This limitation is recorded rather than being marked as PASS.

### 13. Navigation check — PASS

Static route/navigation contract confirms the customer shell links to:

```text
/dashboard
/services
/pricing
/order/new
/orders
/wallet
/support
/profile
```

The required deep routes exist, and legacy architecture paths redirect to current canonical customer pages.

## Issues fixed during Work 3 QA

- Preserved the original desktop/tablet/mobile shell instead of creating page-specific navigation.
- Added repository/service separation so mock records are not embedded in page components.
- Added compatibility redirects for old Architecture route names.
- Removed a duplicate root skip-link whose target is owned by `AppShell`; auth pages therefore no longer contain a dead skip target.
- Changed inactive service actions from keyboard-focusable links into non-link disabled UI.
- Normalized Vietnamese customer-facing copy found during the final pass.
- Kept 1024 px on the tablet rail and mobile widths on the dedicated mobile navigation.

## Merge verification still required

In an environment with normal package-registry access:

```bash
npm install
npm run lint:web
npm run typecheck:web
npm run build:web
npm run dev:web
```

Then open all customer/auth routes, verify browser console output, keyboard navigation, and the seven requested viewport widths before production release.

## Current gate

The Work 3 source is complete for customer application review. The remaining blocked items are environment-dependent execution checks, not intentionally skipped application scope.

## Hotfix 2026-09-16 - offline typecheck config

- Fixed `tsconfig.offline.json` so it no longer compiles `src/validation/framework-stubs.d.ts` together with the real React/Next.js type packages.
- Root cause: the fallback declarations intentionally used `unknown` for `ReactNode`/JSX and a simplified `next/link` signature. Once `npm install` provided real framework types, declaration merging caused cascading JSX errors.
- `check:offline` now uses installed React/Next.js typings while keeping the Next TypeScript plugin disabled and avoiding external/backend dependencies.

## v3.0.3 build hotfix

A real Next.js 16.3.5 build on Windows compiled and completed TypeScript, then failed while prerendering `/order/new` because `useSearchParams()` was outside a `Suspense` boundary. v3.0.3 wraps both app routes that use `useSearchParams()` (`/order/new` and `/services`) and updates the `typedRoutes` configuration. Offline lint and customer/responsive/component contract checks pass after the patch. A full framework build should be rerun on the dependency-installed machine.
