# Tương Tác Pro - Lint Hotfix v3.0.2

This hotfix addresses the 8 ESLint findings reported after dependencies were installed locally: 4 errors and 4 warnings.

## Fixed

1. `order/new/page.tsx`
   - Removed synchronous state updates from `useEffect`.
   - Default platform/service/quantity are now derived values.
   - Removed unused `Service` type import.

2. `orders/page.tsx`
   - Removed `Date.now()` from render-time filtering.
   - Date range filtering now uses a deterministic anchor derived from loaded order data.

3. `customer-session.tsx`
   - Removed synchronous `setLoading(true)` from the effect.
   - Loading is derived from request revision state.

4. `use-async-resource.ts`
   - Removed synchronous state writes at effect start.
   - Loading/error state is derived from a request key and settled request state.

5. `identity.tsx`
   - Replaced raw `<img>` with `next/image`.

6. `dashboard/page.tsx`
   - Removed unused `Button` import.

7. `postcss.config.mjs`
   - Replaced anonymous default export with named `config` constant.

## Dependency-free QA run after patch

- UI source lint: PASS
- Component contract: PASS
- Responsive contract: PASS
- Customer application contract: PASS

## Run on Windows after applying the hotfix

```powershell
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

If any command fails, keep the full output and fix the new diagnostic rather than suppressing the rule.
