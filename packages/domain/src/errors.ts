export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "SERVICE_NOT_FOUND"
  | "SERVICE_UNAVAILABLE"
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
