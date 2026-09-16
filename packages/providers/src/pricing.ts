export type MarkupPolicy =
  | { type: "PERCENTAGE"; markupBps: number }
  | { type: "FIXED"; fixedMarkupMinor: bigint };

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("Denominator must be positive.");
  if (numerator < 0n) throw new Error("Negative money is not supported.");
  return (numerator + denominator - 1n) / denominator;
}

export function calculateProviderCost(providerRateMinor: bigint, quantity: number, rateUnit = 1000): bigint {
  if (providerRateMinor < 0n || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(rateUnit) || rateUnit <= 0) {
    throw new Error("Invalid provider pricing input.");
  }
  return ceilDiv(providerRateMinor * BigInt(quantity), BigInt(rateUnit));
}

export function calculateSellingRate(providerRateMinor: bigint, policy: MarkupPolicy): bigint {
  if (providerRateMinor < 0n) throw new Error("Provider rate must be non-negative.");
  if (policy.type === "PERCENTAGE") {
    if (!Number.isInteger(policy.markupBps) || policy.markupBps < 0) throw new Error("Invalid markup basis points.");
    return ceilDiv(providerRateMinor * BigInt(10_000 + policy.markupBps), 10_000n);
  }
  if (policy.fixedMarkupMinor < 0n) throw new Error("Fixed markup must be non-negative.");
  return providerRateMinor + policy.fixedMarkupMinor;
}

export function grossMargin(customerChargeMinor: bigint, providerCostMinor: bigint): bigint {
  return customerChargeMinor - providerCostMinor;
}

export function hasSafeMargin(customerChargeMinor: bigint, providerCostMinor: bigint, minimumMarginMinor: bigint): boolean {
  if (minimumMarginMinor < 0n) return false;
  return customerChargeMinor >= providerCostMinor + minimumMarginMinor;
}

export function proportionalRefundTarget(chargeMinor: bigint, remaining: number, quantity: number): bigint {
  if (chargeMinor < 0n || !Number.isInteger(remaining) || !Number.isInteger(quantity) || quantity <= 0 || remaining < 0 || remaining > quantity) {
    throw new Error("Invalid proportional refund input.");
  }
  // Round half up to the nearest VND so repeated status polling converges on one stable target.
  const numerator = chargeMinor * BigInt(remaining);
  const denominator = BigInt(quantity);
  return (numerator + denominator / 2n) / denominator;
}
