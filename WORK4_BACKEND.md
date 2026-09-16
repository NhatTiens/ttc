# Work 04 — Backend + Database Integration

## Scope

Work 04 replaces the Work 03 in-memory production path with a real REST/backend persistence path while preserving the accepted Customer UI.

Runtime dependency direction:

```text
Customer UI
  -> CustomerService
    -> CustomerRepository
      -> RESTCustomerRepository
        -> /api/v1/*
          -> domain/application functions
            -> Prisma
              -> PostgreSQL
```

`MockCustomerRepository` remains only for isolated preview/test use. `CustomerService` defaults to `RESTCustomerRepository`; there is no automatic production fallback to mock data.

Out of scope: Admin UI, external provider adapters, Tương Tác Chéo, provider polling, real payment gateway, provider-driven order status changes.

## Key implementation decisions

### Authentication

Auth.js Credentials is used for email/password login. The session strategy is signed HttpOnly JWT because Credentials does not provide a reliable database-session path in the current Auth.js v5 beta line. Every protected API and the customer app layout revalidates the JWT identity against PostgreSQL, including `User.status`, `User.role`, and `User.sessionVersion`.

Changing a password increments `sessionVersion`; existing sessions immediately fail server authorization. The UI signs the current browser out after a successful password change.

`Account`, `Session`, and `VerificationToken` tables still exist for future OAuth/database-session expansion, but they are not falsely populated by Credentials login in Work 04.

### Money

All VND values are stored as PostgreSQL `BIGINT`. In Work 04, `*_minor` means whole VND because VND has no fractional unit in this application.

Service price is stored as VND per 1,000 units. Server charge rule:

```text
charge = ceil(ratePerThousandVnd * quantity / 1000)
```

The browser never sends a trusted charge, wallet balance, or service rate.

### Orders

Work 04 has no provider. A valid new order therefore performs one PostgreSQL transaction:

1. Resolve authenticated customer.
2. Resolve ACTIVE service.
3. Validate quantity.
4. Calculate charge on server.
5. Conditionally debit wallet when `balance >= charge`.
6. Append immutable PURCHASE ledger row.
7. Create order with status `PENDING`.
8. Create initial `OrderLog` event.
9. Commit.

The transaction uses PostgreSQL/Prisma `Serializable` isolation with bounded retry for serialization conflicts. The conditional wallet update prevents negative balance even with concurrent requests.

### Idempotency

`POST /api/v1/orders` and `POST /api/v1/deposits` require `Idempotency-Key`.

Orders enforce database uniqueness on `(user_id, idempotency_key)` and persist a request fingerprint. Reusing the same key with the same request returns the prior resource. Reusing it with a different request returns `DUPLICATE_REQUEST`.

The REST customer repository also retains the generated mutation key for an ambiguous browser/network or 5xx failure. The key is stored per request fingerprint in same-tab `sessionStorage`; a retry of the same payload therefore reuses the original key instead of silently creating a second financial mutation. The key is cleared after a successful response or a deterministic 4xx response.

### Deposits

A deposit request creates:

- `Deposit(PENDING)`
- `WalletTransaction(DEPOSIT, PENDING)` with `balanceBefore == balanceAfter`

It never credits the wallet in Work 04. Payment/Admin confirmation is intentionally absent.

### Ownership

Customer-owned queries are scoped by authenticated `userId`. Order and ticket detail lookups use both public ID and authenticated owner; guessing another customer's ID returns not found.

## Source areas

```text
packages/db/
  prisma/schema.prisma
  prisma/migrations/
  prisma/seed.ts
  src/client.ts

packages/domain/src/
  customer-domain.ts
  money.ts
  errors.ts

apps/web/src/
  auth.ts
  server/
  repositories/rest-customer-repository.ts
  app/api/v1/
```

## Local execution

1. Copy `.env.example` to `.env` and replace `AUTH_SECRET`.
2. Start PostgreSQL:

```bash
docker compose -f docker-compose.work4.yml up -d
```

3. Install/generate:

```bash
npm install
npm run db:validate
npm run db:migrate
npm run db:seed
```

4. Run tests/checks:

```bash
npm run test:backend
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

5. Run application:

```bash
npm run dev:web
```

The development seed account is controlled by `SEED_DEVELOPMENT_*` variables and is development-only.
