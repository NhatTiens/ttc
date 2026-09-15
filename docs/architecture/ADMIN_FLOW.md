# Tương Tác Pro — Admin Flow

## 1. Admin dashboard

Dashboard chỉ đọc aggregate/read models:

- Revenue customer charges.
- Refunds.
- Provider estimated/final costs.
- Gross profit.
- Pending deposits/payments.
- Orders by status.
- Provider health/balance.
- Unknown provider submissions/manual review queue.
- Outbox/worker lag.
- Wallet reconciliation state.

Không tính profit trực tiếp từ “giá hiện tại”; dùng order financial snapshots.

## 2. User management

```text
Users list
 -> user detail
 -> account status
 -> sessions
 -> wallet summary
 -> orders/deposits/tickets
```

Sensitive actions:

- Suspend/activate.
- Change staff role.
- Revoke sessions.
- Wallet adjustment.

Wallet adjustment requires finance/admin permission, signed amount, reason and idempotency key. It produces wallet transaction + admin log; no direct balance edit.

## 3. Provider onboarding

```text
Providers
 -> Add provider metadata
 -> Set base URL
 -> Store encrypted credential
 -> Test connection
 -> Sync services
 -> Review imported catalog
 -> Map provider services to internal services
 -> Enable routing
```

API key can be replaced but never read back in plaintext.

## 4. Service creation

1. Create category/platform.
2. Create internal service.
3. Select one or more provider services.
4. Configure priority/fallback.
5. Configure pricing rule.
6. Preview customer price.
7. Activate.

Internal service identity is stable even if provider changes.

## 5. Pricing management

Admin pricing screen conceptually shows:

```text
Provider cost rate
Provider currency
FX rate
Markup %
Fixed markup
Calculated sell rate
Manual override (optional)
Margin amount / margin %
Effective version
```

On save:

- Validate bounds.
- Compute candidate price.
- If cost/price change exceeds configured threshold, require explicit confirmation/second permission depending on risk level.
- Create new immutable price version.
- Move `services.current_price_version_id`.
- Write admin audit log.

Never rewrite historical price version used by orders.

## 6. Provider service sync

Scheduled/manual sync:

1. Adapter `getServices()`.
2. Upsert provider service latest fields.
3. Detect added/removed/rate changed.
4. Recalculate affected price versions according to pricing policy.
5. Large cost spike may pause service or mark `PRICE_REVIEW_REQUIRED` instead of blindly selling below cost.
6. Audit sync summary.

## 7. Order operations

Admin order detail includes:

- Customer/service/target (permission controlled).
- Public and internal IDs.
- Price/cost snapshots.
- Wallet reservation/debit/refund references.
- Provider route/provider order ID.
- Public status.
- Provider submission state.
- Provider attempts.
- Order logs.
- Reconciliation actions.

### Manual reconciliation

For `provider_submission_state=UNKNOWN`:

1. Query provider if adapter can look up by client reference/order list.
2. If found, attach provider order ID and capture reservation.
3. If definitively not found and provider semantics make retry safe, enqueue retry.
4. If impossible to prove either side, keep manual review; do not duplicate or refund blindly.

### Manual refund

- Calculate max refundable = `charge - refunded`.
- Require amount/reason.
- Insert idempotent refund ledger transaction.
- Update cumulative refund and status according to amount.
- Audit actor/reason.

## 8. Deposits/payments

Manual confirmation is allowed only for methods explicitly configured for manual finance reconciliation.

Confirmation transaction:

```text
verify deposit pending
verify payment/reference/amount
transition payment/deposit
credit wallet exactly once
write audit
```

Repeated admin click returns prior result via idempotency.

## 9. External payment refund

Before external refund:

- Verify payment `CONFIRMED`.
- Verify refund not already in progress/completed.
- Ensure business policy for wallet clawback.
- If user already spent funds, do not make wallet negative silently; route to finance exception workflow.
- Only mark payment `REFUNDED` when external refund is confirmed.

## 10. Support administration

- Queue by status/priority.
- Assign staff.
- Reply.
- Link related user/order/deposit.
- Resolve/close.
- Staff cannot see provider secret.

## 11. System settings

Examples:

- default quote TTL.
- default markup limits.
- price spike threshold.
- order status poll cadence.
- order max age.
- deposit expiry.
- maintenance mode.
- support contact info.

Secrets do not belong in `system_settings`.

## 12. Audit log review

Filter by:

- actor.
- action.
- entity.
- date.
- request ID.

High-risk actions to flag:

- provider credential change.
- pricing change.
- wallet adjustment.
- payment manual confirmation/refund.
- order manual reconciliation/refund.
- role/status change.
- security settings change.

## 13. Four-eyes controls recommended later

For higher volume, introduce approval workflow for:

- large wallet adjustment.
- large manual refund.
- provider credential replacement.
- markup below minimum margin.
- bulk service repricing.

Not mandatory for initial implementation but schema/audit should not block adding it.
