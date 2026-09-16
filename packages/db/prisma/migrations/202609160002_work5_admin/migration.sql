ALTER TABLE "service_categories" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "wallet_transactions" ADD COLUMN "admin_user_id" UUID, ADD COLUMN "reason" VARCHAR(255);
CREATE INDEX "wallet_transactions_admin_user_id_created_at_idx" ON "wallet_transactions"("admin_user_id", "created_at" DESC);
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "service_price_history" (
  "id" UUID NOT NULL,
  "service_id" VARCHAR(64) NOT NULL,
  "previous_rate_minor" BIGINT NOT NULL,
  "new_rate_minor" BIGINT NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "reason" VARCHAR(255),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_price_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "service_price_history_previous_rate_nonnegative" CHECK ("previous_rate_minor" >= 0),
  CONSTRAINT "service_price_history_new_rate_nonnegative" CHECK ("new_rate_minor" >= 0)
);
CREATE INDEX "service_price_history_service_id_created_at_idx" ON "service_price_history"("service_id", "created_at" DESC);
CREATE INDEX "service_price_history_admin_user_id_created_at_idx" ON "service_price_history"("admin_user_id", "created_at" DESC);
ALTER TABLE "service_price_history" ADD CONSTRAINT "service_price_history_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_price_history" ADD CONSTRAINT "service_price_history_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "admin_audit_logs" (
  "id" UUID NOT NULL,
  "admin_user_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" VARCHAR(128) NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ip_address" VARCHAR(64),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at" DESC);
CREATE INDEX "admin_audit_logs_admin_user_id_created_at_idx" ON "admin_audit_logs"("admin_user_id", "created_at" DESC);
CREATE INDEX "admin_audit_logs_action_created_at_idx" ON "admin_audit_logs"("action", "created_at" DESC);
CREATE INDEX "admin_audit_logs_entity_type_entity_id_created_at_idx" ON "admin_audit_logs"("entity_type", "entity_id", "created_at" DESC);
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "system_settings" (
  "id" VARCHAR(32) NOT NULL DEFAULT 'default',
  "site_name" VARCHAR(120) NOT NULL DEFAULT 'Tương Tác Pro',
  "support_email" VARCHAR(320) NOT NULL DEFAULT 'support@example.com',
  "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
  "minimum_deposit_minor" BIGINT NOT NULL DEFAULT 50000,
  "order_creation_enabled" BOOLEAN NOT NULL DEFAULT true,
  "support_enabled" BOOLEAN NOT NULL DEFAULT true,
  "updated_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "system_settings_minimum_deposit_nonnegative" CHECK ("minimum_deposit_minor" >= 0)
);
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
