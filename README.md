# Tương Tác Pro

Work 03 Customer Application is accepted. Work 04 integrates that UI with a real REST backend and PostgreSQL while keeping Admin, provider integration, Tương Tác Chéo, and real payment gateways out of scope.

## Current architecture

```text
Next.js Customer UI
  -> CustomerService
    -> CustomerRepository
      -> RESTCustomerRepository
        -> /api/v1
          -> Auth / Zod / Domain rules
            -> Prisma
              -> PostgreSQL
```

`MockCustomerRepository` remains for isolated preview/test purposes only. Production/default `CustomerService` uses `RESTCustomerRepository`.

## Workspaces

```text
apps/web                 Next.js customer UI + Auth.js + REST API
packages/db              Prisma schema/client/migrations/seed
packages/domain          money/order/wallet/support business rules
docs/architecture        approved architecture documents
qa                       Work 03 + Work 04 contract/runtime scripts
```

## Work 04 implemented areas

- register/login/logout with Argon2id credentials and Auth.js session;
- server-side session revalidation using user status/role/sessionVersion;
- protected customer routes;
- customer profile/password/notification preferences in PostgreSQL;
- service catalog seeded from Work 03;
- atomic order creation, server-side price calculation, wallet debit, PURCHASE ledger and OrderLog;
- Serializable/conditional-update concurrency protection;
- order and deposit idempotency keys;
- real wallet and transaction history;
- PENDING deposit requests without wallet credit;
- support tickets/messages with ownership checks;
- `RESTCustomerRepository` without page rewrites;
- Payment/PaymentEvent schema readiness only, with no fake gateway behavior.

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
/design-system
```

Compatibility redirects from Work 03 remain in place.

## Requirements

- Node.js 22+
- npm
- PostgreSQL, or Docker with Compose

## Environment

Copy the example file and replace `AUTH_SECRET`:

```powershell
Copy-Item .env.example .env
```

At minimum configure:

```text
DATABASE_URL
TEST_DATABASE_URL
AUTH_SECRET
```

`.env` and other secret env files are ignored by Git.

## Local PostgreSQL

```bash
docker compose -f docker-compose.work4.yml up -d
```

The compose setup creates `tuong_tac_pro`; on a fresh volume its init script also creates `tuong_tac_pro_test` for backend integration tests.

## Install and database setup

```bash
npm install
npm run db:validate
npm run db:migrate
npm run db:seed
```

`npm install` runs Prisma client generation. Production migration strategy is `prisma migrate deploy`; do not replace it with `db push`.

Development seed defaults (development only):

```text
minh@example.com
demo1234
```

Override them with `SEED_DEVELOPMENT_EMAIL` and `SEED_DEVELOPMENT_PASSWORD`.

## Run

```bash
npm run dev:web
```

Open `http://localhost:3000`.

## Work 04 test/QA commands

```bash
npm run test:backend
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

With the dev server running:

```bash
npm run qa:work4:api
```

For the required persistence-after-restart checkpoint, restart Next.js, set `WORK4_EXPECT_ORDER`, `WORK4_EXPECT_DEPOSIT`, `WORK4_EXPECT_TICKET`, and `WORK4_EXPECT_PHONE` to values produced by the smoke test, then run:

```bash
npm run qa:work4:persistence
```

## Database scripts

```text
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:migrate:dev
npm run db:seed
npm run db:studio
```

## Documentation

```text
WORK4_BACKEND.md
DATABASE_IMPLEMENTATION.md
API_IMPLEMENTATION.md
AUTH_IMPLEMENTATION.md
WALLET_LEDGER.md
WORK4_QA_REPORT.md

docs/architecture/API_SPEC.md
docs/architecture/DATABASE_SCHEMA.md
```

## Scope boundary

Work 04 does not add `/admin`, call any social engagement provider, connect Tương Tác Chéo, simulate provider completion, or confirm a payment. A new order remains `PENDING`; a new deposit remains `PENDING` and does not credit the wallet.

---

# Work 05 — Admin Dashboard & Operations

Work 05 adds a real-data Admin Console on top of the accepted Work 04 PostgreSQL/REST backend. Admin pages live under `/admin`; API endpoints live under `/api/v1/admin/*`. Customer runtime remains REST-backed and no provider integration is enabled.

Development seed now includes the existing customer plus development-only ADMIN/secondary-customer accounts configurable with:

```text
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_DEVELOPMENT_SECOND_EMAIL
SEED_DEVELOPMENT_SECOND_PASSWORD
```

After applying the Work 05 migration:

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
```

With the app running, execute:

```powershell
npm run qa:work5:api
```

Work 05 documentation:

```text
WORK5_ADMIN.md
ADMIN_API.md
ADMIN_SECURITY.md
ADMIN_OPERATIONS.md
WORK5_QA_REPORT.md
```

Work 05 explicitly does not connect providers, Tương Tác Chéo, or an automatic payment gateway. `/admin/providers` is a non-calling placeholder for the next integration work.

## Work 06 — Provider Integration

Work 06 adds a provider-neutral integration layer, PostgreSQL durable provider jobs, a dedicated worker, service mapping, provider cost/markup/margin safety, provider order economics snapshots, status polling/refund logic and Admin provider operations.

Safe default:

```text
PROVIDER_ROUTING_ENABLED=false
```

TTC API v2 is implemented from the provider documentation supplied for Work 06: form-urlencoded `POST` requests to `https://tuongtaccheo.com/api/v2` using `key` plus `services`, `add`, `status`, `cancel` and `balance` actions. The separate TTC `Access_token` tool-login flow is not used for provider ordering.

Keep routing off until a real server-side API key and authoritative `TTC_XU_TO_VND_RATE` are configured, services are synced/reviewed, and mappings pass margin checks.

Useful commands:

```text
npm run dev:worker
npm run worker:once
npm run test:work6
npm run qa:work6:static
npm run qa:work6:api
npm run qa:ttc:readonly
npm run qa:ttc:order
npm run check:work6
```

`qa:ttc:order` is a side-effecting live smoke and refuses to run unless `TTC_LIVE_TEST_ALLOW_ORDER="YES_I_UNDERSTAND"` plus service/link/quantity are explicitly configured.

See `WORK6_PROVIDER.md`, `TTC_INTEGRATION.md` and `TTC_INTEGRATION_GAPS.md`.
