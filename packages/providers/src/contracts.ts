export type ProviderErrorCode =
  | "PROVIDER_UNAUTHORIZED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_INSUFFICIENT_BALANCE"
  | "PROVIDER_SERVICE_UNAVAILABLE"
  | "PROVIDER_INVALID_REQUEST"
  | "PROVIDER_MALFORMED_RESPONSE"
  | "PROVIDER_CONFIGURATION_MISSING"
  | "PROVIDER_UNKNOWN_ERROR";

export type NormalizedProviderOrderStatus =
  | "PENDING"
  | "SUBMITTED"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "UNKNOWN";

export type NormalizedProviderServiceStatus = "AVAILABLE" | "UNAVAILABLE" | "DISABLED" | "REMOVED";

export interface ProviderCapabilities {
  supportsCreateIdempotency: boolean;
  supportsClientReference: boolean;
  supportsLookupByClientReference: boolean;
  supportsCancel: boolean;
  supportsRefill: boolean;
  supportsBalance: boolean;
  supportsServiceSync: boolean;
}

export interface ProviderConnectionResult {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export interface ProviderBalanceResult {
  amountMinor: bigint;
  currency: string;
}

export interface NormalizedProviderService {
  externalServiceId: string;
  name: string;
  category?: string;
  platform?: "FACEBOOK" | "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "THREADS" | "GOOGLE";
  providerRateMinor: bigint;
  rateUnit: number;
  currency: string;
  min: number;
  max: number;
  supportsRefill: boolean;
  supportsCancel: boolean;
  status: NormalizedProviderServiceStatus;
  rawMetadata?: unknown;
}

export interface ProviderCreateOrderInput {
  internalOrderId: string;
  publicOrderId: string;
  externalServiceId: string;
  target: string;
  quantity: number;
  idempotencyKey?: string;
  clientReference?: string;
}

export type ProviderCreateOrderResult =
  | {
      outcome: "ACCEPTED";
      externalOrderId: string;
      status?: NormalizedProviderOrderStatus;
      rawStatus?: string;
      raw?: unknown;
    }
  | {
      outcome: "REJECTED";
      code: ProviderErrorCode;
      message: string;
      retryable: boolean;
      httpStatus?: number;
      raw?: unknown;
    }
  | {
      outcome: "UNKNOWN";
      code: ProviderErrorCode;
      message: string;
      httpStatus?: number;
      raw?: unknown;
    };

export interface ProviderOrderStatusInput {
  externalOrderId: string;
  clientReference?: string;
}

export interface ProviderOrderStatusResult {
  status: NormalizedProviderOrderStatus;
  remaining?: number;
  startCount?: number;
  rawStatus?: string;
  raw?: unknown;
}

export interface ProviderAdapter {
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
