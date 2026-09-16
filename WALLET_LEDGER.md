# Work 04 — Wallet Ledger

## Invariants

For posted Work 04 transactions:

```text
wallet.balance_minor >= 0
wallet.reserved_minor >= 0
wallet.reserved_minor <= wallet.balance_minor
```

Every actual balance change created by Work 04 has a corresponding immutable `WalletTransaction`.

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

The wallet conditional debit, purchase ledger row, Order and OrderLog are committed together in one Serializable database transaction.

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

Order writes use Serializable transactions plus `balance >= charge` conditional wallet update. This protects against the classic 100,000 VND wallet receiving two concurrent 80,000 VND purchases.

## Reserved balance note

The earlier provider architecture introduced reservations because provider submission can have ambiguous outcomes. Work 04 explicitly has no provider and its requirement is to debit before creating a `PENDING` order. Therefore `reserved_minor` remains in the schema for the later provider Work but is not used by the Work 04 create-order path.
