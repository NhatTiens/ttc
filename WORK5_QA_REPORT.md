# Work 05 QA Report

## Current status

**IMPLEMENTATION CANDIDATE — LOCAL RUNTIME ACCEPTANCE PENDING**

This environment completed source/static checks but cannot complete real dependency/PostgreSQL/Next.js gates because package installation timed out and PostgreSQL/Docker is unavailable here. Do not mark Work 05 accepted until the local commands and browser checks below pass.

## Implemented route coverage

19 Admin pages are present, including Dashboard, users/detail, orders/detail, services/new/detail, categories, wallets, transactions, deposits/detail, support/detail, analytics, settings, audit logs and the provider placeholder.

26 Admin REST route modules are present and protected with centralized ADMIN authorization. All 13 actual POST/PATCH Admin mutation modules include the same-origin guard.

## Automated backend coverage

`apps/web/tests/backend/work5.admin.integration.test.ts` covers:

- positive/negative wallet adjustment;
- insufficient negative adjustment;
- ledger/audit generation;
- concurrent deposit confirmation and single credit;
- deposit fail/cancel with no credit;
- concurrent/replayed order refund and single credit;
- REFUND ledger, OrderLog and audit consistency;
- category/service create/update;
- duplicate service code;
- invalid service price/range;
- service price history;
- maintenance/disable state;
- safe category disable;
- suspend/reactivate behavior and login policy;
- admin support reply/status;
- settings persistence/audit.

The Work 04 backend tests remain in the same serialized test command to protect accepted customer behavior.

## Runtime API smoke coverage

`qa/work5-admin-api-smoke.mjs` is designed to verify against the running Next.js + PostgreSQL stack:

- unauthenticated Admin API -> UNAUTHORIZED;
- CUSTOMER -> Admin API -> FORBIDDEN;
- ADMIN -> allowed;
- suspend invalidates existing session and blocks new login;
- reactivation restores fresh login;
- ledger-backed idempotent wallet adjustment;
- deposit confirmation credits exactly once after replay;
- order refund credits exactly once after replay;
- service create/update/disable and customer-catalog reflection;
- disabled service cannot accept customer order;
- Admin support reply visible to customer;
- system setting enforcement and restoration;
- analytics and required audit actions.

## Static checks executed in implementation environment

```text
UI source lint script                    PASS
Component contract                       PASS (33 components / 5 platforms / 7 statuses)
Customer responsive source contract      PASS (1440/1280/1024/768/430/390/375)
Admin responsive source contract         PASS (admin CSS breakpoints/navigation/mobile rules present)
Customer application route contract      PASS (15 required / 3 aliases)
Work 04 backend contract                 PASS
Work 05 Admin contract                   PASS (19 pages / 26 API routes / 13 mutation guards)
Admin mutation same-origin scan           PASS
TS/TSX syntax parser                     PASS (161 files / 0 parse errors)
Production escape-hatch scan             PASS (no new any/ts-ignore/eslint-disable/as never)
Provider/Tương Tác Chéo runtime scan     PASS (placeholder text only; no provider call)
Browser confirm() scan                   PASS
```

## Local gates still required

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
# another terminal
npm run qa:work5:api
```

Run the seed twice to demonstrate idempotence.

## E2E/manual flows still required locally

- Admin login -> Customers -> suspend -> verify customer blocked -> reactivate.
- Customer pending deposit -> Admin confirm -> wallet + ledger + audit, no double credit.
- Customer order -> Admin detail/refund -> single refund + log/audit.
- Admin service create/update -> customer catalog and server-side price behavior.
- Customer support -> Admin reply -> customer sees reply/status.
- Settings/maintenance behavior.
- Work 03 core customer flows regression.

## Responsive/browser QA still required locally

Viewports: 1440, 1280, 1024, 768, 430, 390, 375.

Verify Admin sidebar/rail/mobile navigation, tables/mobile representation, filters, forms, charts, dialogs/modals, dangerous confirmations, user/order/deposit/ticket details and no horizontal overflow. Browser console must contain no hydration error, uncaught exception, React warning or unhandled failed navigation/API request.

## Known limitations by design

- No external provider integration.
- No Tương Tác Chéo API call.
- No automatic payment gateway.
- `/admin/providers` is only configuration-ready placeholder UI.
- Work 05 does not fake Submitted/Processing/Completed provider states.
- System settings do not store secrets.
