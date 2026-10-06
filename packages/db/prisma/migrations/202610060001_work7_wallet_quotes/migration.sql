-- Work 07: server quotes and explicit wallet reservation/capture/release lifecycle.

CREATE TYPE "WalletReservationStatus" AS ENUM ('RESERVED', 'CAPTURED', 'RELEASED');

CREATE TABLE "order_quotes" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "service_id" VARCHAR(64) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "rate_per_thousand_minor" BIGINT NOT NULL,
  "charge_minor" BIGINT NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'VND',
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_quotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_quotes_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "order_quotes_rate_non_negative" CHECK ("rate_per_thousand_minor" >= 0),
  CONSTRAINT "order_quotes_charge_non_negative" CHECK ("charge_minor" >= 0)
);

CREATE INDEX "order_quotes_user_id_expires_at_idx" ON "order_quotes"("user_id", "expires_at");
CREATE INDEX "order_quotes_service_id_created_at_idx" ON "order_quotes"("service_id", "created_at" DESC);

ALTER TABLE "orders" ADD COLUMN "quote_id" UUID;
CREATE UNIQUE INDEX "orders_quote_id_key" ON "orders"("quote_id");

CREATE TABLE "wallet_reservations" (
  "id" UUID NOT NULL,
  "wallet_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "amount_minor" BIGINT NOT NULL,
  "status" "WalletReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "captured_at" TIMESTAMPTZ(3),
  "released_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "wallet_reservations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_reservations_amount_non_negative" CHECK ("amount_minor" >= 0),
  CONSTRAINT "wallet_reservations_terminal_timestamp" CHECK (
    ("status" = 'RESERVED' AND "captured_at" IS NULL AND "released_at" IS NULL)
    OR ("status" = 'CAPTURED' AND "captured_at" IS NOT NULL AND "released_at" IS NULL)
    OR ("status" = 'RELEASED' AND "released_at" IS NOT NULL AND "captured_at" IS NULL)
  )
);

CREATE UNIQUE INDEX "wallet_reservations_order_id_key" ON "wallet_reservations"("order_id");
CREATE INDEX "wallet_reservations_wallet_id_status_created_at_idx" ON "wallet_reservations"("wallet_id", "status", "created_at");

ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_quotes" ADD CONSTRAINT "order_quotes_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "order_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
