# Work 05 Admin Operations

## Development access

After migration/seed, default development accounts are:

```text
ADMIN    admin@example.com / Admin1234
CUSTOMER minh@example.com  / demo1234
CUSTOMER lan@example.com   / demo1234
```

These are development-only. Override through `.env`; never deploy these passwords to production.

## Customer status policy

`ACTIVE -> SUSPENDED` invalidates current customer sessions. A suspended customer cannot log in or use customer APIs because session/auth revalidation requires ACTIVE status. `SUSPENDED -> ACTIVE` permits a fresh login.

No hard-delete user operation is exposed in Work 05.

## Wallet adjustment runbook

1. Open customer detail.
2. Choose wallet adjustment.
3. Enter signed amount and operational reason.
4. Confirm the impact in the modal.
5. Server calculates before/after balances.
6. Verify `WalletTransaction(type=ADJUSTMENT)` and matching `AdminAuditLog`.

Negative adjustment is rejected if it would make available balance invalid.

## Deposit confirmation runbook

Only `PENDING` can be confirmed/failed/cancelled.

Confirmation atomically:

1. transitions deposit to `CONFIRMED`;
2. credits the wallet once;
3. completes/creates the DEPOSIT ledger row;
4. records admin/reason;
5. writes `DEPOSIT_CONFIRM` audit.

Sending confirmation twice must not credit twice.

## Order refund runbook

Work 05 does not control provider lifecycle. Admin therefore has no arbitrary “Mark Completed” action.

Refund is allowed only for internal statuses the system can safely unwind before/without successful provider completion: PENDING, VALIDATING, FAILED, CANCELLED. The operation credits the wallet once, writes REFUND ledger, changes status to REFUNDED, adds OrderLog and AuditLog in one transaction.

## Services/categories

Changing customer price produces both price history and audit trace. Disabling a service prevents new customer orders. A category cannot be disabled until its referenced services are disabled.

## Support

Admin replies are stored as `SupportMessage(senderType=ADMIN)` and are visible in the same customer conversation. Status changes are audited.

## Settings/maintenance

Settings page controls only operational non-secrets. When maintenance mode is on, customer application routes render the maintenance screen while Admin and authentication routes remain available. Order/support/deposit business toggles are enforced server-side, not only visually.

## Operational verification

After each deployment/migration:

```powershell
npm run db:validate
npm run db:migrate
npm run db:seed
npm run test:backend
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

Then start the app and run:

```powershell
npm run qa:work5:api
```

Complete browser/responsive QA before promoting the Work 05 checkpoint.
