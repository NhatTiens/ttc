# Tương Tác Pro — Customer Application

Work 3 builds the complete customer-facing application on top of the approved Architecture and Work 2 Design System/AppShell. The existing design tokens, shell behavior, shared components, responsive breakpoints, and `/design-system` route are preserved.

This checkpoint intentionally does **not** implement the Admin application, real provider API adapters, a real payment gateway, or production deployment.

## Customer routes

```text
/dashboard
/services
/pricing
/order/new
/orders
/orders/[id]
/wallet/deposit
/wallet/history
/support
/support/new
/support/[id]
/profile

/login
/register
/forgot-password
```

Compatibility aliases retained from the architecture checkpoint:

```text
/orders/new           -> /order/new
/wallet               -> /wallet/history
/wallet/transactions  -> /wallet/history
/account               -> /profile
/account/security      -> /profile
/account/sessions      -> /profile
```

## Data architecture

Customer pages do not import mock records directly. The dependency direction is:

```text
Page / reusable customer component
  -> CustomerService
    -> CustomerRepository interface
      -> MockCustomerRepository (Work 3)
      -> RESTCustomerRepository (future backend adapter)
```

The mock implementation lives under `src/repositories/mock/`. When the real REST API is ready, UI pages can keep the same service/domain contracts and swap the repository implementation.

## What is implemented

- Dashboard with balance, order KPIs, spend, popular platform/services, and recent orders.
- Searchable/filterable services catalog for Facebook, TikTok, Instagram, YouTube, and Threads.
- New-order workflow with platform/service selection, link validation, quantity min/max validation, calculated cost, balance check, confirmation modal, submit loading state, and success state.
- Order history with search, status/platform/date filters, pagination, responsive table/cards.
- Order detail with financial/quantity fields and status timeline.
- Config-driven wallet deposit UI without a real payment provider.
- Wallet transaction history covering deposit, purchase, refund, and adjustment.
- Full pricing view.
- Support ticket list, ticket creation, and customer/admin conversation thread.
- Profile page with personal details, password/security state, and notification preferences.
- Login, register, and forgot-password flows backed by the mock service layer.
- Loading, empty, error, disabled/submitting, and success states where applicable.
- Responsive behavior for 1440, 1280, 1024, 768, 430, 390, and 375 px.

## Important source areas

```text
apps/web/src/
  app/
    (app)/             customer pages + preserved /design-system
    (auth)/            authentication pages
  components/
    customer/          customer-specific reusable composition
    layout/            existing AppShell/Sidebar/Topbar/MobileNavigation
    ui/                approved design-system primitives
  domain/customer.ts
  repositories/
    customer-repository.ts
    mock/
  services/customer-service.ts
  validation/customer.ts
  hooks/use-async-resource.ts
  lib/format.ts
```

## Commands

When dependencies are installed:

```bash
npm install
npm run dev:web
npm run lint:web
npm run typecheck:web
npm run build:web
```

Dependency-free checks used in this execution environment:

```bash
npm run check:offline
```

A static dashboard visual harness is also included at:

```text
preview/customer-app/dashboard.html
```

It is only a visual/runtime fallback for environments without Next.js dependencies; the real implementation remains the Next.js source under `apps/web`.

## Scope boundary

Do not treat this checkpoint as authorization to start `/admin`, connect a live provider, connect a live payment gateway, or deploy production infrastructure. Those remain later phases.

### Luu y ve `check:offline`

`check:offline` khong goi backend/provider/payment services, nhung van can `npm install` de co TypeScript va type definitions cua React/Next.js. File `src/validation/framework-stubs.d.ts` chi la fallback phuc vu validation trong moi truong dong goi, va duoc loai khoi `tsconfig.offline.json` de tranh xung dot voi `@types/react`/Next.js sau khi dependencies da duoc cai.
