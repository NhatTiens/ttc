-- Work 06: generic provider integration, durable PostgreSQL jobs, mappings and economics snapshots.
-- Provider credentials remain server-side environment/secret-store values and are not persisted here.

CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DEGRADED');
CREATE TYPE "ProviderHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'DOWN', 'UNKNOWN');
CREATE TYPE "ProviderServiceStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'DISABLED', 'REMOVED');
CREATE TYPE "ProviderMappingStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PRICE_REVIEW_REQUIRED', 'PROVIDER_UNAVAILABLE', 'MIN_MAX_CONFLICT');
CREATE TYPE "ProviderMarkupType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "ProviderPricingMode" AS ENUM ('MANUAL', 'AUTO_MARKUP');
CREATE TYPE "ProviderSubmissionState" AS ENUM ('PENDING', 'PREPARED', 'SENDING', 'SAFE_TO_RETRY', 'UNKNOWN_SUBMISSION', 'ACCEPTED', 'REJECTED', 'MANUAL_REVIEW');
CREATE TYPE "ProviderOrderStatus" AS ENUM ('CREATED', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED', 'REFUNDED', 'UNKNOWN');
CREATE TYPE "ProviderJobType" AS ENUM ('SUBMIT_ORDER', 'POLL_ORDER_STATUS', 'SYNC_SERVICES', 'SYNC_BALANCE', 'TEST_CONNECTION');
CREATE TYPE "ProviderJobStatus" AS ENUM ('PENDING', 'RUNNING', 'RETRY', 'MANUAL_REVIEW', 'COMPLETED', 'FAILED');

ALTER TABLE "orders"
  ADD COLUMN "refunded_minor" BIGINT NOT NULL DEFAULT 0,
  ADD CONSTRAINT "orders_refunded_non_negative" CHECK ("refunded_minor" >= 0),
  ADD CONSTRAINT "orders_refunded_lte_charge" CHECK ("refunded_minor" <= "charge_minor");

CREATE TABLE "providers" (
  "id" UUID NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "status" "ProviderStatus" NOT NULL DEFAULT 'DISABLED',
  "health" "ProviderHealth" NOT NULL DEFAULT 'UNKNOWN',
  "base_url" VARCHAR(500),
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
  "max_concurrent_requests" INTEGER NOT NULL DEFAULT 1,
  "min_request_interval_ms" INTEGER NOT NULL DEFAULT 250,
  "next_request_at" TIMESTAMPTZ(3),
  "balance_minor" BIGINT,
  "balance_currency" VARCHAR(16),
  "last_balance_sync_at" TIMESTAMPTZ(3),
  "last_health_at" TIMESTAMPTZ(3),
  "last_successful_at" TIMESTAMPTZ(3),
  "last_error_code" VARCHAR(80),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "providers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "providers_timeout_positive" CHECK ("timeout_ms" > 0),
  CONSTRAINT "providers_rate_limit_config_valid" CHECK ("max_concurrent_requests" > 0 AND "min_request_interval_ms" >= 0),
  CONSTRAINT "providers_balance_nonnegative" CHECK ("balance_minor" IS NULL OR "balance_minor" >= 0)
);
CREATE UNIQUE INDEX "providers_code_key" ON "providers"("code");
CREATE INDEX "providers_enabled_status_priority_idx" ON "providers"("enabled", "status", "priority");

CREATE TABLE "provider_services" (
  "id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "external_service_id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "category" VARCHAR(120),
  "platform" "SocialPlatform",
  "provider_rate_minor" BIGINT NOT NULL,
  "rate_unit" INTEGER NOT NULL DEFAULT 1000,
  "currency" VARCHAR(16) NOT NULL DEFAULT 'VND',
  "min" INTEGER NOT NULL,
  "max" INTEGER NOT NULL,
  "supports_refill" BOOLEAN NOT NULL DEFAULT false,
  "supports_cancel" BOOLEAN NOT NULL DEFAULT false,
  "status" "ProviderServiceStatus" NOT NULL DEFAULT 'AVAILABLE',
  "raw_metadata" JSONB,
  "last_synced_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "provider_services_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_services_rate_nonnegative" CHECK ("provider_rate_minor" >= 0),
  CONSTRAINT "provider_services_rate_unit_positive" CHECK ("rate_unit" > 0),
  CONSTRAINT "provider_services_quantity_range" CHECK ("min" > 0 AND "max" >= "min")
);
CREATE UNIQUE INDEX "provider_services_provider_id_external_service_id_key" ON "provider_services"("provider_id", "external_service_id");
CREATE INDEX "provider_services_provider_id_status_last_synced_at_idx" ON "provider_services"("provider_id", "status", "last_synced_at" DESC);
CREATE INDEX "provider_services_platform_status_idx" ON "provider_services"("platform", "status");

CREATE TABLE "service_provider_mappings" (
  "id" UUID NOT NULL,
  "service_id" VARCHAR(64) NOT NULL,
  "provider_service_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "auto_fallback_allowed" BOOLEAN NOT NULL DEFAULT false,
  "markup_type" "ProviderMarkupType" NOT NULL DEFAULT 'PERCENTAGE',
  "markup_bps" INTEGER NOT NULL DEFAULT 0,
  "fixed_markup_minor" BIGINT NOT NULL DEFAULT 0,
  "minimum_margin_minor" BIGINT NOT NULL DEFAULT 0,
  "pricing_mode" "ProviderPricingMode" NOT NULL DEFAULT 'MANUAL',
  "status" "ProviderMappingStatus" NOT NULL DEFAULT 'ACTIVE',
  "last_price_review_at" TIMESTAMPTZ(3),
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "service_provider_mappings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_provider_mappings_markup_nonnegative" CHECK ("markup_bps" >= 0 AND "fixed_markup_minor" >= 0 AND "minimum_margin_minor" >= 0),
  CONSTRAINT "service_provider_mappings_priority_positive" CHECK ("priority" > 0)
);
CREATE UNIQUE INDEX "service_provider_mappings_service_id_provider_service_id_key" ON "service_provider_mappings"("service_id", "provider_service_id");
CREATE UNIQUE INDEX "service_provider_mappings_service_id_priority_key" ON "service_provider_mappings"("service_id", "priority");
CREATE INDEX "service_provider_mappings_provider_service_id_enabled_status_idx" ON "service_provider_mappings"("provider_service_id", "enabled", "status");

CREATE TABLE "provider_price_history" (
  "id" UUID NOT NULL,
  "provider_service_id" UUID NOT NULL,
  "previous_rate_minor" BIGINT NOT NULL,
  "new_rate_minor" BIGINT NOT NULL,
  "source" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_price_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_price_history_rates_nonnegative" CHECK ("previous_rate_minor" >= 0 AND "new_rate_minor" >= 0)
);
CREATE INDEX "provider_price_history_provider_service_id_created_at_idx" ON "provider_price_history"("provider_service_id", "created_at" DESC);

CREATE TABLE "provider_orders" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "provider_service_id" UUID NOT NULL,
  "external_order_id" VARCHAR(255),
  "client_reference" VARCHAR(128) NOT NULL,
  "submission_state" "ProviderSubmissionState" NOT NULL DEFAULT 'PENDING',
  "status" "ProviderOrderStatus" NOT NULL DEFAULT 'CREATED',
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "provider_rate_snapshot_minor" BIGINT NOT NULL,
  "rate_unit_snapshot" INTEGER NOT NULL,
  "provider_cost_minor" BIGINT NOT NULL,
  "customer_charge_minor" BIGINT NOT NULL,
  "gross_margin_minor" BIGINT NOT NULL,
  "currency" VARCHAR(16) NOT NULL DEFAULT 'VND',
  "request_payload" JSONB,
  "response_payload" JSONB,
  "submitted_at" TIMESTAMPTZ(3),
  "last_checked_at" TIMESTAMPTZ(3),
  "next_poll_at" TIMESTAMPTZ(3),
  "last_error_code" VARCHAR(80),
  "last_error_message" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "provider_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_orders_attempt_nonnegative" CHECK ("attempt_count" >= 0),
  CONSTRAINT "provider_orders_money_nonnegative" CHECK ("provider_rate_snapshot_minor" >= 0 AND "provider_cost_minor" >= 0 AND "customer_charge_minor" >= 0),
  CONSTRAINT "provider_orders_rate_unit_positive" CHECK ("rate_unit_snapshot" > 0)
);
CREATE UNIQUE INDEX "provider_orders_order_id_key" ON "provider_orders"("order_id");
CREATE UNIQUE INDEX "provider_orders_client_reference_key" ON "provider_orders"("client_reference");
CREATE UNIQUE INDEX "provider_orders_provider_id_external_order_id_key" ON "provider_orders"("provider_id", "external_order_id");
CREATE INDEX "provider_orders_provider_id_status_updated_at_idx" ON "provider_orders"("provider_id", "status", "updated_at");
CREATE INDEX "provider_orders_submission_state_updated_at_idx" ON "provider_orders"("submission_state", "updated_at");
CREATE INDEX "provider_orders_next_poll_at_status_idx" ON "provider_orders"("next_poll_at", "status");

CREATE TABLE "provider_order_attempts" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "provider_order_record_id" UUID,
  "provider_id" UUID NOT NULL,
  "provider_service_id" UUID NOT NULL,
  "action" VARCHAR(32) NOT NULL DEFAULT 'CREATE',
  "attempt_no" INTEGER NOT NULL,
  "provider_idempotency_key" VARCHAR(128),
  "client_reference" VARCHAR(128),
  "request_hash" VARCHAR(64) NOT NULL,
  "state" "ProviderSubmissionState" NOT NULL DEFAULT 'PREPARED',
  "http_status" INTEGER,
  "external_order_id" VARCHAR(255),
  "error_code" VARCHAR(80),
  "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(3),
  CONSTRAINT "provider_order_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_order_attempts_attempt_positive" CHECK ("attempt_no" > 0)
);
CREATE UNIQUE INDEX "provider_order_attempts_order_id_action_attempt_no_key" ON "provider_order_attempts"("order_id", "action", "attempt_no");
CREATE INDEX "provider_order_attempts_provider_id_provider_idempotency_key_idx" ON "provider_order_attempts"("provider_id", "provider_idempotency_key");
CREATE INDEX "provider_order_attempts_order_id_started_at_idx" ON "provider_order_attempts"("order_id", "started_at" DESC);
CREATE INDEX "provider_order_attempts_state_started_at_idx" ON "provider_order_attempts"("state", "started_at");

CREATE TABLE "provider_jobs" (
  "id" UUID NOT NULL,
  "type" "ProviderJobType" NOT NULL,
  "status" "ProviderJobStatus" NOT NULL DEFAULT 'PENDING',
  "dedupe_key" VARCHAR(180) NOT NULL,
  "provider_id" UUID,
  "order_id" UUID,
  "provider_order_id" UUID,
  "payload" JSONB,
  "run_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 6,
  "locked_at" TIMESTAMPTZ(3),
  "locked_by" VARCHAR(120),
  "last_error_code" VARCHAR(80),
  "last_error_message" VARCHAR(500),
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "provider_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_jobs_attempts_valid" CHECK ("attempts" >= 0 AND "max_attempts" > 0)
);
CREATE UNIQUE INDEX "provider_jobs_dedupe_key_key" ON "provider_jobs"("dedupe_key");
CREATE INDEX "provider_jobs_status_run_at_idx" ON "provider_jobs"("status", "run_at");
CREATE INDEX "provider_jobs_provider_id_status_run_at_idx" ON "provider_jobs"("provider_id", "status", "run_at");
CREATE INDEX "provider_jobs_order_id_created_at_idx" ON "provider_jobs"("order_id", "created_at" DESC);

CREATE TABLE "provider_operation_logs" (
  "id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "order_id" UUID,
  "operation" VARCHAR(64) NOT NULL,
  "external_order_id" VARCHAR(255),
  "duration_ms" INTEGER,
  "result" VARCHAR(48) NOT NULL,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "error_code" VARCHAR(80),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_operation_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_operation_logs_provider_id_created_at_idx" ON "provider_operation_logs"("provider_id", "created_at" DESC);
CREATE INDEX "provider_operation_logs_order_id_created_at_idx" ON "provider_operation_logs"("order_id", "created_at" DESC);
CREATE INDEX "provider_operation_logs_result_created_at_idx" ON "provider_operation_logs"("result", "created_at" DESC);

CREATE TABLE "provider_request_leases" (
  "id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "worker_id" VARCHAR(120) NOT NULL,
  "acquired_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "provider_request_leases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_request_leases_provider_id_expires_at_idx" ON "provider_request_leases"("provider_id", "expires_at");

CREATE TABLE "provider_balance_snapshots" (
  "id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "amount_minor" BIGINT NOT NULL,
  "currency" VARCHAR(16) NOT NULL,
  "captured_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_balance_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_balance_snapshots_nonnegative" CHECK ("amount_minor" >= 0)
);
CREATE INDEX "provider_balance_snapshots_provider_id_captured_at_idx" ON "provider_balance_snapshots"("provider_id", "captured_at" DESC);

ALTER TABLE "provider_services" ADD CONSTRAINT "provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_provider_mappings" ADD CONSTRAINT "service_provider_mappings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_provider_mappings" ADD CONSTRAINT "service_provider_mappings_provider_service_id_fkey" FOREIGN KEY ("provider_service_id") REFERENCES "provider_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_provider_mappings" ADD CONSTRAINT "service_provider_mappings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_price_history" ADD CONSTRAINT "provider_price_history_provider_service_id_fkey" FOREIGN KEY ("provider_service_id") REFERENCES "provider_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_orders" ADD CONSTRAINT "provider_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_orders" ADD CONSTRAINT "provider_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_orders" ADD CONSTRAINT "provider_orders_provider_service_id_fkey" FOREIGN KEY ("provider_service_id") REFERENCES "provider_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_order_attempts" ADD CONSTRAINT "provider_order_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_order_attempts" ADD CONSTRAINT "provider_order_attempts_provider_order_record_id_fkey" FOREIGN KEY ("provider_order_record_id") REFERENCES "provider_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_order_attempts" ADD CONSTRAINT "provider_order_attempts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_order_attempts" ADD CONSTRAINT "provider_order_attempts_provider_service_id_fkey" FOREIGN KEY ("provider_service_id") REFERENCES "provider_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_jobs" ADD CONSTRAINT "provider_jobs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_jobs" ADD CONSTRAINT "provider_jobs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_jobs" ADD CONSTRAINT "provider_jobs_provider_order_id_fkey" FOREIGN KEY ("provider_order_id") REFERENCES "provider_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_operation_logs" ADD CONSTRAINT "provider_operation_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_operation_logs" ADD CONSTRAINT "provider_operation_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "provider_request_leases" ADD CONSTRAINT "provider_request_leases_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_balance_snapshots" ADD CONSTRAINT "provider_balance_snapshots_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
