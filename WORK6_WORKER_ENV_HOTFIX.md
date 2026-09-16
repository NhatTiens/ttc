# Work 06 Worker Environment Hotfix

## Symptom

`npm run worker:once` failed with:

```text
[provider-worker] fatal DATABASE_URL is required for database operations.
```

while the web app and Prisma commands could access the same local database.

## Root cause

Next.js, Prisma config, seed scripts and QA scripts explicitly load the repository-root `.env`, but the standalone `tsx` worker did not. In addition, worker modules read provider/queue settings from `process.env` during module evaluation, so loading `.env` after static imports would be too late.

## Fix

- Added `apps/worker/src/bootstrap.ts`.
- The bootstrap loads the repository-root `.env` with Node's built-in `process.loadEnvFile()` when the file exists.
- Only after environment loading does it dynamically import `src/index.ts`, ensuring database and provider/queue configuration are available before worker modules evaluate.
- Updated worker `dev`, `start`, and `once` scripts to use the bootstrap.
- Existing process environment variables still take precedence over `.env` values.
- No new npm dependency is required.

## Verification

Run:

```powershell
npm run typecheck:worker
npm run worker:once
```

With Work 06 generic TTC mode and no verified TTC API contract, the queued TTC action should be handled safely and enter the configured manual-review/configuration-missing path rather than failing because `DATABASE_URL` is absent.
