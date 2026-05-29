CREATE TABLE "permissions" (
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "roles" (
  "code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "app_users" (
  "id" UUID NOT NULL,
  "employee_code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "role_code" VARCHAR(40) NOT NULL,
  "permission_code" VARCHAR(80) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_code", "permission_code")
);

CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL,
  "role_code" VARCHAR(40) NOT NULL,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_code")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "action" VARCHAR(120) NOT NULL,
  "actor_user_id" UUID,
  "employee_code" VARCHAR(40),
  "success" BOOLEAN NOT NULL,
  "important" BOOLEAN NOT NULL DEFAULT false,
  "ip_address" VARCHAR(80),
  "user_agent" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_employee_code_key" ON "app_users"("employee_code");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_role_code_fkey"
  FOREIGN KEY ("role_code") REFERENCES "roles"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_permission_code_fkey"
  FOREIGN KEY ("permission_code") REFERENCES "permissions"("code") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_role_code_fkey"
  FOREIGN KEY ("role_code") REFERENCES "roles"("code") ON DELETE CASCADE ON UPDATE CASCADE;
