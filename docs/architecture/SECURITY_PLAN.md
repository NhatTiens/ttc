# Tương Tác Pro — Security Plan

## 1. Security priorities

1. Protect money/wallet integrity.
2. Protect provider/payment secrets.
3. Prevent account/admin takeover.
4. Prevent duplicate financial/provider side effects.
5. Preserve auditability.
6. Reduce blast radius when one component is compromised.

## 2. Threat model highlights

- Credential stuffing/brute force.
- Session theft/fixation.
- CSRF against wallet/order/admin actions.
- XSS stealing non-HttpOnly application data or performing authenticated actions.
- Broken access control/IDOR on orders/tickets/admin resources.
- Provider API key leakage.
- Forged payment webhook.
- Replay webhook/double credit.
- Double order/double refund.
- Race on wallet balance.
- SSRF via configurable provider base URL.
- SQL/NoSQL injection.
- Malicious target URLs/payloads.
- Admin insider abuse.
- Dependency/container compromise.
- Log leakage of target URLs, credentials or payment data.

## 3. Authentication

- Password hashing: Argon2id with production-calibrated parameters.
- Email verification before financial actions according to policy.
- Auth.js database sessions.
- Secure + HttpOnly session cookie in production.
- SameSite Lax or stricter where flow permits.
- Rotate session on login/privilege-sensitive changes.
- `session_version` invalidates all sessions on password reset/compromise.
- Admin 2FA mandatory before launch.
- Optional customer 2FA later.

## 4. Authorization

RBAC baseline:

```text
CUSTOMER
SUPPORT
FINANCE
ADMIN
```

Every API resource query includes ownership/permission constraint. Do not fetch by ID then “hide button” in UI.

Examples:

- Customer order query: `WHERE id=? AND user_id=session.user.id`.
- Support cannot mutate pricing/provider credentials.
- Finance cannot change provider credential unless explicitly granted.
- Admin endpoint middleware is necessary but not sufficient; service methods also check capability for high-risk actions.

## 5. CSRF and CORS

- Same-origin web app/API preferred.
- CORS deny by default; no `*` with credentials.
- Validate `Origin`/`Host` on state-changing browser requests.
- Add CSRF token strategy for sensitive mutations.
- Webhooks are exempt from browser CSRF but require signature/authentication.

## 6. Input validation

- Zod at every HTTP boundary.
- Normalize email/target/IDs.
- Strict quantity numeric bounds.
- Reject unknown object keys for sensitive APIs where practical.
- Provider response is untrusted input too; validate adapter responses.
- Escape/render user text safely; do not render ticket content as raw HTML.

## 7. Target URL handling

Customer social target is data, not something backend should fetch by default. Do not perform server-side GET to arbitrary target links just to “validate” them unless a future feature absolutely requires it.

This removes a major SSRF surface.

## 8. Provider URL SSRF defense

Admin-configurable provider base URLs are dangerous.

Controls:

- HTTPS required in production except explicit approved private integration.
- Parse URL using standard library.
- Deny loopback, link-local, metadata endpoints and private IP ranges unless allowlisted operationally.
- DNS rebinding-aware egress policy where possible.
- Prefer deploy-time provider allowlist for known adapters.
- Nginx is not relied upon for outbound filtering.

## 9. Provider credentials

- AES-256-GCM application encryption at rest or external secret manager.
- Master key not stored in DB.
- Key rotation version field.
- Never return secret via GET.
- Redact Authorization/API key values in logs/errors/traces.
- Separate production/staging credentials.

## 10. Payment webhook security

- Verify official gateway signature using raw request bytes when required.
- Verify timestamp/replay window where supported.
- Unique external event ID.
- Validate amount, currency, merchant/account and expected deposit reference.
- Store event before/while processing so duplicate delivery is safe.
- Wallet credit in same DB transaction as payment confirmation transition.
- Do not trust client “payment success” redirect.

## 11. Wallet integrity

- No direct balance updates outside WalletService.
- Atomic conditional reserve/debit queries.
- Unique idempotency key for every posted transaction.
- Immutable ledger.
- Compensating entry instead of editing history.
- Periodic reconciliation.
- Alert/block on mismatch.

## 12. Order integrity

- Required idempotency key on create.
- Quote ownership/expiry/consumption checks.
- Unique provider order ID per provider.
- Provider side-effect attempt log.
- No blind retry of ambiguous non-idempotent create/cancel/refill.
- All state transitions guarded by allowed transition matrix.

## 13. Rate limiting

Redis-backed limits for:

- login/register/reset.
- quote/order.
- support spam.
- admin high-risk actions.
- provider sync trigger.

Rate limit keys should combine user/account/IP where appropriate. Do not use IP alone for account security.

## 14. HTTP/security headers

Nginx/Next.js baseline:

- TLS 1.2/1.3.
- HSTS after HTTPS is stable.
- CSP with nonce/hash strategy when UI implementation begins.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy` appropriate to business.
- `Permissions-Policy` minimal.
- Frame protection via CSP `frame-ancestors`.

## 15. Logging/privacy

Do log:

- request ID.
- actor ID.
- entity IDs.
- provider code.
- normalized error code/latency.

Do not log:

- passwords.
- session tokens.
- API keys.
- webhook secrets/signatures in full.
- full payment credentials.
- raw Authorization headers.

Target URLs may contain user identifiers; log hash or masked form by default.

## 16. Admin security

- 2FA.
- Shorter session TTL.
- Re-authentication for provider credential/large finance actions recommended.
- Full audit log.
- Reason required for manual finance/order overrides.
- Optional IP allowlist later for highest privilege.

## 17. Database security

- Separate DB role for application migrations vs runtime if practical.
- Runtime DB user has only needed privileges.
- DB not public.
- TLS for remote DB if ever separated.
- Encrypted backup storage.
- Backup restore drills.
- Prisma parameterization; raw SQL must use bound parameters.

## 18. Redis security

- Private Docker/network only.
- Authentication when topology requires it.
- No business source of truth in Redis.
- Queue jobs contain IDs, not secrets/full sensitive payloads.

## 19. Docker/Nginx

- Containers run as non-root when possible.
- Read-only filesystem for web/worker where possible.
- Drop unnecessary Linux capabilities.
- Pin image versions/digests for production.
- Health checks.
- No Postgres/Redis public ports.
- Limit request body sizes.
- Nginx timeouts do not exceed business request strategy unnecessarily.

## 20. Dependency/supply chain

- Lockfile committed.
- Automated dependency scanning.
- Secret scanning.
- `npm/pnpm audit` is signal, not the only control.
- Review high-impact package upgrades.
- CI blocks build on TypeScript/lint/test failures.

## 21. Backup & recovery

Required before launch:

- Automated Postgres backups.
- Point-in-time recovery if infrastructure supports it.
- Restore procedure tested, not merely “backup succeeded”.
- Provider credentials encryption key backed up securely and separately.
- Redis backup not required for correctness if outbox/reconciliation is implemented correctly, though queue persistence may improve recovery time.

## 22. Incident controls

Emergency switches:

- Global order creation pause.
- Per-provider pause.
- Per-service pause.
- Deposit/payment processing pause.
- Admin force session revoke.

A global “maintenance mode” must not prevent payment webhook ingestion unless intentionally designed, otherwise confirmed payments can be missed/delayed.

## 23. Security acceptance gates

Before production deployment:

- Auth/RBAC tests.
- CSRF tests.
- IDOR tests.
- Payment duplicate/replay tests.
- Order idempotency race tests.
- Wallet concurrency tests.
- Provider timeout/unknown tests.
- Secret redaction tests.
- Backup restore test.
- Dependency/secret scan.
- Manual review of admin money actions.
