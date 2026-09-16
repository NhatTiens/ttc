# Provider Pricing & Margin Safety

## Three values

Work 06 separates provider cost, customer selling price and gross margin. Customer price remains authoritative on the server.

## TTC currency conversion

The supplied TTC API documentation reports provider balance/rates in `XU`, while Tương Tác Pro customer prices and wallets are VND. No implicit conversion is allowed.

TTC service sync requires:

```env
TTC_XU_TO_VND_RATE=<VND per 1 XU>
TTC_RATE_UNIT=1000
```

A TTC rate such as `2.5` is converted to VND with decimal integer arithmetic and rounded upward for provider-cost safety. The raw TTC XU rate is retained in sanitized provider service metadata; authoritative mapping economics use the converted VND value.

## Mapping pricing

`ServiceProviderMapping` supports `PERCENTAGE`, `FIXED`, `MANUAL` and `AUTO_MARKUP`. Provider service rate has an explicit `rateUnit`.

## Integer arithmetic

VND calculations use `BIGINT`; provider order cost is server-calculated. No floating point amount from the browser is trusted.

## Margin protection

Before create-order reaches an external provider:

```text
providerCost = latest mapped provider rate * quantity / rateUnit
margin = customerChargeSnapshot - providerCost
```

If margin falls below `minimumMarginMinor`, the worker does not send the provider order and marks the mapping `PRICE_REVIEW_REQUIRED`.

## History and snapshots

Provider price changes create `ProviderPriceHistory`. Customer price changes continue to use `ServicePriceHistory`. `ProviderOrder` stores provider rate, rate unit, provider cost, customer charge and gross margin snapshots at submission time.

## Partial refund

For quantity `Q`, remaining `R` and original charge `C`, the refund target is server-calculated from `C * R / Q`. `Order.refundedMinor` and deterministic ledger idempotency prevent double-credit on repeated provider polling.

Gross margin is not net profit; payment fees, infrastructure, refunds, support and other operating costs are separate.
