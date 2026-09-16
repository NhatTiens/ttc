# Work 05 — Admin Dashboard & Operations

## Status

Implementation candidate built on the accepted Work 04 backend/database baseline. Work 05 is **not accepted until the real local PostgreSQL/Next.js test gates and browser/responsive QA pass**.

## Scope

Work 05 adds a production-oriented Admin Application using the same Next.js app, Auth.js identity, REST API conventions, Prisma client, PostgreSQL database and Design System already accepted in Work 04.

It does **not** connect a social-engagement provider, Tương Tác Chéo, or an automatic payment gateway. `/admin/providers` is an explicit configuration-ready placeholder and performs no provider calls.

## Architecture

```text
Admin UI
  -> Admin service
  -> RESTAdminRepository
  -> /api/v1/admin/*
  -> requireAdmin + Zod + same-origin guard
  -> admin domain operations / read queries
  -> Prisma
  -> PostgreSQL
```

React components never call Prisma directly.

## Routes

Implemented pages:

- `/admin`
- `/admin/users`, `/admin/users/[id]`
- `/admin/orders`, `/admin/orders/[id]`
- `/admin/services`, `/admin/services/new`, `/admin/services/[id]`
- `/admin/categories`
- `/admin/wallets`, `/admin/transactions`
- `/admin/deposits`, `/admin/deposits/[id]`
- `/admin/support`, `/admin/support/[id]`
- `/admin/analytics`
- `/admin/settings`
- `/admin/audit-logs`
- `/admin/providers` — placeholder only

`apps/web/src/app/admin/layout.tsx` performs server-side ADMIN authorization. Unauthenticated sessions are redirected to login; authenticated non-admin users are redirected to the customer area. Every Admin API independently calls centralized `requireAdmin()` and never relies on UI hiding.

## Operations

### Customer status

ADMIN can suspend/reactivate CUSTOMER accounts. Suspension increments `sessionVersion`, invalidating existing JWT sessions immediately on the next protected request. Suspended users cannot create new sessions because credential verification requires `ACTIVE` status.

### Wallet adjustment

No UI/API updates `wallet.balanceMinor` as a free-form field. `adjustCustomerWallet()` uses a Serializable transaction, validates the post-operation balance, updates the wallet, writes one `WalletTransaction(ADJUSTMENT)`, associates the admin/reason and writes `AdminAuditLog`. `Idempotency-Key` is required by the API.

### Deposit processing

`PENDING -> CONFIRMED` is atomic. The operation changes deposit state, credits the wallet exactly once, converts/creates the DEPOSIT ledger record and writes an audit entry inside a Serializable transaction. Replaying a confirmation after `CONFIRMED` returns the already-confirmed deposit without another credit. `PENDING -> FAILED/CANCELLED` never credits the wallet.

### Order refund

Work 05 permits internal refund only for `PENDING`, `VALIDATING`, `FAILED`, or `CANCELLED` orders. It deliberately does not expose a `Mark Completed` action or simulate provider progression. Refund performs wallet credit + REFUND ledger + `Order.status=REFUNDED` + `OrderLog` + audit atomically and is safe against replay/concurrent attempts.

### Services/categories

Admin manages customer selling price, quantity range, category, platform, popular flag and status. Unique service code is DB-enforced. Price changes create `ServicePriceHistory` and audit records. A category cannot be disabled while it still has a service that is not `DISABLED`.

### Support

Admin can read real ticket conversations, reply as `ADMIN` and set ticket status. Customer messages remain immutable through the Admin UI.

### Settings

The singleton `SystemSetting(default)` holds only non-secret operational settings: site name, support email, maintenance mode, minimum deposit, order creation toggle and support toggle. Secrets are not stored here. Customer order/deposit/support domain paths enforce the relevant settings server-side.

## Dashboard & analytics

Dashboard/analytics data comes from PostgreSQL. Metrics are named to match their meaning: customer spend rather than accounting revenue. Implemented analytics include orders over time, customer spend, new customers, deposit volume, refund volume, platform distribution, top services, order-status distribution and wallet liability.

## Database migration

Work 05 migration:

```text
packages/db/prisma/migrations/202609160002_work5_admin/migration.sql
```

It adds:

- `service_categories.enabled`
- admin/reason attribution to `wallet_transactions`
- `service_price_history`
- `admin_audit_logs`
- `system_settings`
- supporting foreign keys/indexes/check constraints

## Development seed

`npm run db:seed` remains idempotent and now creates, when development seeding is enabled:

- one ADMIN account;
- primary and secondary CUSTOMER accounts;
- service catalog and wallets;
- sample PENDING order;
- sample PENDING deposit;
- sample support ticket;
- default SystemSetting.

Default credentials are development-only and documented in `.env.example`.

## QA commands

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run db:seed
npm run test:backend
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
npm run dev:web
# second PowerShell
npm run qa:work5:api
```

Manual browser QA is still required at 1440/1280/1024/768/430/390/375 before acceptance.
