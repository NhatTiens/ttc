import { ProviderAdapterError } from "./errors";

export interface RetryDecision {
  action: "RETRY" | "MANUAL_REVIEW" | "FAIL";
  delayMs?: number;
  code: string;
}

export function computeBackoffMs(attempt: number, baseMs = 2_000, maxMs = 15 * 60_000, jitterRatio = 0.2, random = Math.random): number {
  const safeAttempt = Math.max(1, attempt);
  const exponential = Math.min(maxMs, baseMs * 2 ** (safeAttempt - 1));
  const jitter = Math.floor(exponential * jitterRatio * random());
  return Math.min(maxMs, exponential + jitter);
}

export function decideProviderRetry(
  error: ProviderAdapterError,
  attempt: number,
  maxAttempts: number,
  options: { sideEffecting: boolean; providerSupportsIdempotency: boolean }
): RetryDecision {
  if (error.ambiguousSideEffect && options.sideEffecting && !options.providerSupportsIdempotency) {
    return { action: "MANUAL_REVIEW", code: "UNKNOWN_SUBMISSION" };
  }
  if (!error.retryable) return { action: "FAIL", code: error.code };
  if (attempt >= maxAttempts) return { action: "FAIL", code: "MAX_ATTEMPTS" };
  return { action: "RETRY", delayMs: computeBackoffMs(attempt), code: error.code };
}
