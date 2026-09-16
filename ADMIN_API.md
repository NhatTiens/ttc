# Work 05 Admin API

All endpoints use the existing JSON envelope:

```json
{ "data": {} }
```

or

```json
{ "error": { "code": "FORBIDDEN", "message": "..." } }
```

All routes require an authenticated ACTIVE `ADMIN`. Mutation routes also use the same-origin guard and validate request bodies with Zod. Money mutations do not accept `balanceAfter` or other authoritative calculated values from the browser.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/dashboard` | Real operational summary |
| GET | `/api/v1/admin/users` | Search/filter/paginate customers |
| GET | `/api/v1/admin/users/:id` | Customer operations detail |
| PATCH | `/api/v1/admin/users/:id/status` | Suspend/reactivate customer |
| POST | `/api/v1/admin/users/:id/wallet-adjustments` | Ledger-backed wallet adjustment; requires `Idempotency-Key` |
| GET | `/api/v1/admin/orders` | Order operations list |
| GET | `/api/v1/admin/orders/:id` | Order, timeline and wallet ledger detail |
| POST | `/api/v1/admin/orders/:id/refund` | Atomic controlled refund |
| GET/POST | `/api/v1/admin/services` | List/create customer services |
| GET/PATCH | `/api/v1/admin/services/:id` | Read/update service |
| GET/POST | `/api/v1/admin/categories` | List/create categories |
| PATCH | `/api/v1/admin/categories/:id` | Update/enable/disable category |
| GET | `/api/v1/admin/wallets` | Wallet list |
| GET | `/api/v1/admin/transactions` | Wallet ledger search |
| GET | `/api/v1/admin/deposits` | Deposit operations list |
| GET | `/api/v1/admin/deposits/:id` | Deposit detail |
| POST | `/api/v1/admin/deposits/:id/confirm` | Atomic one-time confirmation/credit |
| POST | `/api/v1/admin/deposits/:id/fail` | PENDING -> FAILED |
| POST | `/api/v1/admin/deposits/:id/cancel` | PENDING -> CANCELLED |
| GET | `/api/v1/admin/support/tickets` | Support queue |
| GET | `/api/v1/admin/support/tickets/:id` | Ticket conversation |
| POST | `/api/v1/admin/support/tickets/:id/messages` | Admin reply |
| PATCH | `/api/v1/admin/support/tickets/:id/status` | Ticket status transition |
| GET | `/api/v1/admin/analytics` | 7/30 day real DB analytics |
| GET | `/api/v1/admin/audit-logs` | Search/paginate admin audit trail |
| GET/PATCH | `/api/v1/admin/settings` | Non-secret operational settings |

No Work 05 endpoint calls an external provider or Tương Tác Chéo.

## Authorization semantics

- no authenticated session -> `401 UNAUTHORIZED`;
- authenticated CUSTOMER -> `403 FORBIDDEN`;
- ACTIVE ADMIN -> operation allowed subject to validation/business rules;
- suspended session -> `401 UNAUTHORIZED` after DB session-version/status revalidation.

## Error behavior

Domain/Zod errors are converted to stable API errors. Raw Prisma/database exceptions and stack traces are not sent to customers/admin browsers.

Important codes include `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `INSUFFICIENT_BALANCE`, `DUPLICATE_REQUEST`, `SERVICE_NOT_FOUND`, `SERVICE_UNAVAILABLE`, `ORDER_NOT_FOUND`, `DEPOSIT_NOT_FOUND`, `TICKET_NOT_FOUND`, and `INTERNAL_ERROR`.
