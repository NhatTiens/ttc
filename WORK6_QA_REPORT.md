# WORK 06 — QA Report

## Acceptance status

**NOT ACCEPTED YET.** The TTC API v2 protocol is now implemented from the supplied provider documentation. Final acceptance still requires developer-machine technical gates and live verification with a real TTC API credential plus an authoritative XU->VND conversion.

## Provider adapter coverage

`packages/providers/tests/provider-core.test.ts` covers:

- integer-safe pricing;
- recursive secret redaction including TTC form `key`;
- ambiguous create retry/manual-review policy;
- TTC `services` form action and service normalization;
- XU-rate to VND conversion;
- unsupported custom-comment order type protection;
- TTC `add` request payload and external order ID parsing;
- missing order ID -> `UNKNOWN` submission;
- TTC `status` mapping;
- TTC `balance` parsing;
- TTC provider-body error normalization;
- HTTP auth/rate-limit/server error classification.

All TTC HTTP tests use mocked `fetch`; automated tests do not spend provider balance.

## Database/domain integration

`apps/web/tests/backend/work6.provider.integration.test.ts` covers provider service sync, duplicate protection, price history, provider removal state, routable mapping enforcement, durable submission job creation and provider refund idempotency.

## Worker integration

`apps/worker/tests/provider-worker.integration.test.ts` uses a test-only fake adapter with real test PostgreSQL to cover successful submission, external ID persistence, economics snapshots, accepted replay protection, ambiguous timeout -> manual review, partial polling and no double refund.

## TTC contract implemented

Documented TTC API v2 characteristics used by the runtime adapter:

```text
POST https://tuongtaccheo.com/api/v2
Content-Type: application/x-www-form-urlencoded
key=<API Key>
action=services|add|status|cancel|balance
```

The TTC `Access_token`/`logintoken.php` tool-login flow is intentionally separate from provider ordering.

## Static security/architecture contract

`qa/work6-provider-contract-check.mjs` verifies provider models, durable jobs, adapter boundary, Admin authorization/origin guards, customer routability filtering, TTC API v2 actions, hardened provider HTTP usage, XU->VND pricing guard, non-idempotent TTC create semantics, no frontend credential exposure and explicit live-order opt-in.

## Runtime API smoke

`qa/work6-api-smoke.mjs` verifies Admin authorization, secret-safe provider detail, durable provider action jobs and customer API isolation. It deliberately does not call TTC live.

## Live TTC test commands

Read-only:

```text
npm run qa:ttc:readonly
```

Intentional provider order only:

```text
npm run qa:ttc:order
```

The live order script refuses to run unless `TTC_LIVE_TEST_ALLOW_ORDER="YES_I_UNDERSTAND"` and service/link/quantity are explicitly configured.

## Required local final gates

```text
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run test:work6
npm run lint:web
npm run typecheck:web
npm run typecheck:providers
npm run typecheck:worker
npm run build:web
npm run check:offline
npm run qa:work6:api
npm run worker:once
```

Then configure a real TTC key and authoritative `TTC_XU_TO_VND_RATE`, run `npm run qa:ttc:readonly`, sync services, review/map a supported `Default` or `Package` service, and only then enable provider routing for an approved small test.

## Remaining blockers / known limitations

1. Real TTC API credential has not been live-tested in this artifact environment.
2. TTC documentation reports XU but does not define XU->VND conversion; the application requires explicit configuration rather than inventing it.
3. TTC `add` has no documented idempotency key/client reference; ambiguous create timeouts require manual review.
4. TTC `Custom Comments/Texts` requires a `comments` payload not represented by the current customer Order model, so those provider services are not routable yet.
