# Provider Adapter Contract

## Boundary

All provider-specific protocol knowledge belongs in `packages/providers`. Application/domain/React code works with normalized types only.

```ts
interface ProviderAdapter {
  readonly code: string;
  readonly capabilities: ProviderCapabilities;
  testConnection(): Promise<ProviderConnectionResult>;
  getBalance(): Promise<ProviderBalanceResult>;
  getServices(): Promise<NormalizedProviderService[]>;
  createOrder(input: ProviderCreateOrderInput): Promise<ProviderCreateOrderResult>;
  getOrderStatus(input: ProviderOrderStatusInput): Promise<ProviderOrderStatusResult>;
  cancelOrder?(input: ProviderOrderStatusInput): Promise<ProviderOrderStatusResult>;
  refillOrder?(input: ProviderOrderStatusInput): Promise<ProviderOrderStatusResult>;
}
```

Optional operations are implemented only when the upstream API actually supports them.

## Normalization

Provider order statuses normalize to:

`PENDING | SUBMITTED | PROCESSING | COMPLETED | PARTIAL | FAILED | CANCELLED | REFUNDED | UNKNOWN`

Unknown raw statuses must not be guessed into a terminal state.

Errors normalize to:

- `PROVIDER_UNAUTHORIZED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `PROVIDER_RATE_LIMIT`
- `PROVIDER_INSUFFICIENT_BALANCE`
- `PROVIDER_SERVICE_UNAVAILABLE`
- `PROVIDER_INVALID_REQUEST`
- `PROVIDER_MALFORMED_RESPONSE`
- `PROVIDER_CONFIGURATION_MISSING`
- `PROVIDER_UNKNOWN_ERROR`

## Create-order outcomes

`ACCEPTED` means an external order identifier is known. `REJECTED` means the adapter has evidence the provider rejected the request. `UNKNOWN` means a side effect may have happened but cannot be proven.

A timeout on a side-effecting create operation is never automatically considered a rejection.

## HTTP helper

`providerFetch()` provides request timeout, HTTPS enforcement, explicit host allowlisting, redirect rejection and HTTP error classification.

## Secret/logging rule

`sanitizeProviderValue()` redacts provider `key`, API key, token, secret, auth, password, cookie, signature and credential-like fields recursively. Raw provider credentials are never persisted in operation logs or returned to customer/Admin APIs.

## TTC adapter

`TTCProviderAdapter` implements the documented TTC API v2 form protocol:

- `services`
- `add`
- `status`
- `cancel`
- `balance`

TTC API v2 has no documented create idempotency/client-reference parameter, so those capabilities remain `false`. This is intentional and drives the worker's unknown-submission safety policy.
