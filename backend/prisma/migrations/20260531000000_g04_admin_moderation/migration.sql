-- Giai doan 4: quan tri nang cao, kiem duyet va an toan du lieu.

CREATE TYPE "change_request_type" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE "change_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Mo rong audit log: ghi du lieu truoc/sau cho thao tac quan trong.
ALTER TABLE "audit_logs" ADD COLUMN "entity_type" VARCHAR(80);
ALTER TABLE "audit_logs" ADD COLUMN "entity_id" VARCHAR(80);
ALTER TABLE "audit_logs" ADD COLUMN "before_data" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "after_data" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN "reason" TEXT;

CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs" ("entity_type", "entity_id");

-- Phan quyen theo chi/nhanh cho truong chi.
CREATE TABLE "branch_scoped_roles" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role_code" VARCHAR(40) NOT NULL,
  "branch_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "branch_scoped_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "branch_scoped_roles_user_id_role_code_branch_id_key"
  ON "branch_scoped_roles" ("user_id", "role_code", "branch_id");
CREATE INDEX "branch_scoped_roles_user_id_idx" ON "branch_scoped_roles" ("user_id");
CREATE INDEX "branch_scoped_roles_branch_id_idx" ON "branch_scoped_roles" ("branch_id");

ALTER TABLE "branch_scoped_roles"
  ADD CONSTRAINT "branch_scoped_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_scoped_roles"
  ADD CONSTRAINT "branch_scoped_roles_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Quy trinh de xuat chinh sua.
CREATE TABLE "change_requests" (
  "id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" VARCHAR(80),
  "request_type" "change_request_type" NOT NULL,
  "proposed_data" JSONB NOT NULL,
  "reason" TEXT,
  "status" "change_request_status" NOT NULL DEFAULT 'PENDING',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "review_note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "change_requests_status_idx" ON "change_requests" ("status");
CREATE INDEX "change_requests_requested_by_idx" ON "change_requests" ("requested_by");
CREATE INDEX "change_requests_entity_type_entity_id_idx" ON "change_requests" ("entity_type", "entity_id");
CREATE INDEX "change_requests_created_at_idx" ON "change_requests" ("created_at");

ALTER TABLE "change_requests"
  ADD CONSTRAINT "change_requests_requested_by_fkey"
  FOREIGN KEY ("requested_by") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "change_requests"
  ADD CONSTRAINT "change_requests_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "app_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
