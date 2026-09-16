# TTC Integration Gaps

The provider protocol is no longer the blocker: TTC API v2 request/response fields for services, add order, status, cancel, and balance are implemented from the supplied TTC documentation.

## Remaining configuration / live verification

Before production routing can be accepted, the project still needs:

- a real TTC API key stored only in the local/server secret environment;
- the authoritative conversion value of one TTC `XU` to VND (`TTC_XU_TO_VND_RATE`) so provider cost and margin are correct;
- a read-only live connection/balance/service-list test;
- one explicitly approved low-cost test order, if safe;
- observation of real TTC error responses/rate-limit behavior under the account being used.

## Documented limitations

The documented TTC `add` request does not include an idempotency key or client reference. Therefore a create-order timeout can be ambiguous: TTC may have accepted the order while the application did not receive the order ID. Work 06 intentionally sends such cases to `UNKNOWN_SUBMISSION` / manual review and does not blindly retry or fallback to another provider.

The documented `Custom Comments/Texts` order type requires a `comments` field. The current Tương Tác Pro customer Order model has only target URL + quantity, so those TTC services remain unavailable for mapping until that product input is implemented.

The documentation shows XU as provider currency but does not define its VND conversion. The application will not invent this value.

## Production routing

Keep `PROVIDER_ROUTING_ENABLED=false` until API key, XU->VND conversion, provider enablement, service sync, mapping, and read-only/live test gates are complete.
