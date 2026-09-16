# Build hotfix v3.0.3

This hotfix addresses the Next.js 16 production prerender failure reported for `/order/new`.

## Changes

- Wrapped the `/order/new` component that reads `useSearchParams()` in a React `Suspense` boundary.
- Applied the same fix proactively to `/services`, which also reads `useSearchParams()` and would otherwise be the next prerender candidate.
- Moved `typedRoutes` from `experimental.typedRoutes` to the supported top-level Next.js config option.
- Updated `tsconfig.json` to the values Next.js 16.3.5 was already applying automatically (`jsx: react-jsx` and `.next/dev/types/**/*.ts`).

## Validation completed in the packaging environment

- `npm run lint:web:offline` - PASS
- `npm run qa:offline` - PASS
- All occurrences of `useSearchParams()` in app routes were reviewed and are now below page-level `Suspense` boundaries.

The packaging environment could not complete `npm install` because registry access timed out, so run the real framework checks on the machine that already has dependencies installed:

```powershell
npm run lint:web
npm run typecheck:web
npm run build:web
```
