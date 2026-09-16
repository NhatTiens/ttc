# Tương Tác Pro — Customer Application Notes

## 1. Checkpoint scope

Work 3 turns the approved Design System/AppShell into a complete customer application while preserving the architectural boundary established earlier. No Admin UI, live provider API, or live payment integration is included.

## 2. Route map

| Route | Responsibility |
|---|---|
| `/dashboard` | Account overview, wallet, order KPIs, popular platform/services, recent orders |
| `/services` | Search/filter customer service catalog |
| `/pricing` | Full service pricing table |
| `/order/new` | Validated create-order workflow |
| `/orders` | Search/filter/paginate order history |
| `/orders/[id]` | Order detail and timeline |
| `/wallet/deposit` | Config-driven deposit intent UI |
| `/wallet/history` | Wallet ledger/history UI |
| `/support` | Ticket list |
| `/support/new` | Create ticket |
| `/support/[id]` | Customer/admin conversation |
| `/profile` | Personal info, password/security, notification preferences |
| `/login` | Customer sign-in |
| `/register` | Customer registration |
| `/forgot-password` | Password reset request |

Legacy route aliases redirect into the new canonical customer routes so links from the prior Architecture checkpoint are not broken.

## 3. Repository/service boundary

The pages depend on `CustomerService`, not on mock arrays or local page constants representing server state.

```text
UI
 -> CustomerService
   -> CustomerRepository
     -> MockCustomerRepository now
     -> RESTCustomerRepository later
```

`CustomerRepository` is the replacement seam. A future REST implementation should preserve the domain method contracts, then the page tree does not need to be rewritten.

## 4. Mock data policy

All Work 3 fake backend records are centralized under:

```text
apps/web/src/repositories/mock/
```

Pages may contain display configuration such as filter options or platform order, but not mock orders, wallet transactions, users, tickets, service pricing, or deposit records.

## 5. Order UX boundary

The current UI performs client-side checks before calling the service layer:

- active service required;
- valid public URL shape;
- quantity must be within the service min/max;
- estimated cost is derived from service rate and quantity;
- current wallet balance is displayed;
- submit is blocked when estimated cost exceeds available balance;
- a confirmation modal is shown before creation;
- submit has a loading state;
- success links to the new order detail.

The mock repository revalidates service availability, quantity, and wallet balance so the page is not the only protection layer. The production backend remains authoritative later.

## 6. Deposit UX boundary

Deposit methods are configuration records exposed through the repository, not hard-coded payment integrations in the page. Work 3 creates a pending mock deposit request only. It does not credit the wallet as a confirmed payment and does not imitate a real payment webhook.

## 7. Responsive behavior

The original AppShell behavior is preserved:

- 1440 / 1280: full navy desktop sidebar;
- 1024 / 768: tablet navigation rail;
- 430 / 390 / 375: dedicated bottom mobile navigation, never a scaled desktop sidebar.

Customer-specific grids, order summaries, tables, support conversations, forms, and auth layouts collapse independently at the same design-system breakpoints.

## 8. UX state handling

Data pages use reusable `LoadingState`, `ErrorState`, and `EmptyState`. Forms provide inline validation plus disabled/loading/success behavior where the action warrants it. Toasts handle operation-level feedback.

## 9. Future REST migration

When backend endpoints become available:

1. implement `RESTCustomerRepository` against `/api/v1/*`;
2. validate response DTOs at the HTTP boundary;
3. replace the repository instance used by `CustomerService`;
4. keep domain objects or add explicit DTO-to-domain mapping;
5. keep page/component imports unchanged;
6. remove mock credentials and mock records from production builds.

The provider remains server-side behind the backend architecture; no future repository implementation should call an external provider directly from the browser.

---

## Work 04 runtime update

The Work 03 UI/repository contract is preserved, but the production/default repository is now `RESTCustomerRepository`. `MockCustomerRepository` is no longer an automatic runtime fallback. Customer mutations/read models are persisted by the `/api/v1` backend in PostgreSQL.
