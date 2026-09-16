# WORK 06 — TTC API v2 Hotfix R4

This hotfix replaces the fail-closed TTC placeholder with the provider API contract supplied for Work 06.

## Implemented TTC API v2

```text
POST https://tuongtaccheo.com/api/v2
Content-Type: application/x-www-form-urlencoded
key=<server-side API key>
```

Actions implemented:

- `services`
- `add`
- `status`
- `cancel`
- `balance`

The TTC Access_token/tool-login API is not used for order placement.

## Safety decisions

- API key remains environment-only.
- Create order has no documented idempotency/reference field, so ambiguous timeouts go to manual review instead of blind retry.
- TTC rates/balance are documented in XU; service sync requires explicit `TTC_XU_TO_VND_RATE` before VND economics are accepted.
- Only documented `Default` and `Package` order types are routable with the current target+quantity customer model.
- `Custom Comments/Texts` is synced unavailable until a comments input model exists.
- Live order smoke requires explicit `YES_I_UNDERSTAND` opt-in.

## Apply

Extract the hotfix and copy its contents over the current Work 06 R3 project root.

Then update `.env` with real server-side values:

```env
TTC_API_BASE_URL="https://tuongtaccheo.com/api/v2"
TTC_API_KEY=<real key>
TTC_HTTP_TIMEOUT_MS=10000
TTC_XU_TO_VND_RATE=<authoritative VND value of 1 TTC XU>
TTC_RATE_UNIT=1000
PROVIDER_ROUTING_ENABLED=false
```

Keep routing disabled for the read-only verification.

## Verify

```powershell
npm run typecheck:providers
npm run typecheck:worker
npm run test:providers
npm run qa:work6:static
npm run qa:ttc:readonly
```

Then run the web + worker, sync services/balance, review a supported provider service, create a mapping, verify margin, enable TTC and only then set `PROVIDER_ROUTING_ENABLED=true` and restart web/worker.

For a direct intentional TTC order smoke, see `TTC_INTEGRATION.md` and use `npm run qa:ttc:order` only after setting `TTC_LIVE_TEST_ALLOW_ORDER="YES_I_UNDERSTAND"`.
