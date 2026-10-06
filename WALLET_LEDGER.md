# Wallet Ledger — current Work 07 contract

## Invariants

For all runtime wallet mutations:

```text
wallet.balance_minor >= 0
wallet.reserved_minor >= 0
wallet.reserved_minor <= wallet.balance_minor
```

Every posted balance change has a corresponding immutable `WalletTransaction`. Reservation changes are tracked in `WalletReservation`, not in a fictitious completed PURCHASE. Available balance is `balance_minor - reserved_minor` and is the balance displayed to customers.

## Transaction semantics

### Development seed credit

```text
type    ADJUSTMENT
status  COMPLETED
amount  +1,250,000 VND (default development seed)
```

The seed uses a unique ledger idempotency key, so rerunning the seed does not repeatedly fund the account.

### Order

```text
type    PURCHASE
status  COMPLETED
amount  -charge
```

Create a server quote first, then consume it to create the order. The conditional reservation (`balance - reserved >= charge`), quote consumption, Order, unique WalletReservation, OrderLog and routing-enabled submission job commit in one Serializable transaction. Posted balance does not change.

The PURCHASE above is appended only on provider acceptance. Capture decrements posted and reserved balances exactly once and persists provider acceptance/order status/initial poll in the same transaction. A definite rejection releases only the hold; unknown submission retains the hold for reconciliation. Capture and release are mutually exclusive, one-way terminal reservation states.

### Deposit request

```text
type    DEPOSIT
status  PENDING
amount  +requested amount
balance_before == balance_after
```

The amount describes the requested credit but does not affect the posted wallet balance. A future payment/admin confirmation workflow must convert this through an explicit posting transaction; Work 04 does not fake confirmation.

## Rounding

The server stores the service price as integer VND per 1,000 units and computes:

```text
ceil(rate_per_1000 * quantity / 1000)
```

Integer arithmetic (`BigInt`) is used for the authoritative result.

## Concurrency

Order writes use Serializable transactions plus the atomic `balance - reserved >= charge` predicate. Wallet row locks, conditional reservation state changes and a unique capture ledger key protect concurrent capture/release and replay. Serialization and raw-SQL deadlock conflicts receive bounded retries.

## Historical orders and refunds

Historical Work 04–06 orders may have no reservation because their purchase was posted immediately. They are never debited again; settlement/refund requires proof of the historical completed PURCHASE. Admin closure of an unsubmitted, reserved order releases funds without crediting posted balance. Accepted provider refunds append compensating REFUND credits only up to the captured charge and never decrease the cumulative refund or reopen a terminal order.
