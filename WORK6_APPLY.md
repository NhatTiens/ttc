# Work 06 — Apply & Verify

Start from the accepted Work 05 repository checkpoint:

```text
72192814e1edc657e4a79f4a46be6f5ba5831d2f
Complete Work 05 admin dashboard and operations
```

## 1. Install/update workspace links

Work 06 adds `packages/providers` and `apps/worker`, so run:

```powershell
npm install
```

## 2. Keep live routing disabled

`.env` should contain:

```text
PROVIDER_ROUTING_ENABLED=false
```

Do not enable TTC routing until its official API contract is implemented and live-tested safely.

## 3. Database

Make sure PostgreSQL is running, then:

```powershell
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run db:seed
```

The second seed verifies idempotency.

## 4. Full technical gates

```powershell
npm run lint:web
npm run typecheck:web
npm run typecheck:providers
npm run typecheck:worker
npm run test:work6
npm run build:web
npm run check:offline
```

## 5. Runtime Admin provider smoke

Terminal 1:

```powershell
npm run dev:web
```

Terminal 2:

```powershell
npm run qa:work6:api
```

The smoke never sends a real TTC order. It enqueues a server-side provider connection job.

Then process one provider job batch:

```powershell
npm run worker:once
```

Until TTC documentation is verified, the TTC job is expected to finish as `MANUAL_REVIEW` / `PROVIDER_CONFIGURATION_MISSING`, not as a fake success.

## 6. Worker development

```powershell
npm run dev:worker
```

This runs the dedicated server-side provider worker. It does not depend on an open browser.

## 7. Before enabling provider routing

Do not set `PROVIDER_ROUTING_ENABLED=true` until:

- a real provider adapter is verified;
- services are synced;
- an internal service is deliberately mapped;
- provider cost/margin are reviewed;
- live credentials are stored server-side;
- safe test create/status flow passes.

## TTC API v2 configuration (R4)

The TTC protocol is now implemented from supplied provider documentation.

```env
TTC_API_BASE_URL="https://tuongtaccheo.com/api/v2"
TTC_API_KEY=<real server-side key>
TTC_HTTP_TIMEOUT_MS=10000
TTC_XU_TO_VND_RATE=<authoritative VND per XU>
TTC_RATE_UNIT=1000
```

Run read-only verification first:

```powershell
npm run qa:ttc:readonly
```

Do not enable provider routing until service sync + mapping + margin review have passed. A direct real provider order smoke is additionally gated by `TTC_LIVE_TEST_ALLOW_ORDER="YES_I_UNDERSTAND"`; see `TTC_INTEGRATION.md`.
