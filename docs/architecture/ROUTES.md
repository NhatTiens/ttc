# Tương Tác Pro — Routes

This file lists application page routes. API routes are listed separately in `API_SPEC.md` and summarized at the end.

## 1. Public/auth routes

```text
/
/login
/register
/verify-email
/forgot-password
/reset-password
/terms
/privacy
/status                 (optional public status page later)
```

## 2. Customer routes

```text
/dashboard
/services
/services/[serviceId]
/orders/new              (workflow route; may be service-driven)
/orders
/orders/[orderId]
/wallet
/wallet/deposit
/wallet/deposits
/wallet/deposits/[depositId]
/wallet/transactions
/support
/support/new
/support/[ticketId]
/notifications
/account
/account/security
/account/sessions
```

UI details are intentionally not specified in this architecture checkpoint.

## 3. Admin routes

```text
/admin
/admin/users
/admin/users/[userId]

/admin/orders
/admin/orders/[orderId]
/admin/orders/manual-review

/admin/services
/admin/services/new
/admin/services/[serviceId]
/admin/services/[serviceId]/pricing
/admin/services/[serviceId]/providers
/admin/categories

/admin/providers
/admin/providers/new
/admin/providers/[providerId]
/admin/providers/[providerId]/services
/admin/providers/[providerId]/health

/admin/deposits
/admin/deposits/[depositId]
/admin/payments
/admin/payments/[paymentId]
/admin/transactions
/admin/reconciliation

/admin/support
/admin/support/[ticketId]

/admin/analytics
/admin/analytics/revenue
/admin/analytics/costs
/admin/analytics/profit

/admin/settings
/admin/settings/system
/admin/settings/security

/admin/audit-logs
/admin/operations/outbox
/admin/operations/queues
```

## 4. Route guards

### Public only

Login/register routes redirect authenticated users according to role when appropriate.

### Customer authenticated

`/dashboard`, `/services`, `/orders`, `/wallet`, `/support`, `/account`.

### Staff authenticated

Admin tree requires staff role, with per-page permission checks. `/admin/payments` is not automatically granted to SUPPORT merely because it is under `/admin`.

## 5. REST API route inventory

### Auth/account

```text
/api/auth/[...nextauth]
/api/v1/auth/register
/api/v1/auth/verify-email
/api/v1/auth/forgot-password
/api/v1/auth/reset-password
/api/v1/auth/revoke-sessions
/api/v1/me
/api/v1/me/sessions
/api/v1/me/sessions/[sessionId]
/api/v1/me/change-password
```

### Catalog/order

```text
/api/v1/service-categories
/api/v1/services
/api/v1/services/[serviceId]
/api/v1/orders/quote
/api/v1/orders
/api/v1/orders/[orderId]
/api/v1/orders/[orderId]/cancel
/api/v1/orders/[orderId]/refill
```

### Wallet/deposit

```text
/api/v1/wallet
/api/v1/wallet/transactions
/api/v1/deposits
/api/v1/deposits/[depositId]
/api/v1/deposits/[depositId]/cancel
```

### Support/notifications

```text
/api/v1/support/tickets
/api/v1/support/tickets/[ticketId]
/api/v1/support/tickets/[ticketId]/messages
/api/v1/support/tickets/[ticketId]/close
/api/v1/notifications
/api/v1/notifications/[id]/read
/api/v1/notifications/read-all
```

### Webhooks

```text
/api/v1/webhooks/payments/[gateway]
/api/v1/webhooks/providers/[providerCode]
```

### Admin users

```text
/api/v1/admin/users
/api/v1/admin/users/[userId]
/api/v1/admin/users/[userId]/status
/api/v1/admin/users/[userId]/role
/api/v1/admin/users/[userId]/revoke-sessions
/api/v1/admin/users/[userId]/wallet
/api/v1/admin/users/[userId]/wallet-adjustments
```

### Admin service/pricing

```text
/api/v1/admin/service-categories
/api/v1/admin/service-categories/[id]
/api/v1/admin/services
/api/v1/admin/services/[id]
/api/v1/admin/services/[id]/pause
/api/v1/admin/services/[id]/activate
/api/v1/admin/services/[id]/provider-routes
/api/v1/admin/services/[id]/pricing
/api/v1/admin/services/[id]/price-versions
/api/v1/admin/services/[id]/recalculate-price
```

### Admin providers

```text
/api/v1/admin/providers
/api/v1/admin/providers/[providerId]
/api/v1/admin/providers/[providerId]/credentials
/api/v1/admin/providers/[providerId]/test-connection
/api/v1/admin/providers/[providerId]/sync-services
/api/v1/admin/providers/[providerId]/services
/api/v1/admin/providers/[providerId]/balance
/api/v1/admin/providers/[providerId]/sync-balance
```

### Admin orders

```text
/api/v1/admin/orders
/api/v1/admin/orders/[orderId]
/api/v1/admin/orders/[orderId]/logs
/api/v1/admin/orders/[orderId]/provider-attempts
/api/v1/admin/orders/[orderId]/reconcile
/api/v1/admin/orders/[orderId]/request-cancel
/api/v1/admin/orders/[orderId]/request-refill
/api/v1/admin/orders/[orderId]/refund
/api/v1/admin/orders/[orderId]/mark-manual-review
```

### Admin finance

```text
/api/v1/admin/deposits
/api/v1/admin/deposits/[id]
/api/v1/admin/deposits/[id]/confirm-manual
/api/v1/admin/deposits/[id]/fail
/api/v1/admin/payments
/api/v1/admin/payments/[id]
/api/v1/admin/payments/[id]/refund
/api/v1/admin/wallet-transactions
/api/v1/admin/reconciliation/wallets
/api/v1/admin/reconciliation/run
```

### Admin operations/support/analytics/settings

```text
/api/v1/admin/support/tickets
/api/v1/admin/support/tickets/[id]
/api/v1/admin/support/tickets/[id]/messages
/api/v1/admin/analytics/overview
/api/v1/admin/analytics/revenue
/api/v1/admin/analytics/provider-costs
/api/v1/admin/analytics/profit
/api/v1/admin/system-settings
/api/v1/admin/system-settings/[key]
/api/v1/admin/audit-logs
/api/v1/admin/outbox
/api/v1/admin/queue/health
```

### Health

```text
/api/health/live
/api/health/ready
```
