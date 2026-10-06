export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_UNAVAILABLE"
  | "QUOTE_NOT_FOUND"
  | "QUOTE_EXPIRED"
  | "QUOTE_ALREADY_USED"
  | "RESERVATION_CONFLICT"
  | "ORDER_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "DUPLICATE_REQUEST"
  | "DEPOSIT_NOT_FOUND"
  | "TICKET_NOT_FOUND"
  | "EMAIL_IN_USE"
  | "INVALID_CREDENTIALS"
  | "INTERNAL_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function isTransactionConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: string; meta?: { code?: string; driverAdapterError?: { cause?: { originalCode?: string } } } };
  if (value.code === "P2034") return true;
  if (value.code !== "P2010") return false;
  const sqlState = value.meta?.code ?? value.meta?.driverAdapterError?.cause?.originalCode;
  return sqlState === "40001" || sqlState === "40P01";
}
