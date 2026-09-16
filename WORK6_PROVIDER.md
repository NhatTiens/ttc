# WORK 06 — Provider Integration

## Status

Implementation candidate now includes a TTC API v2 adapter based on the provider documentation supplied for Work 06. Generic provider architecture, durable workers, service sync, order submission, status polling and TTC protocol mapping are implemented. Final acceptance still requires local technical gates plus live TTC verification with a real server-side API key and an authoritative XU->VND conversion.

## Runtime architecture

```text
Customer UI
  -> Tương Tác Pro REST API
    -> Customer/Order Domain
      -> PostgreSQL transaction
        -> orders + wallet ledger + provider_jobs
          -> apps/worker
            -> ProviderRegistry
              -> ProviderAdapter
                -> External provider
```

Provider HTTP is never called from the browser and is not called inside the customer create-order HTTP transaction. `PROVIDER_ROUTING_ENABLED=false` is the safe default.

## Packages

- `packages/providers`: normalized provider contract, error model, retry policy, sanitizer, pricing helpers, SSRF-aware HTTP helper, registry, and TTC API v2 adapter.
- `packages/domain/src/provider-domain.ts`: durable job enqueue, provider service sync, mapping, margin policy, provider refunds/status updates.
- `apps/worker`: PostgreSQL-backed provider queue and workers for submit, poll, service sync, balance sync and connection checks.
- `packages/db`: Work 06 provider schema + migration.
- `apps/web`: Admin provider/mapping UI and internal Admin provider APIs.

## Database additions

Work 06 adds:

- `Provider`
- `ProviderService`
- `ServiceProviderMapping`
- `ProviderPriceHistory`
- `ProviderOrder`
- `ProviderOrderAttempt`
- `ProviderJob`
- `ProviderOperationLog`
- `ProviderBalanceSnapshot`
- `ProviderRequestLease`
- `Order.refundedMinor`

No provider API credential is stored in these tables.

## Durable job strategy

This Work deliberately uses PostgreSQL-backed `ProviderJob` instead of an in-memory queue. A worker claims a due row using a conditional update, writes a lock owner/time, recovers stale locks, and persists retry/manual-review/completed states. This satisfies crash durability without requiring Redis in Work 06. Redis/BullMQ remains an optional future scale-out path, not a requirement for correctness.

## Customer order admission

When `PROVIDER_ROUTING_ENABLED=false`, Work 03–05 behavior remains unchanged and no provider jobs are created.

When `PROVIDER_ROUTING_ENABLED=true`:

1. The internal service must be ACTIVE.
2. It must have an enabled ACTIVE mapping.
3. The provider service must be AVAILABLE.
4. The provider must be enabled and ACTIVE.
5. Only then may the wallet debit/order transaction commit.
6. A deterministic durable `SUBMIT_ORDER` job is written in the same transaction.

Customer catalog reads apply the same routing filter while routing is enabled, so unmapped provider products are never published directly.

## Submission safety

Worker submission snapshots provider rate, provider cost, customer charge and gross margin before the external call. If cost violates `minimumMarginMinor`, mapping becomes `PRICE_REVIEW_REQUIRED`, submission stops and the job requires review.

Create retries are capability-aware:

- provider idempotency supported -> safe retry with same idempotency key;
- ambiguous create without idempotency -> `UNKNOWN_SUBMISSION` + manual review;
- accepted provider order -> never create again;
- no automatic cross-provider fallback on ambiguous submissions.

## Polling and refunds

Status strings are normalized inside adapters. Terminal states stop normal polling. Partial/failed/cancelled/refunded provider results use server-calculated refund targets. `Order.refundedMinor` and deterministic ledger idempotency ensure repeated polling cannot double-credit the wallet.

Partial refund rounding uses integer half-up proportional calculation defined in `packages/providers/src/pricing.ts`.

## Admin

`/admin/providers` and `/admin/providers/[id]` now use database data. Admin can:

- inspect provider status/health/balance configuration;
- enqueue Test Connection / Sync Services / Sync Balance;
- review provider services;
- create/update/disable service mappings;
- inspect provider jobs and sanitized operation logs.

Admin order detail shows provider economics snapshots. Customer order responses/pages do not expose provider identity, external service ID, provider cost or credentials.

## Security

- secret values are environment/secret-store only;
- no `NEXT_PUBLIC_` provider secret;
- provider logs are sanitized recursively;
- provider HTTP helper enforces timeout, HTTPS outside localhost, redirect rejection and host allowlisting;
- provider errors are normalized;
- Admin provider mutations use `requireAdmin()` and same-origin protection;
- provider base URL is not freely editable from the browser in Work 06.

## TTC state

The supplied TTC documentation establishes API v2 as a form-urlencoded `POST` API at `https://tuongtaccheo.com/api/v2` using a server-side `key` field. The adapter implements documented `services`, `add`, `status`, `cancel` and `balance` actions.

The separate TTC `Access_token` login flow is not used for provider order placement.

TTC create-order has no documented idempotency/client-reference field, so ambiguous create timeouts remain manual-review events. TTC service prices are documented in XU, therefore `TTC_XU_TO_VND_RATE` must be configured before service sync/routing so VND margin checks remain authoritative. See `TTC_INTEGRATION.md` and `TTC_INTEGRATION_GAPS.md`.

## Worker environment bootstrap

Standalone provider worker commands (`dev:worker`, `worker:start`, `worker:once`) use a bootstrap that loads the repository-root `.env` before worker modules are imported. This keeps worker database/provider configuration behavior aligned with the web/Prisma development commands without adding a dotenv dependency.
