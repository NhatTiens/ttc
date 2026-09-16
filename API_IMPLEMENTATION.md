# Work 04 — API Implementation

## Response envelope

Success:

```json
{ "data": {} }
```

Error:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Số dư không đủ."
  }
}
```

Raw database exceptions and stack traces are not returned to customers.

## Implemented REST endpoints

Authentication is handled by Auth.js under `/api/auth/*` plus Work 04 registration/password-reset request endpoints.

```text
POST  /api/v1/auth/register
POST  /api/v1/auth/forgot-password

GET   /api/v1/me
PATCH /api/v1/me
PATCH /api/v1/me/password
PATCH /api/v1/me/notifications

GET   /api/v1/dashboard

GET   /api/v1/service-categories
GET   /api/v1/services
GET   /api/v1/services/:id

GET   /api/v1/orders
POST  /api/v1/orders
GET   /api/v1/orders/:id

GET   /api/v1/wallet
GET   /api/v1/wallet/transactions

GET   /api/v1/deposit-methods
GET   /api/v1/deposits
POST  /api/v1/deposits

GET   /api/v1/support/tickets
POST  /api/v1/support/tickets
GET   /api/v1/support/tickets/:id
POST  /api/v1/support/tickets/:id/messages
```

## Validation

Zod validates all Work 04 HTTP boundaries, including:

- registration email/password/name;
- profile/password/notification preferences;
- service/order query filters and pagination values;
- target URL protocol;
- order service ID/quantity;
- deposit amount/method;
- support subject/message/reply.

Client validation remains UX only.

## Authentication and ownership

Protected routes derive `userId` from Auth.js session. Customer API request bodies do not accept an authoritative `userId`.

Order and support details are owner-scoped. Wallet/profile resources are resolved directly from the authenticated customer.

State-changing Work 04 REST routes reject an explicitly mismatched browser `Origin` header.

## Error codes

Implemented domain/API codes include:

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
SERVICE_NOT_FOUND
SERVICE_UNAVAILABLE
ORDER_NOT_FOUND
INSUFFICIENT_BALANCE
DUPLICATE_REQUEST
DEPOSIT_NOT_FOUND
TICKET_NOT_FOUND
EMAIL_IN_USE
INVALID_CREDENTIALS
INTERNAL_ERROR
```

## Idempotency

The REST repository sends generated `Idempotency-Key` headers for order and deposit mutations. The authoritative protection is database uniqueness/domain handling on the server.


## Mutation origin protection

Every Work 04 `/api/v1` POST/PATCH mutation checks the browser `Origin` when present and rejects cross-origin requests before authentication/business logic. Auth.js cookie protections remain in place; this guard is an additional server-side boundary for customer mutations.


## Browser retry idempotency

The REST repository persists order/deposit idempotency keys in same-tab `sessionStorage` keyed by a SHA-256 digest of the request payload while the outcome is ambiguous. Network/5xx failures retain the key; successful or deterministic 4xx outcomes clear it. The database unique constraint remains the authoritative duplicate-prevention layer.
