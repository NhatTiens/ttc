# Tương Tác Pro — REST API Specification

## 1. Base conventions

Base path:

```text
/api/v1
```

- JSON only except future file upload endpoints.
- Request/response UTF-8.
- Auth via secure Auth.js session cookie for web client.
- State-changing endpoints require CSRF/origin protection.
- All important mutations accept `Idempotency-Key` header; order creation requires it.
- API never trusts price/role/provider fields sent by browser.
- `X-Request-Id` returned on every response.

## 2. Response envelope

Success:

```json
{
  "data": {},
  "meta": { "requestId": "req_..." }
}
```

Error:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Số dư khả dụng không đủ.",
    "details": {}
  },
  "meta": { "requestId": "req_..." }
}
```

## 3. Common error codes

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`
- `QUOTE_EXPIRED`
- `QUOTE_ALREADY_USED`
- `PRICE_CHANGED`
- `INSUFFICIENT_BALANCE`
- `SERVICE_UNAVAILABLE`
- `ORDER_NOT_CANCELLABLE`
- `ORDER_NOT_REFILLABLE`
- `PAYMENT_ALREADY_PROCESSED`
- `PROVIDER_TEMPORARILY_UNAVAILABLE`
- `RATE_LIMITED`

## 4. Authentication endpoints

Auth.js:

```text
GET|POST /api/auth/[...nextauth]
```

Application endpoints:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create user |
| POST | `/auth/verify-email` | Public | Verify email token |
| POST | `/auth/forgot-password` | Public | Send reset flow |
| POST | `/auth/reset-password` | Public | Reset password |
| POST | `/auth/revoke-sessions` | User | Revoke other sessions |

Registration never accepts role from client.

## 5. Current user/account

| Method | Path | Purpose |
|---|---|---|
| GET | `/me` | Profile/session-safe fields |
| PATCH | `/me` | Update allowed profile fields |
| GET | `/me/sessions` | Active sessions |
| DELETE | `/me/sessions/:sessionId` | Revoke session |
| POST | `/me/change-password` | Change credentials |

## 6. Services

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/service-categories` | User | Active categories |
| GET | `/services` | User | Search/filter active services with customer price |
| GET | `/services/:serviceId` | User | Service detail |

Example list query:

```text
GET /services?platform=TIKTOK&categoryId=...&q=follow&page=1&pageSize=50
```

Response never includes provider ID, provider service ID, provider rate or markup unless caller is authorized admin endpoint.

## 7. Quote & order endpoints

### `POST /orders/quote`

Request:

```json
{
  "serviceId": "svc_...",
  "target": "https://...",
  "quantity": 1000
}
```

Backend:

- Zod validation.
- Normalize target.
- Validate min/max and service active.
- Resolve current route + price version.
- Calculate charge.
- Store short-lived quote.

Response:

```json
{
  "data": {
    "quoteId": "qte_...",
    "serviceId": "svc_...",
    "quantity": 1000,
    "customerRate": "20.25",
    "rateUnit": 1,
    "chargeMinor": 20250,
    "currency": "VND",
    "expiresAt": "..."
  }
}
```

### `POST /orders`

Required header:

```text
Idempotency-Key: <uuid/random token generated once per submit intent>
```

Request:

```json
{
  "quoteId": "qte_..."
}
```

Behavior:

- Same user + same idempotency key + same payload => return original response.
- Same key + different payload => 409.
- Atomic quote consume + wallet reserve + order + outbox.

Response status: `201 Created` first time, `200 OK` on idempotent replay is acceptable if documented consistently.

### Other order endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/orders` | Paginated history |
| GET | `/orders/:orderId` | Order detail/log summary |
| POST | `/orders/:orderId/cancel` | Request cancellation if supported |
| POST | `/orders/:orderId/refill` | Request refill if supported |

Cancel/refill also require idempotency key.

## 8. Wallet endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/wallet` | Posted/reserved/available balance |
| GET | `/wallet/transactions` | Immutable transaction history |

Example:

```json
{
  "data": {
    "currency": "VND",
    "balanceMinor": 500000,
    "reservedMinor": 20000,
    "availableMinor": 480000
  }
}
```

## 9. Deposit/payment endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/deposits` | Create deposit intent |
| GET | `/deposits` | User deposit history |
| GET | `/deposits/:depositId` | Deposit/payment state |
| POST | `/deposits/:depositId/cancel` | Cancel pending deposit where allowed |

Provider/gateway webhook endpoints:

```text
POST /webhooks/payments/:gateway
POST /webhooks/providers/:providerCode   (optional when provider supports callbacks)
```

Webhook rules:

- Raw body retained only as needed for signature verification.
- Verify signature before trusting event.
- `external_event_id` dedupe.
- Return 2xx for already-processed valid duplicates.
- Do not expose detailed internal error to gateway.

## 10. Support endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/support/tickets` | Create ticket |
| GET | `/support/tickets` | List own tickets |
| GET | `/support/tickets/:ticketId` | Ticket/messages |
| POST | `/support/tickets/:ticketId/messages` | Reply |
| POST | `/support/tickets/:ticketId/close` | Close ticket |

## 11. Notification endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/notifications` | User notifications |
| PATCH | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/read-all` | Mark all read |

## 12. Admin — users

Prefix `/admin` under API v1.

| Method | Path |
|---|---|
| GET | `/admin/users` |
| GET | `/admin/users/:userId` |
| PATCH | `/admin/users/:userId/status` |
| PATCH | `/admin/users/:userId/role` |
| POST | `/admin/users/:userId/revoke-sessions` |
| GET | `/admin/users/:userId/wallet` |
| POST | `/admin/users/:userId/wallet-adjustments` |

Wallet adjustment requires amount, reason, idempotency key and appropriate finance permission.

## 13. Admin — catalog/pricing

| Method | Path |
|---|---|
| GET/POST | `/admin/service-categories` |
| GET/PATCH/DELETE | `/admin/service-categories/:id` |
| GET/POST | `/admin/services` |
| GET/PATCH | `/admin/services/:id` |
| POST | `/admin/services/:id/pause` |
| POST | `/admin/services/:id/activate` |
| GET | `/admin/services/:id/provider-routes` |
| PUT | `/admin/services/:id/provider-routes` |
| GET | `/admin/services/:id/pricing` |
| PUT | `/admin/services/:id/pricing` |
| GET | `/admin/services/:id/price-versions` |
| POST | `/admin/services/:id/recalculate-price` |

Price update should return calculated preview before activation when change exceeds configured threshold.

## 14. Admin — providers

| Method | Path |
|---|---|
| GET/POST | `/admin/providers` |
| GET/PATCH | `/admin/providers/:providerId` |
| PUT | `/admin/providers/:providerId/credentials` |
| POST | `/admin/providers/:providerId/test-connection` |
| POST | `/admin/providers/:providerId/sync-services` |
| GET | `/admin/providers/:providerId/services` |
| GET | `/admin/providers/:providerId/balance` |
| POST | `/admin/providers/:providerId/sync-balance` |

Credential GET endpoint does not exist; admin only receives masked metadata.

## 15. Admin — orders

| Method | Path |
|---|---|
| GET | `/admin/orders` |
| GET | `/admin/orders/:orderId` |
| GET | `/admin/orders/:orderId/logs` |
| GET | `/admin/orders/:orderId/provider-attempts` |
| POST | `/admin/orders/:orderId/reconcile` |
| POST | `/admin/orders/:orderId/request-cancel` |
| POST | `/admin/orders/:orderId/request-refill` |
| POST | `/admin/orders/:orderId/refund` |
| POST | `/admin/orders/:orderId/mark-manual-review` |

Không cung cấp endpoint “force completed” tùy tiện. Nếu cần manual override, phải là privileged workflow có reason, before/after audit và financial consistency checks.

## 16. Admin — finance

| Method | Path |
|---|---|
| GET | `/admin/deposits` |
| GET | `/admin/deposits/:id` |
| POST | `/admin/deposits/:id/confirm-manual` |
| POST | `/admin/deposits/:id/fail` |
| GET | `/admin/payments` |
| GET | `/admin/payments/:id` |
| POST | `/admin/payments/:id/refund` |
| GET | `/admin/wallet-transactions` |
| GET | `/admin/reconciliation/wallets` |
| POST | `/admin/reconciliation/run` |

## 17. Admin — support/system/audit/analytics

| Method | Path |
|---|---|
| GET | `/admin/support/tickets` |
| GET | `/admin/support/tickets/:id` |
| POST | `/admin/support/tickets/:id/messages` |
| PATCH | `/admin/support/tickets/:id` |
| GET | `/admin/analytics/overview` |
| GET | `/admin/analytics/revenue` |
| GET | `/admin/analytics/provider-costs` |
| GET | `/admin/analytics/profit` |
| GET | `/admin/system-settings` |
| PUT | `/admin/system-settings/:key` |
| GET | `/admin/audit-logs` |
| GET | `/admin/outbox` |
| GET | `/admin/queue/health` |

## 18. Health endpoints

```text
GET /api/health/live
GET /api/health/ready
```

`ready` checks database and essential dependencies with strict timeouts; it must not call every external provider.

## 19. Rate limit baseline

Suggested starting limits, tuned after real traffic:

- Login: 5–10 attempts/minute/IP + account-based throttle.
- Password reset: very low rate.
- Quote: 60/min/user.
- Create order: 20/min/user unless business needs more.
- Ticket/message: 30/min/user.
- Admin money mutations: low rate + audit.
- Webhooks: gateway-specific, signature required; avoid naive IP-only blocking.

## 20. Pagination

Cursor pagination preferred for orders/transactions/logs:

```text
?limit=50&cursor=...
```

Admin analytics may use date-range aggregation endpoints.
