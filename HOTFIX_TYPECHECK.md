# Hotfix - TypeScript offline typecheck

## Symptom

After `npm install`, `npm run check:offline` produced many JSX errors such as:

- `Link cannot be used as a JSX component`
- `Type 'unknown' is not assignable to type 'ReactNode'`

## Root cause

`apps/web/tsconfig.offline.json` explicitly compiled `src/validation/framework-stubs.d.ts` together with the real React/Next.js typings installed in `node_modules`.

The fallback stub intentionally declares simplified framework types such as `ReactNode = unknown`. Once real `@types/react` and Next.js typings are installed, those declarations conflict/merge and make valid JSX appear invalid.

## Fix

`apps/web/tsconfig.offline.json` now excludes `src/validation` and uses the installed React/Next.js type definitions.

Run from the repository root:

```powershell
npm run check:offline
npm run typecheck:web
npm run lint:web
npm run build:web
```

If `check:offline` succeeds but one of the real checks fails, keep the output and fix that next error rather than restoring the old framework stubs.
