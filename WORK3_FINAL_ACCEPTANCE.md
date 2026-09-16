# Tương Tác Pro — Work 03 Final Acceptance

**Artifact reviewed:** Customer Application v3.0.3 plus Final Acceptance polish changes  
**Acceptance status:** **PENDING — post-polish local runtime/toolchain revalidation required**  
**Scope respected:** no Admin implementation, no backend integration, no real provider/payment integration, no architecture rewrite.

## 1. Acceptance scope

This review covers the Work 03 Customer Application only:

- customer-facing copy and terminology;
- route inventory and redirects;
- mock repository/service behavior supporting customer flows;
- form validation paths;
- responsive layout behavior using the existing Design System/AppShell CSS;
- internal navigation inventory;
- final technical checks that can be executed in the current environment.

The user-provided local baseline before this acceptance pass had already passed `lint:web`, `typecheck:web`, `build:web`, and `dev:web`, and Next.js generated the expected route set. The acceptance polish changed customer copy, one mock-wallet-history behavior, one responsive rule, and one offline QA assertion. Therefore the four required commands must be rerun on the polished artifact before final sign-off.

## 2. Routes reviewed

### Required routes

| Route | Source/contract audit | Runtime status on polished artifact |
|---|---|---|
| `/` | PASS — redirects to `/login` | Pending local rerun |
| `/login` | PASS | Pending local rerun |
| `/register` | PASS | Pending local rerun |
| `/forgot-password` | PASS | Pending local rerun |
| `/dashboard` | PASS | Pending local rerun |
| `/services` | PASS | Pending local rerun |
| `/pricing` | PASS | Pending local rerun |
| `/order/new` | PASS | Pending local rerun |
| `/orders` | PASS | Pending local rerun |
| `/orders/TT260915-1042` | PASS — valid mock order ID | Pending local rerun |
| `/wallet` | PASS — redirects to `/wallet/history` | Pending local rerun |
| `/wallet/deposit` | PASS | Pending local rerun |
| `/wallet/history` | PASS | Pending local rerun |
| `/support` | PASS | Pending local rerun |
| `/support/new` | PASS | Pending local rerun |
| `/support/SUP-260915-031` | PASS — valid mock ticket ID | Pending local rerun |
| `/profile` | PASS | Pending local rerun |
| `/design-system` | PASS | Pending local rerun |

Additional compatibility aliases audited:

- `/orders/new` -> `/order/new`
- `/wallet/transactions` -> `/wallet/history`
- `/account` -> `/profile`
- `/account/security` -> `/profile`
- `/account/sessions` -> `/profile`

A static internal-link audit found **30 static internal hrefs and 0 unmatched route targets**. Dynamic order/support links map to the corresponding `[id]` route patterns.

## 3. User-flow QA

The customer mock repository/service layer was executed directly, not only inspected as source.

### Flow A — Login -> Dashboard -> Services -> Create Order -> Confirm -> Order Detail

Business/data path:

- catalog returns active services — PASS;
- invalid min/max quantity is rejected — PASS;
- valid order is created — PASS;
- created order is retrievable by its dynamic ID — PASS;
- wallet is debited exactly once by the calculated order charge — PASS;
- URL/email/password validation helpers were exercised separately — PASS.

UI navigation and modal interaction on the polished Next runtime: **pending local rerun**.

### Flow B — Dashboard -> Wallet -> Deposit -> Deposit Request -> Wallet History

- invalid deposit amount rejected — PASS;
- valid pending deposit request created — PASS;
- pending deposit does **not** credit wallet balance — PASS;
- pending deposit now appears in wallet history — PASS.

**Issue found and fixed:** before acceptance polish, `createDeposit()` returned a pending request but did not append a pending Deposit transaction, so the immediately-following Wallet History step did not reflect the new request. A pending transaction is now appended with unchanged `balanceAfter` until confirmation.

### Flow C — Support -> Create Ticket -> Ticket Detail -> Send Reply

- ticket created — PASS;
- ticket detail retrievable — PASS;
- initial message persisted — PASS;
- customer reply persisted and becomes the latest message — PASS;
- blank reply validation is present at the UI boundary — PASS by source audit.

UI navigation on the polished Next runtime: **pending local rerun**.

### Flow D — Profile -> Edit Profile -> Change Password -> Notification Settings

- profile edit persisted in mock session — PASS;
- password-change path updates password-change timestamp — PASS;
- notification preferences persist — PASS;
- invalid email/password/confirmation paths are present and validated — PASS by validation/source audit.

UI tabs/toast interaction on the polished Next runtime: **pending local rerun**.

### Validation checks executed

11 direct validation checks passed:

- required field rejects blank;
- required field accepts content;
- invalid email rejected;
- valid email accepted;
- short password rejected;
- password without digit rejected;
- valid password accepted;
- empty URL rejected;
- malformed URL rejected;
- non-HTTP(S) URL rejected;
- valid HTTPS URL accepted.

## 4. Copy polish

Customer-facing UI was audited across auth, dashboard, services, pricing, order creation/detail, orders list, wallet/deposit/history, support, profile, shared status/empty/loading/error/toast/navigation components, and mock customer content.

Representative fixes include:

- `Tom tat` -> `Tóm tắt`;
- `Số dư không du` -> `Số dư không đủ`;
- `Vui long nap them tien` -> `Vui lòng nạp thêm tiền`;
- `Phuong thuc` -> `Phương thức`;
- `So tien nap` -> `Số tiền nạp`;
- `Huong dan` -> `Hướng dẫn`;
- `Tao yêu cầu khac` -> `Tạo yêu cầu khác`;
- `Can hỗ trợ?` -> `Cần hỗ trợ?`;
- customer labels `Service`, `Quantity`, `Charge`, `Status`, `Created`, `Updated`, `Wallet`, and `Order` were replaced by Vietnamese equivalents where they were presentation text;
- `Link` labels were normalized to `URL`;
- `ETA` presentation was normalized to `Thời gian dự kiến` / `Dự kiến`;
- `/ 1K` presentation was normalized to `/ 1.000`;
- order/service/ticket/transaction enum values remain English internally but are mapped to Vietnamese labels for display;
- auth, support, payment-method instructions, loading/empty/error states, modal/drawer/toast accessibility labels, pagination and mobile-navigation labels were localized consistently;
- customer mock service names/descriptions and transaction/support content were normalized to Vietnamese;
- visible `ticket` wording was normalized to `yêu cầu hỗ trợ` while the internal `SupportTicket` model remains unchanged;
- service names were reordered into natural Vietnamese phrasing (for example `Người theo dõi TikTok`) and estimated-time values use `giờ/ngày` instead of compact English-style `h`.

`/design-system` intentionally remains an internal component-reference page and was not rewritten as customer product copy because Work 02 Design System is already accepted and this Work explicitly forbids arbitrary Design System changes.

## 5. Runtime issues found and fixed during acceptance

1. **Deposit request missing from wallet history** — fixed by appending a Pending Deposit transaction without crediting the wallet.
2. **Topbar notification count mismatch** — fixed from 3 to 2 to match the two rendered notifications.
3. **Small-phone platform picker clipping at 390/375 px** — fixed by using five fluid columns at <=430 px instead of forcing minimum 62 px columns. Re-rendered at 430/390/375 after the fix.
4. **Responsive QA assertion coupled to English aria-label** — fixed so the QA contract verifies the dedicated mobile navigation component rather than exact English copy.
5. **Mixed Vietnamese/English and missing-diacritic customer copy** — fixed as described above.
6. **Support terminology mixed English/Vietnamese** — visible `ticket` labels were normalized to `yêu cầu hỗ trợ`; internal type/route names were intentionally preserved.
7. **Service-name phrasing and time units were inconsistent** — mock service names now follow natural Vietnamese word order and `0-24h`-style presentation was normalized to `0–24 giờ`.

No backend, provider API, Admin feature, or architecture change was introduced.

## 6. Responsive visual QA

### Viewports exercised

- 1440 x 900
- 1280 x 800
- 1024 x 768
- 768 x 1024
- 430 x 932
- 390 x 844
- 375 x 812

### Browser-rendered checks

Chromium rendered the actual AppShell/Design System CSS through static visual fixtures at all seven target widths.

- AppShell + dashboard preview: **14 browser cases** (dashboard + design-system across seven widths).
- Acceptance component fixtures: **35 browser cases** (order/modal/toast, wallet, support conversation, profile, auth across seven widths).
- Total browser-rendered cases: **49**.

Results:

- horizontal page overflow: **none detected**;
- desktop sidebar at 1440/1280: **PASS**;
- tablet rail at 1024/768: **PASS**;
- dedicated mobile bottom navigation at 430/390/375: **PASS**;
- mobile responsive-table representation: **PASS** in the Design System fixture;
- order summary: **PASS**;
- modal width/height within viewport: **PASS** at all seven widths;
- toast remains within horizontal viewport: **PASS** at all seven widths;
- wallet method cards/form: **PASS**;
- support conversation/composer: **PASS**;
- profile form/tabs structure: **PASS**;
- auth layout: **PASS**;
- platform selector at 375/390 after fix: **PASS**, no clipped final platform label;
- mobile end-of-page clearance above the fixed bottom navigation: approximately **28 px** at 430/390/375 in the shell preview, so final content remains reachable and unobscured when scrolled to the bottom.

Representative 375 px and 768 px screenshots were manually inspected after automated layout assertions.

**Limitation:** these are browser-rendered CSS/component fixtures and the existing static preview, not the polished Next.js application runtime. Route-specific browser visual QA must still be rerun locally on the final source.

## 7. Browser console QA

For the 49 browser-rendered static visual cases:

- page errors: **0**;
- console errors: **0**;
- console warnings: **0**.

Actual Next.js route console/hydration/navigation errors on the polished artifact: **pending local rerun** because the current execution environment cannot install the project dependencies.

## 8. Technical checks

### Successfully executed after acceptance changes

- `npm run lint:web:offline` — **PASS**
- `npm run qa:offline` — **PASS**
  - 33 components
  - 5 platforms
  - 7 order statuses
  - responsive contract at all requested breakpoint widths
  - 15 required Customer Application route contracts + 3 legacy aliases in the existing QA script
- strict TypeScript check of domain/repository/service/validation subset using TypeScript 5.8.3 — **PASS**
- TypeScript syntax/parser diagnostic scan of 63 `.ts/.tsx` source files — **PASS, 0 syntax errors**
- direct mock customer-flow execution — **PASS, 14 assertions**
- direct validation execution — **PASS, 11 assertions**
- static internal-link/route audit — **PASS, 30 links / 0 unmatched targets**

### Final independent rerun after the last copy-polish edits

The dependency-independent checks were rerun after the final support/service wording changes:

- `npm run lint:web:offline` — **PASS**
- `npm run qa:offline` — **PASS**
- strict domain/repository/service/validation TypeScript check — **PASS**
- direct customer-flow assertions — **PASS, 14/14**
- validation assertions — **PASS, 11/11**
- route/link audit — **PASS, 30 static links / 0 invalid targets**
- TypeScript/TSX parser diagnostics — **PASS, 63 files / 0 syntax errors**

### Required final commands

| Command | Baseline supplied by user before polish | Post-polish status in current environment |
|---|---:|---:|
| `npm run lint:web` | PASS | **BLOCKED: dependencies unavailable in this container** |
| `npm run typecheck:web` | PASS | **BLOCKED: dependencies unavailable in this container** |
| `npm run build:web` | PASS | **BLOCKED: dependencies unavailable in this container** |
| `npm run check:offline` | not part of the supplied final baseline list | **BLOCKED at typecheck:offline because React/Next type packages are not installed** |

The dependency install attempt failed with DNS/registry resolution error (`EAI_AGAIN` for `registry.npmjs.org`). This is an execution-environment limitation, not a source failure. Reintroducing fake framework types or disabling TypeScript/ESLint rules was deliberately avoided.

## 9. Known limitations by design

These are expected Work 03 constraints, not acceptance regressions:

- customer data is an in-memory mock and resets on a hard reload/dev restart;
- login/register are mock flows, not Auth.js-backed authentication yet;
- deposits remain Pending until a future real payment integration confirms them;
- 2FA configuration is intentionally disabled until backend/auth integration;
- no real provider API is connected;
- no Admin application has been started;
- Topbar global search remains an AppShell visual control; page-level search/filter controls are the functional Work 03 search paths.

## 10. Remaining acceptance blockers

Work 03 must **not** be declared accepted yet because the instructions require all checks to be rerun after the final polish.

Run these commands on the final artifact in the already-working local environment:

```powershell
npm run lint:web
npm run typecheck:web
npm run build:web
npm run check:offline
```

Then start:

```powershell
npm run dev:web
```

and do one final browser pass for the required routes/flows while checking DevTools Console. If all four commands and route/browser-console smoke tests pass, there are no source-level blockers identified by this acceptance review.

## Status

**FINAL ACCEPTANCE PENDING — POST-POLISH LOCAL RUNTIME REVALIDATION REQUIRED**
