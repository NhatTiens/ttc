# Work 04 — Database Implementation

## Engine and ORM

- PostgreSQL
- Prisma ORM 7.x with `@prisma/adapter-pg`
- First production migration: `packages/db/prisma/migrations/202609160001_work4_backend/migration.sql`
- Prisma schema: `packages/db/prisma/schema.prisma`

`db push` is not part of the production strategy. Deployments use `prisma migrate deploy` through `npm run db:migrate`.

## Implemented persistence models

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `PasswordResetToken`
- `Wallet`
- `WalletTransaction`
- `ServiceCategory`
- `Service`
- `Order`
- `OrderLog`
- `DepositMethod`
- `Deposit`
- `Payment`
- `PaymentEvent`
- `SupportTicket`
- `SupportMessage`
- `NotificationPreference`

`Payment`/`PaymentEvent` are schema readiness only. No fake payment success logic exists in Work 04.

## Database constraints

Important database-level protections include:

- unique normalized `users.email` plus lower-case check;
- one wallet per user;
- wallet balance/reserved non-negative checks;
- reserved balance cannot exceed posted balance;
- unique service code;
- service min/max/rate checks;
- unique order public ID;
- unique order `(user_id, idempotency_key)`;
- order quantity/charge/remaining checks;
- unique deposit public ID;
- unique deposit `(user_id, idempotency_key)`;
- deposit amount/range checks;
- foreign keys and query indexes for customer ownership/history paths.

## Money representation

VND uses `BIGINT` whole-dong values. The suffix `_minor` is retained from the architecture to keep a currency-safe integer convention; in VND, one stored unit equals one VND.

No customer money mutation uses JavaScript floating point as the authoritative value. HTTP input is validated as safe integers, converted to `BigInt`, and all calculations that affect persistence are performed server-side.

## Wallet ledger

`WalletTransaction` is append-only application audit data. Work 04 does not expose an update/delete path for posted ledger rows.

Every Work 04 wallet balance change has a ledger entry:

- development seed funding -> `ADJUSTMENT / COMPLETED`;
- order debit -> `PURCHASE / COMPLETED`;
- deposit request -> `DEPOSIT / PENDING` but no balance change.

## Order concurrency

The order transaction is Serializable and uses a conditional update:

```text
UPDATE-equivalent wallet mutation only when balance >= charge
```

The domain retries Prisma serialization conflict `P2034` a bounded number of times. Two concurrent orders cannot independently spend the same wallet balance.

## Seed

`packages/db/prisma/seed.ts` uses upsert operations for categories, services, deposit methods, user, wallet, and notification preferences. The development opening balance uses a unique ledger idempotency key so repeated seeding does not repeatedly credit the wallet.

The catalog is based on the accepted Work 03 mock catalog so the UI remains populated after migration.
