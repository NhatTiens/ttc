# Work 05 Admin Security

## Authorization boundary

Authorization is enforced twice by design:

1. `apps/web/src/app/admin/layout.tsx` protects Admin pages server-side.
2. Every `/api/v1/admin/*` endpoint invokes centralized `requireAdmin()`.

The API is authoritative. Hiding navigation is never considered authorization.

`requireAdmin()` reuses Work 04 authenticated-user revalidation, so the JWT identity must match an ACTIVE database user and current `sessionVersion`, then requires role `ADMIN`.

## Suspended customers

Suspending a customer increments `sessionVersion`. Existing sessions therefore fail their next protected request. Credential login rejects non-ACTIVE users. Reactivation permits a new login but does not resurrect an old invalidated token.

## Request integrity

All Admin POST/PATCH routes call `requireSameOrigin()` before the mutation. Zod validates body/query data at the API boundary. Domain code revalidates entity state and financial invariants inside transactions.

## Money safety

Wallet balance is server-owned. The browser sends an adjustment amount/reason or action intent, never the resulting balance.

Money-changing operations use PostgreSQL/Prisma transactions:

- wallet adjustment — Serializable + idempotency key;
- deposit confirmation — Serializable + conditional PENDING transition;
- order refund — Serializable + conditional current-status transition.

Ledger and audit entries are committed in the same transaction as the balance/state mutation. If any write fails, the transaction rolls back.

## Concurrency/replay

Deposit confirm and order refund are state-idempotent and concurrency-protected. Wallet adjustment also has a unique ledger idempotency key. Backend automated tests issue concurrent attempts and verify one financial effect.

## Audit safety

`AdminAuditLog` records actor, action, entity, before/after summaries, metadata and optional request IP. Passwords, Auth secret, provider credentials and payment secrets are never written into audit metadata.

## Secrets

`SystemSetting` is intentionally non-secret. Provider/payment secrets are out of Work 05 scope and must later use dedicated secret management. `.env` remains ignored; `.env.example` contains development-only placeholders/default accounts only.

## Provider boundary

`/admin/providers` is a non-functional placeholder. Work 05 has no provider adapter calls, provider API keys, Tương Tác Chéo calls, or fake provider lifecycle transitions.
