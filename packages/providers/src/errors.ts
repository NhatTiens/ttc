import type { ProviderErrorCode } from "./contracts";

export class ProviderAdapterError extends Error {
  readonly code: ProviderErrorCode;
  readonly retryable: boolean;
  readonly ambiguousSideEffect: boolean;
  readonly httpStatus?: number;

  constructor(
    code: ProviderErrorCode,
    message: string,
    options: { retryable?: boolean; ambiguousSideEffect?: boolean; httpStatus?: number; cause?: unknown } = {}
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ProviderAdapterError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.ambiguousSideEffect = options.ambiguousSideEffect ?? false;
    this.httpStatus = options.httpStatus;
  }
}

export function classifyHttpError(status: number): ProviderAdapterError {
  if (status === 401 || status === 403) {
    return new ProviderAdapterError("PROVIDER_UNAUTHORIZED", "Provider rejected credentials.", { httpStatus: status });
  }
  if (status === 429) {
    return new ProviderAdapterError("PROVIDER_RATE_LIMIT", "Provider rate limit reached.", { retryable: true, httpStatus: status });
  }
  if (status >= 500) {
    return new ProviderAdapterError("PROVIDER_UNAVAILABLE", "Provider temporarily unavailable.", { retryable: true, httpStatus: status });
  }
  return new ProviderAdapterError("PROVIDER_INVALID_REQUEST", "Provider rejected the request.", { httpStatus: status });
}

export function toProviderAdapterError(error: unknown, ambiguousSideEffect = false): ProviderAdapterError {
  if (error instanceof ProviderAdapterError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ProviderAdapterError("PROVIDER_TIMEOUT", "Provider request timed out.", {
      retryable: true,
      ambiguousSideEffect
    });
  }
  return new ProviderAdapterError("PROVIDER_UNKNOWN_ERROR", "Unexpected provider error.", {
    retryable: true,
    ambiguousSideEffect,
    cause: error
  });
}
