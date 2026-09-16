const RATE_UNIT = 1000n;

export function calculateChargeMinor(ratePerThousandMinor: bigint, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive safe integer.");
  }
  const raw = ratePerThousandMinor * BigInt(quantity);
  return (raw + RATE_UNIT - 1n) / RATE_UNIT;
}

export function moneyToSafeNumber(value: bigint) {
  const numberValue = Number(value);
  if (!Number.isSafeInteger(numberValue)) {
    throw new Error("Money value exceeds JavaScript safe integer range.");
  }
  return numberValue;
}
