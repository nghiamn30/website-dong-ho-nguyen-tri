-- Giai doan 2: nguoi da khuat, ngay gio va lich nhac.

-- Link an account to its person record (used for branch-scoped permissions).
ALTER TABLE "app_users" ADD COLUMN "person_id" UUID;
CREATE INDEX "app_users_person_id_idx" ON "app_users"("person_id");
ALTER TABLE "app_users"
  ADD CONSTRAINT "app_users_person_id_fkey"
  FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "recurrence_type" AS ENUM ('ANNUAL_LUNAR', 'ANNUAL_SOLAR');
CREATE TYPE "notification_scope" AS ENUM ('BRANCH', 'CLAN', 'CUSTOM');
CREATE TYPE "event_type" AS ENUM ('DEATH_ANNIVERSARY', 'ANCESTOR_ANNIVERSARY', 'CLAN_MEETING', 'GOOD_NEWS', 'SAD_NEWS', 'OTHER');
CREATE TYPE "event_source_type" AS ENUM ('AUTO_ANNIVERSARY', 'MANUAL');
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "event_visibility" AS ENUM ('CLAN', 'BRANCH');
CREATE TYPE "notification_channel" AS ENUM ('IN_APP', 'EMAIL');
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "death_anniversaries" (
  "id" UUID NOT NULL,
  "person_id" UUID NOT NULL,
  "lunar_day" SMALLINT NOT NULL,
  "lunar_month" SMALLINT NOT NULL,
  "is_leap_month" BOOLEAN NOT NULL DEFAULT false,
  "solar_date_cache" DATE,
  "solar_date_cache_year" SMALLINT,
  "recurrence_type" "recurrence_type" NOT NULL DEFAULT 'ANNUAL_LUNAR',
  "branch_scope_id" UUID,
  "notification_scope" "notification_scope" NOT NULL DEFAULT 'BRANCH',
  "notify_before_days" SMALLINT NOT NULL DEFAULT 7,
  "ceremony_note" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "death_anniversaries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "events" (
  "id" UUID NOT NULL,
  "clan_id" UUID NOT NULL,
  "branch_id" UUID,
  "source_type" "event_source_type" NOT NULL DEFAULT 'MANUAL',
  "source_id" UUID,
  "title" VARCHAR(200) NOT NULL,
  "event_type" "event_type" NOT NULL,
  "description" TEXT,
  "calendar_type" "calendar_type" NOT NULL DEFAULT 'SOLAR',
  "lunar_day" SMALLINT,
  "lunar_month" SMALLINT,
  "is_leap_month" BOOLEAN NOT NULL DEFAULT false,
  "start_datetime" TIMESTAMPTZ(6) NOT NULL,
  "end_datetime" TIMESTAMPTZ(6),
  "location" TEXT,
  "visibility_scope" "event_visibility" NOT NULL DEFAULT 'CLAN',
  "status" "event_status" NOT NULL DEFAULT 'PUBLISHED',
  "created_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "event_id" UUID,
  "channel" "notification_channel" NOT NULL DEFAULT 'IN_APP',
  "reminder_key" VARCHAR(200) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "read_at" TIMESTAMPTZ(6),
  "sent_at" TIMESTAMPTZ(6),
  "status" "notification_status" NOT NULL DEFAULT 'PENDING',
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_settings" (
  "user_id" UUID NOT NULL,
  "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_enabled" BOOLEAN NOT NULL DEFAULT false,
  "email" VARCHAR(200),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "death_anniversaries_person_id_idx" ON "death_anniversaries"("person_id");
CREATE INDEX "death_anniversaries_branch_scope_id_idx" ON "death_anniversaries"("branch_scope_id");
CREATE INDEX "death_anniversaries_active_idx" ON "death_anniversaries"("active");
CREATE INDEX "death_anniversaries_lunar_month_lunar_day_idx" ON "death_anniversaries"("lunar_month", "lunar_day");

CREATE INDEX "events_clan_id_idx" ON "events"("clan_id");
CREATE INDEX "events_branch_id_idx" ON "events"("branch_id");
CREATE INDEX "events_start_datetime_idx" ON "events"("start_datetime");
CREATE INDEX "events_status_idx" ON "events"("status");
CREATE INDEX "events_event_type_idx" ON "events"("event_type");
CREATE UNIQUE INDEX "events_source_type_source_id_start_datetime_key" ON "events"("source_type", "source_id", "start_datetime");

CREATE UNIQUE INDEX "notifications_reminder_key_key" ON "notifications"("reminder_key");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX "notifications_event_id_idx" ON "notifications"("event_id");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

ALTER TABLE "death_anniversaries"
  ADD CONSTRAINT "death_anniversaries_person_id_fkey"
  FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "death_anniversaries"
  ADD CONSTRAINT "death_anniversaries_branch_scope_id_fkey"
  FOREIGN KEY ("branch_scope_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events"
  ADD CONSTRAINT "events_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events"
  ADD CONSTRAINT "events_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_settings"
  ADD CONSTRAINT "notification_settings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
