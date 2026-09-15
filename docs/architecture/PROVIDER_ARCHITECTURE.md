# Tương Tác Pro — Provider Architecture

## 1. Rule số 1

Provider API chỉ được gọi từ server-side worker/backend. Browser không bao giờ nhận API key, provider base URL riêng tư hoặc raw provider payload.

## 2. Common adapter contract

```ts
export interface ProviderAdapter {
  readonly providerCode: string;
  readonly capabilities: ProviderCapabilities;

  getServices(ctx: ProviderContext): Promise<ProviderService[]>;

  createOrder(
    input: CreateProviderOrderInput,
    ctx: ProviderContext
  ): Promise<CreateProviderOrderResult>;

  getOrderStatus(
    input: GetProviderOrderStatusInput,
    ctx: ProviderContext
  ): Promise<ProviderOrderStatusResult>;

  getBalance(ctx: ProviderContext): Promise<ProviderBalance>;

  cancelOrder(
    input: ProviderOrderActionInput,
    ctx: ProviderContext
  ): Promise<ProviderActionResult>;

  refillOrder(
    input: ProviderOrderActionInput,
    ctx: ProviderContext
  ): Promise<ProviderActionResult>;
}
```

## 3. Capability contract

```ts
export interface ProviderCapabilities {
  supportsCreateIdempotency: boolean;
  supportsClientReference: boolean;
  supportsLookupByClientReference: boolean;
  supportsCancel: boolean;
  supportsCancelIdempotency: boolean;
  supportsRefill: boolean;
  supportsRefillIdempotency: boolean;
  supportsWebhook: boolean;
  supportsBatchStatus: boolean;
}
```

Domain logic must read capability flags instead of assuming every provider behaves the same.

## 4. Normalized provider types

```ts
export type ProviderService = {
  externalServiceId: string;
  name: string;
  rate: string;            // decimal string
  currency: string;
  rateUnit: number;
  minQuantity: bigint;
  maxQuantity: bigint;
  supportsRefill: boolean;
  supportsCancel: boolean;
  raw?: unknown;           // redacted before persistence/logging
};

export type CreateProviderOrderInput = {
  internalOrderId: string;
  externalServiceId: string;
  target: string;
  quantity: bigint;
  idempotencyKey?: string;
  clientReference?: string;
};

export type CreateProviderOrderResult =
  | { kind: "accepted"; providerOrderId: string; rawStatus?: string }
  | { kind: "rejected"; code: string; message: string; retryable: boolean }
  | { kind: "unknown"; reason: string };
```

Adapter must convert provider-specific response into these normalized results.

## 5. Provider error taxonomy

```text
ProviderAuthError             -> disable/alert; no retry loop
ProviderValidationError       -> order fail; no retry
ProviderRateLimitError        -> retry after server-provided/default backoff
ProviderInsufficientBalance   -> pause provider route/alert
ProviderTransientError        -> safe retry only when operation semantics allow
ProviderTimeoutError          -> may be UNKNOWN for side-effecting calls
ProviderMalformedResponse     -> alert; side-effect status depends on operation
ProviderUnavailableError      -> circuit breaker candidate
```

## 6. Create order — safe flow

Before HTTP call:

1. Select provider route.
2. Persist `provider_order_attempts` state `PREPARED`.
3. Generate provider idempotency/client reference when supported.
4. Transition attempt to `SENDING`.
5. Call adapter with strict connect/request timeout.

After HTTP call:

- Accepted: persist provider order ID, capture funds, order `SUBMITTED`.
- Explicit rejected and provider guarantees no order created: release funds, `FAILED` or route fallback if policy allows.
- Ambiguous timeout/network/malformed result after side effect may have occurred: `UNKNOWN`; no blind retry.

## 7. Provider order duplication policy

### Provider supports idempotency

Retry create with the same provider idempotency key. Never generate a new key for the same internal submission intent.

### Provider supports client reference + lookup

On timeout, lookup using the same reference before considering retry.

### Provider supports neither

Treat any ambiguous create outcome as `UNKNOWN` and require reconciliation/manual review. Automatic retry is disabled by default because a second request could create a duplicate order.

## 8. Crash window

Worst case:

```text
provider creates order
 -> provider sends response
 -> worker process crashes before DB stores providerOrderId
```

No database transaction can atomically include an external provider. Mitigation hierarchy:

1. Provider idempotency key.
2. Client reference + lookup.
3. Reconciliation endpoint/order listing.
4. Manual review.
5. Never blind retry ambiguous side effects.

This limitation must be treated as a first-class operational state, not hidden with retries.

## 9. Retry matrix

| Operation | Default retry behavior |
|---|---|
| `getServices` | Retry exponential on timeout/5xx/429 |
| `getBalance` | Retry exponential |
| `getOrderStatus` | Retry exponential; safe read |
| `createOrder` with provider idempotency | Retry with same key |
| `createOrder` without idempotency | Do not blind retry ambiguous failures |
| `cancelOrder` with idempotency | Retry same action key |
| `cancelOrder` without idempotency | Unknown/manual reconcile on ambiguous result |
| `refillOrder` with idempotency | Retry same action key |
| `refillOrder` without idempotency | Unknown/manual reconcile on ambiguous result |

Suggested transient backoff baseline:

```text
2s -> 10s -> 30s -> 2m -> 10m
```

Actual retries depend on provider rate limits and operation safety. Add jitter to avoid thundering herd.

## 10. Queue jobs

Suggested queues:

```text
outbox-dispatch
provider-order-create
provider-order-status
provider-order-action
provider-service-sync
provider-balance-sync
payment-reconciliation
notification-delivery
maintenance-reconciliation
```

Job IDs derive from DB event/action IDs, not random IDs.

## 11. Status mapping

Each adapter has explicit provider status map:

```text
provider pending      -> SUBMITTED
provider in_progress  -> PROCESSING
provider completed    -> COMPLETED
provider partial      -> PARTIAL
provider canceled     -> CANCELLED
provider error/fail   -> FAILED (only if provider semantics are clear)
```

Unknown raw statuses are not guessed. Store raw status, alert adapter mismatch, keep safe current state until mapped.

## 12. Poll strategy

- Newly submitted: poll more frequently.
- Long-running: exponential/stepped interval.
- Terminal state: stop polling.
- Batch status endpoint preferred when provider supports it.
- Add jitter.
- Provider rate limiter shared across worker replicas.

Example policy:

```text
0–10 min: every 30–60s
10–60 min: every 2–5 min
>60 min: every 10–20 min
```

Exact values are provider-specific configuration, not hard-coded business logic.

## 13. Provider health/circuit breaker

Track rolling:

- request success rate.
- p95 latency.
- 429 rate.
- auth failures.
- malformed responses.
- unknown create outcomes.
- balance.

If provider is degraded:

- stop selecting it for new orders according to threshold.
- do not automatically reroute orders with ambiguous prior submission.
- keep status synchronization for existing orders where possible.

## 14. Catalog sync

Provider catalog is not the customer catalog.

```text
getServices()
 -> normalize
 -> upsert provider_services
 -> detect rate/capability changes
 -> pricing engine creates candidate price version
 -> admin/business policy activates or pauses
```

Provider deleting a service should not hard-delete historical `provider_services`; mark unavailable.

## 15. Secret handling

- Provider API keys encrypted at rest.
- Encryption master key in environment/secret manager.
- Credentials only decrypted inside provider client construction.
- Never stringify config object containing secret to logs.
- Admin GET returns `configured: true`, `last4` only if safe/useful, not ciphertext/plaintext.

## 16. Adapter contract tests

Every concrete adapter must pass the same suite:

- service normalization.
- rate parsing without floating point corruption.
- accepted create.
- explicit reject.
- timeout -> unknown semantics.
- status mapping.
- balance parsing.
- cancel/refill supported/unsupported behavior.
- redaction.
- malformed response.
- 429/backoff metadata.
