-- Work 04: backend and database integration baseline.
-- Monetary values are integer VND in *_minor columns. VND has no fractional minor unit here.

CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SUPPORT', 'FINANCE', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'THREADS');
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DISABLED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'VALIDATING', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'PURCHASE', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "DepositMethodType" AS ENUM ('BANK', 'QR', 'MANUAL');
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'WAITING_SUPPORT', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportSenderType" AS ENUM ('CUSTOMER', 'ADMIN');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(32),
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "email_verified_at" TIMESTAMPTZ(3),
  "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
  "last_password_change_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "session_version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_normalized" CHECK ("email" = lower("email"))
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" VARCHAR(64) NOT NULL,
  "provider" VARCHAR(128) NOT NULL,
  "provider_account_id" VARCHAR(255) NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" VARCHAR(64),
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" VARCHAR(255),
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

CREATE TABLE "sessions" (
  "id" UUID NOT NULL,
  "session_token" VARCHAR(255) NOT NULL,
  "user_id" UUID NOT NULL,
  "expires" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

CREATE TABLE "verification_tokens" (
  "identifier" VARCHAR(320) NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "expires" TIMESTAMPTZ(3) NOT NULL
);
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

CREATE TABLE "password_reset_tokens" (
  "id" UUID NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "used_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_email_expires_at_idx" ON "password_reset_tokens"("email", "expires_at");

CREATE TABLE "wallets" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "balance_minor" BIGINT NOT NULL DEFAULT 0,
  "reserved_minor" BIGINT NOT NULL DEFAULT 0,
  "currency" CHAR(3) NOT NULL DEFAULT 'VND',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallets_balance_non_negative" CHECK ("balance_minor" >= 0),
  CONSTRAINT "wallets_reserved_non_negative" CHECK ("reserved_minor" >= 0),
  CONSTRAINT "wallets_reserved_lte_balance" CHECK ("reserved_minor" <= "balance_minor")
);
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

CREATE TABLE "wallet_transactions" (
  "id" UUID NOT NULL,
  "wallet_id" UUID NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "status" "WalletTransactionStatus" NOT NULL,
  "amount_minor" BIGINT NOT NULL,
  "balance_before_minor" BIGINT NOT NULL,
  "balance_after_minor" BIGINT NOT NULL,
  "reference_type" VARCHAR(64),
  "reference_id" VARCHAR(128),
  "description" VARCHAR(255) NOT NULL,
  "idempotency_key" VARCHAR(128),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_transactions_balances_non_negative" CHECK ("balance_before_minor" >= 0 AND "balance_after_minor" >= 0)
);
CREATE UNIQUE INDEX "wallet_transactions_wallet_id_idempotency_key_key" ON "wallet_transactions"("wallet_id", "idempotency_key");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at" DESC);
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");

CREATE TABLE "service_categories" (
  "id" VARCHAR(64) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "services" (
  "id" VARCHAR(64) NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "category_id" VARCHAR(64) NOT NULL,
  "rate_per_thousand_minor" BIGINT NOT NULL,
  "min" INTEGER NOT NULL,
  "max" INTEGER NOT NULL,
  "average_time" VARCHAR(80) NOT NULL,
  "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
  "popular" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "services_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "services_quantity_range" CHECK ("min" > 0 AND "max" >= "min"),
  CONSTRAINT "services_rate_non_negative" CHECK ("rate_per_thousand_minor" >= 0)
);
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");
CREATE INDEX "services_platform_status_idx" ON "services"("platform", "status");
CREATE INDEX "services_category_id_status_idx" ON "services"("category_id", "status");

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(32) NOT NULL,
  "user_id" UUID NOT NULL,
  "service_id" VARCHAR(64) NOT NULL,
  "target_url" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "charge_minor" BIGINT NOT NULL,
  "start_count" INTEGER,
  "remaining" INTEGER NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" VARCHAR(128) NOT NULL,
  "request_fingerprint" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "orders_charge_non_negative" CHECK ("charge_minor" >= 0),
  CONSTRAINT "orders_remaining_non_negative" CHECK ("remaining" >= 0)
);
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");
CREATE UNIQUE INDEX "orders_user_id_idempotency_key_key" ON "orders"("user_id", "idempotency_key");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);
CREATE INDEX "orders_user_id_status_created_at_idx" ON "orders"("user_id", "status", "created_at" DESC);
CREATE INDEX "orders_service_id_created_at_idx" ON "orders"("service_id", "created_at" DESC);

CREATE TABLE "order_logs" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "from_status" "OrderStatus",
  "to_status" "OrderStatus" NOT NULL,
  "message" VARCHAR(255) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_logs_order_id_created_at_idx" ON "order_logs"("order_id", "created_at");

CREATE TABLE "deposit_methods" (
  "id" VARCHAR(64) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "type" "DepositMethodType" NOT NULL,
  "description" TEXT NOT NULL,
  "min_minor" BIGINT NOT NULL,
  "max_minor" BIGINT NOT NULL,
  "fee_label" VARCHAR(120) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "instructions" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "deposit_methods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "deposit_methods_range" CHECK ("min_minor" > 0 AND "max_minor" >= "min_minor")
);

CREATE TABLE "deposits" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(32) NOT NULL,
  "user_id" UUID NOT NULL,
  "method_id" VARCHAR(64) NOT NULL,
  "amount_minor" BIGINT NOT NULL,
  "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
  "reference" VARCHAR(128),
  "idempotency_key" VARCHAR(128) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "deposits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "deposits_amount_positive" CHECK ("amount_minor" > 0)
);
CREATE UNIQUE INDEX "deposits_public_id_key" ON "deposits"("public_id");
CREATE UNIQUE INDEX "deposits_user_id_idempotency_key_key" ON "deposits"("user_id", "idempotency_key");
CREATE INDEX "deposits_user_id_created_at_idx" ON "deposits"("user_id", "created_at" DESC);
CREATE INDEX "deposits_status_created_at_idx" ON "deposits"("status", "created_at" DESC);

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "deposit_id" UUID NOT NULL,
  "gateway" VARCHAR(64) NOT NULL,
  "external_payment_id" VARCHAR(255),
  "amount_minor" BIGINT NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'VND',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "idempotency_key" VARCHAR(128),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE UNIQUE INDEX "payments_gateway_external_payment_id_key" ON "payments"("gateway", "external_payment_id");
CREATE INDEX "payments_deposit_id_created_at_idx" ON "payments"("deposit_id", "created_at" DESC);

CREATE TABLE "payment_events" (
  "id" UUID NOT NULL,
  "payment_id" UUID,
  "gateway" VARCHAR(64) NOT NULL,
  "external_event_id" VARCHAR(255) NOT NULL,
  "payload_hash" VARCHAR(128) NOT NULL,
  "payload" JSONB,
  "signature_valid" BOOLEAN NOT NULL DEFAULT false,
  "processed_at" TIMESTAMPTZ(3),
  "error_code" VARCHAR(80),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_events_gateway_external_event_id_key" ON "payment_events"("gateway", "external_event_id");
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");

CREATE TABLE "support_tickets" (
  "id" UUID NOT NULL,
  "public_id" VARCHAR(32) NOT NULL,
  "user_id" UUID NOT NULL,
  "subject" VARCHAR(180) NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "support_tickets_public_id_key" ON "support_tickets"("public_id");
CREATE INDEX "support_tickets_user_id_updated_at_idx" ON "support_tickets"("user_id", "updated_at" DESC);
CREATE INDEX "support_tickets_status_updated_at_idx" ON "support_tickets"("status", "updated_at" DESC);

CREATE TABLE "support_messages" (
  "id" UUID NOT NULL,
  "ticket_id" UUID NOT NULL,
  "sender_type" "SupportSenderType" NOT NULL,
  "sender_user_id" UUID,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages"("ticket_id", "created_at");
CREATE INDEX "support_messages_sender_user_id_idx" ON "support_messages"("sender_user_id");

CREATE TABLE "notification_preferences" (
  "user_id" UUID NOT NULL,
  "order_updates" BOOLEAN NOT NULL DEFAULT true,
  "wallet_updates" BOOLEAN NOT NULL DEFAULT true,
  "promotions" BOOLEAN NOT NULL DEFAULT false,
  "support_replies" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_logs" ADD CONSTRAINT "order_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "deposit_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
