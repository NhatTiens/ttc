# Tương Tác Pro — Development Plan

## Guiding rule

Không làm UI hoàn chỉnh trước khi money/order/provider invariants có test. UI có thể dùng skeleton pages để kiểm thử flow nhưng không polish ở các phase nền tảng.

## Phase 0 — Architecture review

Deliverables:

- Review 10 architecture docs.
- Chốt wallet reservation model.
- Chốt pricing version/quote model.
- Chốt provider retry/idempotency policy.
- Chốt roles/permissions.
- Chốt payment method đầu tiên sẽ tích hợp sau này.

Gate:

```text
ARCHITECTURE READY FOR REVIEW
```

## Phase 1 — Repository skeleton

- pnpm workspace.
- `apps/web`, `apps/worker`, packages.
- TypeScript strict.
- ESLint/formatting.
- env validation.
- Docker dev services Postgres/Redis.
- Nginx config skeleton.
- CI build/test/lint.

No production deploy.

## Phase 2 — Database & auth

- Prisma schema/migrations.
- Auth.js Prisma adapter.
- Credentials registration/login.
- Email verification/reset scaffolding.
- Roles/status/session revoke.
- Audit helper.

Tests:

- duplicate email.
- suspended user.
- session revoke.
- role escalation rejected.
- password reset replay rejected.

## Phase 3 — Wallet core

Implement WalletService first, before orders/payments.

- Create wallet.
- Credit/debit transaction primitives.
- Reservation create/capture/release.
- Idempotency keys.
- Reconciliation query/job.

Concurrency tests are mandatory:

- 50 concurrent reservations against limited balance.
- duplicate capture.
- duplicate credit.
- release vs capture race.
- admin adjustment replay.

Expected invariant after every test:

```text
balance == sum(ledger)
reserved == sum(active reservations)
no negative available balance
```

## Phase 4 — Catalog, provider model & pricing

- Categories/services.
- Provider/provider service persistence.
- Pricing rules.
- FX abstraction.
- Immutable price versions.
- Quote endpoint.
- Price change threshold.

Tests:

- decimal precision.
- 35% markup sample.
- quote expiry.
- price changes after quote do not mutate quote.
- min/max quantity.

## Phase 5 — Provider framework with fake adapter

Do not connect real provider yet.

Create deterministic `FakeProviderAdapter` supporting:

- accepted.
- rejected.
- delayed.
- timeout/unknown.
- rate limit.
- partial/completed.
- cancel/refill capability variants.

Build adapter contract tests and ProviderRegistry.

## Phase 6 — Outbox + BullMQ worker

- Outbox dispatcher.
- Deterministic BullMQ job IDs.
- Worker leases/concurrency.
- Retry/backoff.
- Dead-letter/manual review visibility.
- Queue health endpoints.

Failure tests:

- Redis down after DB commit.
- worker crash before provider call.
- worker crash after provider acceptance before DB save.
- duplicate queue delivery.
- outbox duplicate dispatch.

## Phase 7 — Order engine

- Order quote -> create.
- Required API idempotency key.
- Wallet reserve.
- Provider submission attempt.
- Capture/release.
- State transition guard.
- Poll status.
- Partial/refund.
- Cancel/refill action records.

Tests:

- double click/same key.
- same key/different payload.
- concurrent order balance race.
- provider explicit reject.
- provider create timeout without idempotency.
- provider create retry with idempotency.
- no fallback after ambiguous provider submission.

## Phase 8 — Deposit/payment framework

Start with fake gateway/manual sandbox.

- Deposit intent.
- Payment records.
- Webhook inbox/dedupe.
- Signature interface.
- Confirmation -> wallet credit.
- Refund workflow.

Tests:

- duplicate webhook 10x -> one credit.
- out-of-order event.
- wrong amount/currency.
- invalid signature.
- confirmed then refund.
- refund after user spent funds -> exception workflow.

## Phase 9 — Support/notifications

- Ticket/message.
- Notifications.
- Order/deposit event notifications.
- Permission tests.

## Phase 10 — Admin API and skeleton screens

Only after core services pass integration tests.

- Users.
- Orders/manual review.
- Services/provider mapping/pricing.
- Deposits/payments.
- Support.
- Analytics.
- Settings/audit.

Still no final visual design needed.

## Phase 11 — Analytics/read models

- Revenue.
- Refunds.
- Provider costs.
- Gross profit.
- Date/platform/service/provider dimensions.

Definitions must be written and tested; avoid dashboard numbers whose accounting meaning is unclear.

Suggested formulas:

```text
net_revenue = captured_customer_charge - customer_refunds
provider_cost = final_provider_cost if known else estimated_cost
estimated_gross_profit = net_revenue - provider_cost_converted_to_sale_currency
```

## Phase 12 — Security hardening

- Admin 2FA.
- CSRF/origin enforcement.
- CSP/security headers.
- Rate limits.
- Secret encryption/key rotation procedure.
- SSRF provider URL defenses.
- Dependency/secret scanning.
- IDOR review.
- Log redaction tests.

## Phase 13 — Real provider integration

Only after fake adapter and failure scenarios pass.

For each provider:

1. Read provider contract.
2. Fill capability matrix.
3. Implement adapter.
4. Contract tests.
5. Sandbox/small controlled tests.
6. Verify create idempotency semantics manually.
7. Verify timeout behavior.
8. Verify status mapping.
9. Verify cancel/refill semantics.
10. Set rate limits.

Never assume a “standard SMM API” is truly identical across providers.

## Phase 14 — Real payment integration

- Gateway-specific signature verification.
- Sandbox.
- Replay tests.
- Amount/currency validation.
- Refund semantics.
- Reconciliation report.

## Phase 15 — Production readiness, not deployment itself

- Production Dockerfiles.
- Nginx TLS/security config.
- DB migration runbook.
- Backup/restore drill.
- Health/readiness.
- Observability/alerts.
- Incident switches.
- Load tests.
- Disaster recovery documentation.

Actual deployment remains a separate approved checkpoint.

## Test pyramid

### Unit

- price formulas.
- transition guards.
- provider status mapping.
- permission rules.

### Integration with real Postgres/Redis containers

- wallet concurrency.
- transactions.
- outbox.
- order idempotency.
- webhook dedupe.

### Contract

- every provider adapter.
- every payment adapter.

### E2E

- register -> deposit -> order -> completed.
- provider fail -> released funds.
- partial -> partial refund.
- admin price change -> new price version.
- payment duplicate webhook.

## Release gates before any production deploy

- Zero known wallet reconciliation mismatch.
- Order idempotency concurrency suite passes.
- Payment duplicate/replay suite passes.
- Provider ambiguous timeout suite passes.
- No provider secret in built frontend bundle/log fixture.
- Backup restore test passes.
- Admin high-risk actions audited.
- Load test target agreed and passed.
