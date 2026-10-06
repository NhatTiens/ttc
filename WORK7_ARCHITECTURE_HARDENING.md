# WORK 07 — Wallet Reservation, Quote and Order Financial Hardening

## Acceptance status

Work 07 is an implementation candidate until `scripts/work7-verify.sh` completes against a real PostgreSQL test database. Static success alone is not a PASS.

## Financial model

`wallets.balance_minor` remains posted balance. `wallets.reserved_minor` is the sum held for orders awaiting a definitive provider admission result. Available balance is always `balance_minor - reserved_minor`.

Order creation no longer posts a debit and no longer writes a completed `PURCHASE`. The transaction conditionally consumes one unexpired quote, atomically increments `reserved_minor` only when available balance is sufficient, creates the order, creates its unique `WalletReservation`, writes the initial order log and creates the deterministic provider submission job when routing is enabled. The SQL reservation predicate is evaluated by PostgreSQL in the same update, preventing concurrent orders from overspending one wallet.

`WalletReservation` has one-way states. `RESERVED` may become `CAPTURED` or `RELEASED`; captured and released are mutually exclusive. Conditional state updates, wallet row locks, a unique reservation per order and the unique capture ledger idempotency key make duplicate calls and worker replay safe.

Provider acceptance captures exactly once inside the same database transaction that persists the accepted submission and advances the order. Capture decrements both posted balance and reserved balance, then appends one immutable completed `PURCHASE` transaction. Explicit provider rejection releases exactly once, decrements only reserved balance and marks the order failed. A timeout, malformed response without a provider order ID, or any other ambiguous create result moves the job and submission to manual review while leaving the reservation untouched.

Submission admission is serialized by internal order row, not only queue job ID. PREPARED/SENDING records from a crashed worker are held for reconciliation and are never blindly resent. Queue completion/retry/manual transitions are fenced by worker identity, lock timestamp and attempt number, so a superseded worker cannot overwrite a new claim. Acceptance also persists the first poll job atomically. An accepted create with a premature failed/partial status is polled for authoritative completion/refund data rather than leaving captured funds stranded. Errors in ancillary health/logging after financial commit cannot undo or rewrite the settlement.

Refunds remain compensating posted credits after capture. An admin action on an order that is still only reserved releases the reservation without creating a false refund credit. Historical no-reservation orders require a verified completed PURCHASE before refund or provider submission; they are never captured/debited again. Refund targets cannot decrease and late status responses cannot reopen a terminal order.

## Quote model

`POST /api/v1/quotes` accepts only `serviceId` and `quantity`. The server verifies current service and routing availability, applies quantity limits, computes the charge using integer money rules and stores the service rate plus charge snapshot. The response includes quote ID, service identity, quantity, rate, charge and expiry.

`POST /api/v1/orders` accepts `quoteId` and `targetUrl` plus the required `Idempotency-Key`. Browser price values are not accepted. An expired quote is rejected. A conditional consume and the unique `orders.quote_id` index limit each quote to one order even under concurrent requests. An existing order is returned only for the same user, idempotency key and payload fingerprint. Reusing the key with another quote or target is a conflict. A later service price change does not mutate or reprice an existing quote.

## Schema and migration

Migration `202610060001_work7_wallet_quotes` adds `WalletReservationStatus`, `order_quotes`, `wallet_reservations` and nullable `orders.quote_id`. The nullable order reference preserves historical Work 04–06 rows while all new customer order API traffic requires a quote. Database checks enforce nonnegative quote and reservation amounts, valid quote quantities and consistent reservation terminal timestamps.

## Tests

`work7.financial.integration.test.ts` covers concurrent wallet reservations, insufficient available balance, duplicate reservation protection, capture exactly once, release exactly once, capture/release race, quote server pricing, quote expiry, quote reuse, concurrent quote consumption, frozen price snapshots, same-key replay and same-key payload conflict.

Worker integration covers duplicate submission delivery, provider acceptance capture, explicit provider rejection release and `UNKNOWN_SUBMISSION` reservation hold. Existing Work 04, Work 05 and Work 06 suites remain part of the verification script.

## Operational notes

The quote lifetime defaults to 300 seconds and can be configured with `ORDER_QUOTE_TTL_SECONDS`; runtime clamps it to 30 through 3600 seconds. No provider or database credential is stored in source. Reconciliation tooling for manually resolving an unknown provider submission remains an operational follow-up and must choose capture or release only after verifying the provider side effect.

## Verification

Run `scripts/work7-verify.sh` from any directory. The script resolves the repository root, stops at the first failure and runs Prisma generation and validation, QA unit tests, production dependency audit, test database migration, backend/provider/worker tests, lint, all TypeScript checks, offline checks, the Work 07 static contract and the Next.js production build. `scripts/work7-verify.ps1` runs the same gates with native exit-code checks. `work7-verify.sh` at root is a compatibility entry point. Test database preparation and test files reject a non-test database name or a URL pointing to the primary database, regardless of username/schema differences.

## Verification result on 2026-10-06

Status is **BLOCKED**, not PASS. Prisma generate and Prisma validate succeeded. Provider unit tests passed 16 of 16; QA unit tests passed 7 of 7. Web lint, web/provider/worker typechecks, all offline Work 04–06 contract checks, the Work 07 static contract and the Next.js 16.3.8 production build succeeded. Production dependency audit reported zero vulnerabilities. Full development-inclusive audit still reports five high-severity entries in the braces/micromatch/ESLint graph; there is no patched braces release at the checkpoint, so this is not an all-dependencies security PASS. PowerShell is not installed in the audit environment; parity/fail-fast structure was tested, not Windows runtime execution.

The full verifier stopped at `db:test:prepare` because no PostgreSQL server was reachable at the configured local test address `127.0.0.1:5432`. This environment also has no Docker or local PostgreSQL executable, so the migration-backed backend and worker integration suites could not actually run here. Work 07 may be marked PASS only after `scripts/work7-verify.sh` completes on a machine with the test database running.

## COMMANDS TO RUN LOCALLY

```bash
git checkout main
git pull --rebase origin main
npm ci

test -f .env || cp .env.example .env
docker compose -f docker-compose.work4.yml up -d postgres
npm run db:generate
npm run db:validate
npm run db:migrate

chmod +x scripts/work7-verify.sh
./scripts/work7-verify.sh

git status
git diff --stat
git add .
git commit -m "Complete Work 07 wallet reservation and quote architecture"
git push origin main
```
