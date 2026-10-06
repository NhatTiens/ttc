# Repository audit and complete patch — 2026-10-06

## Baseline and delivery

Repository: https://github.com/NhatTiens/ttc. Before making the new review changes, `git fetch origin main` and the GitHub branch API both confirmed `main` at `5739601f2776cbcfce69e5ab115ebcbfa3da7dc0` (subject `fix work̉`). The complete patch includes the Work 07 implementation as well as this additional audit's fixes; it is not a tests-only or incremental patch. No GitHub push was performed and no real credential is included.

Read/review scope included customer/admin domain rules, API routes and validation, repositories/order UI, wallet/quote schema and migrations, provider adapter/HTTP layer, worker claims/submissions/polling/refunds, tests/verification scripts, manifests/lockfile and architecture documentation. This does not claim every possible runtime defect has been eliminated: database-backed tests and live provider behavior need the checks described below.

Prisma generated client files and Next generated `next-env.d.ts` are intentionally omitted from the patch. `npm ci` runs Prisma generation; the verifier repeats it before tests. The TypeScript build cache is removed from version control and ignored. Apply the patch with `git apply --index` in a clean clone, not over partially applied earlier patches.

The full patch was applied to a separate clean clone of that exact baseline with `git apply --check` and `git apply --index`. A fresh `npm ci` there regenerated the new Prisma models; schema validation, all QA/provider unit tests, lint, all three typechecks, offline/static contracts, production build and production audit succeeded again. Thus the delivered source patch does not depend on unbundled generated files or a pre-existing local node_modules directory.

## Fixes delivered

Wallet/order: order creation holds available funds (`balance - reserved`) rather than posting a debit; quote consumption, reservation, order/log and enabled provider job are atomic. Capture/release are mutually exclusive, idempotent and ledger-backed. Legacy purchases are verified before submission/refund. Pending admin closure releases instead of crediting. Refund totals cannot go backwards, and stale provider statuses cannot reopen terminal orders. Raw PostgreSQL serialization/deadlock errors receive bounded retry along with Prisma conflicts.

Quotes/UI: server-priced expiring one-use quotes, atomic concurrent consume, frozen price snapshots, payload-sensitive Idempotency-Key replay, a real quote API and confirmation flow. Late quote responses cannot overwrite a changed service/quantity. The browser's estimate cannot block an authoritative server quote. Malformed successful API responses retain the mutation idempotency key for recovery. Google Maps filters now match the existing database/UI enum. Mock order creation no longer invents a completed PURCHASE while the order is still pending.

Worker/provider: per-order submission admission prevents distinct duplicate jobs from sending duplicate creates. Queue state transitions fence stale claims. Crashed PREPARED/SENDING or UNKNOWN_SUBMISSION retains funds for review, never blind capture/release. The first poll is created atomically with acceptance/capture. Accepted creates with early failed/partial statuses remain pollable for refund settlement. Ancillary failures after financial commit cannot rewrite settlement. Create HTTP 5xx is treated as ambiguous; the timeout covers the whole bounded response body. Camel-case credential keys, embedded error credentials and prototype-sensitive keys are sanitized.

Safety/tooling: destructive integration fixtures require a separate, explicitly test-labelled PostgreSQL database; username/schema and loopback aliases cannot disguise the primary database. Bash verification is fail-fast and root-resolving. Windows Work 04/06/07 verifiers check native exit codes. A clean-clone PowerShell updater preserves the old directory and never commits/pushes. Official Prisma migration is included; no `prisma db push` is used.

Dependencies: Next/eslint-config-next updated to 16.3.8. Root overrides pin deepmerge-ts 8.0.2 for Prisma config, mysql2 3.24.5 and source-map-js 1.2.2. `npm ci`, Prisma config generation/validation and the Next production build succeeded with this lockfile. The deepmerge override crosses a major version: retain migration-backed integration testing and replace it with a compatible upstream Prisma release when available; do not install a Prisma prerelease or run `npm audit fix --force` blindly.

## Actual verification evidence

| Gate | Actual result |
| --- | --- |
| `npm ci` / Prisma postinstall generation | Success |
| `npm run db:generate`, `npm run db:validate` | Success |
| `npm run test:qa` | 7/7 tests passed |
| `npm run test:providers` | 16/16 tests passed |
| `npm run lint:web` | Success |
| Web/providers/worker typechecks | Success, including integration test source |
| `npm run check:offline`, `npm run qa:work7:static` | Success |
| `npm run build:web` | Success, Next 16.3.8 including `/api/v1/quotes` |
| `npm run audit:production` | Success: zero reported production vulnerabilities at the checkpoint |
| Full development-inclusive `npm audit --audit-level=high` | Not clean: 5 high entries in braces/micromatch/fast-glob/Next ESLint dependency graph |
| `scripts/work7-verify.sh` | Exit 1 at `db:test:prepare`; not PASS |
| Test migration / backend / worker integration | BLOCKED: no PostgreSQL server reachable, TCP `127.0.0.1:5432` returns ECONNREFUSED; `prisma migrate deploy` exits 1 |
| Windows PowerShell execution | Not run here; no PowerShell runtime. Gate parity/fail-fast structure is unit-tested |
| Live TTC create/reconciliation | Not attempted; requires opt-in and verified operational credentials |

The upstream braces advisory has no patched release at this checkpoint: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. Production audit passing does not mean the development dependency tree is clean. Do not pass untrusted glob patterns to the tooling. The `npm ls` command also flags the explicitly overridden Prisma transitive pins as differing from upstream's pinned versions; the installed versions and audited lockfile are intentional, and Prisma generation/validation were tested. Migration-backed compatibility is still BLOCKED here.

Financial integration coverage includes 13 Work 07 scenarios for reservation races, exactly-once capture/release, rollback, quote expiry/reuse/ownership/snapshots, concurrent consumption/idempotency and refund monotonicity. Worker integration has 9 scenarios including duplicate jobs, unknown/rejection/acceptance, early terminal acceptance, stale claim recovery and crashed SENDING. Work 04–06 integration suites are retained and adjusted to quote/reservation semantics. These are implemented tests, not claimed passes in the absence of PostgreSQL.

## Known remaining boundaries

Overall status is **BLOCKED**, not Work 07 PASS and not a blanket “all errors fixed” claim. Local PostgreSQL integration must finish before merging/deploying. Automated unknown-submission reconciliation, live TTC acceptance, production admin 2FA/login throttling, email/reset delivery and real payment gateway verification remain follow-ups; architecture blueprints now explicitly distinguish them from shipped behavior.

## COMMANDS TO RUN LOCALLY

Windows recommended path: download `ttc-repo-fix.patch` and `apply-repository-fix.ps1` into the old repository directory. Ensure PostgreSQL is running and the old `.env` points to the intended local primary database plus a separate `_test` database. Run from that old directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\apply-repository-fix.ps1 -PatchPath .\ttc-repo-fix.patch
```

The updater clones a sibling `ttc-work7-fixed` directory, verifies the exact baseline, applies the patch including new files, copies only the local ignored `.env`, installs, migrates and executes the complete Bash gates. It does not transfer unrelated uncommitted work from the old folder, delete that folder, commit or push. If the destination already exists, choose a different `-DestinationPath`. If `main` advanced, stop and rebase the patch; do not reset or force it onto another commit. If no `.env` existed, configure the new example and continue below instead of rerunning the clone script.

After a stopped setup, continue from the new repository; do not commit/push if any command fails:

```powershell
Set-Location ..\ttc-work7-fixed
# If local PostgreSQL is not already running and Docker is installed:
# docker compose -f docker-compose.work4.yml up -d --wait postgres
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
npm.cmd run db:generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed" }
npm.cmd run db:validate
if ($LASTEXITCODE -ne 0) { throw "Prisma validate failed" }
npm.cmd run db:migrate
if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
& "C:\Program Files\Git\bin\bash.exe" ./scripts/work7-verify.sh
if ($LASTEXITCODE -ne 0) { throw "Work 07 is not PASS. Do not push." }
```

Only after all local gates succeed, inspect the staged and unstaged changes, then commit/push explicitly yourself:

```powershell
git status
git diff --stat HEAD
git diff --cached --stat
git add .
if ($LASTEXITCODE -ne 0) { throw "git add failed" }
git commit -m "Complete Work 07 wallet reservation and quote architecture"
if ($LASTEXITCODE -ne 0) { throw "git commit failed" }
git push origin main
if ($LASTEXITCODE -ne 0) { throw "Push failed. Do not use force-push." }
```

Equivalent Git Bash workflow in a clean baseline clone, with the downloaded patch in its parent directory and a configured local `.env`:

```bash
set -euo pipefail
git checkout main
git pull --rebase origin main
test "$(git rev-parse HEAD)" = 5739601f2776cbcfce69e5ab115ebcbfa3da7dc0
git apply --check ../ttc-repo-fix.patch
git apply --index ../ttc-repo-fix.patch
npm ci

# Start/configure PostgreSQL before these commands; never use a production DB.
npm run db:generate
npm run db:validate
npm run db:migrate

chmod +x scripts/work7-verify.sh
./scripts/work7-verify.sh

git status
git diff --stat HEAD
git diff --cached --stat
git add .
git commit -m "Complete Work 07 wallet reservation and quote architecture"
git push origin main
```
