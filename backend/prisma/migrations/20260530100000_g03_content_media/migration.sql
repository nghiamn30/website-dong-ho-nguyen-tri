-- Giai doan 3: cong thong tin, bai viet, album va tu lieu dong ho.

CREATE TYPE "content_status" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
CREATE TYPE "content_visibility" AS ENUM ('PUBLIC', 'MEMBERS', 'BRANCH', 'LEADERSHIP');
CREATE TYPE "media_type" AS ENUM ('IMAGE', 'DOCUMENT', 'OTHER');

CREATE TABLE "categories" (
  "id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
  "id" UUID NOT NULL,
  "clan_id" UUID NOT NULL,
  "branch_id" UUID,
  "category_id" UUID,
  "related_event_id" UUID,
  "title" VARCHAR(220) NOT NULL,
  "slug" VARCHAR(240) NOT NULL,
  "summary" TEXT,
  "content" TEXT,
  "thumbnail_url" TEXT,
  "visibility_scope" "content_visibility" NOT NULL DEFAULT 'PUBLIC',
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "status" "content_status" NOT NULL DEFAULT 'DRAFT',
  "author_id" UUID,
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "albums" (
  "id" UUID NOT NULL,
  "clan_id" UUID NOT NULL,
  "branch_id" UUID,
  "related_event_id" UUID,
  "title" VARCHAR(220) NOT NULL,
  "slug" VARCHAR(240) NOT NULL,
  "description" TEXT,
  "cover_media_id" UUID,
  "visibility_scope" "content_visibility" NOT NULL DEFAULT 'PUBLIC',
  "status" "content_status" NOT NULL DEFAULT 'DRAFT',
  "created_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "media" (
  "id" UUID NOT NULL,
  "album_id" UUID,
  "person_id" UUID,
  "event_id" UUID,
  "file_type" "media_type" NOT NULL DEFAULT 'IMAGE',
  "file_url" TEXT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(180) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "caption" TEXT,
  "uploaded_by" UUID,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "page_content" (
  "id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "page_content_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_active_idx" ON "categories"("active");
CREATE INDEX "categories_display_order_idx" ON "categories"("display_order");

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE INDEX "posts_clan_id_idx" ON "posts"("clan_id");
CREATE INDEX "posts_branch_id_idx" ON "posts"("branch_id");
CREATE INDEX "posts_category_id_idx" ON "posts"("category_id");
CREATE INDEX "posts_related_event_id_idx" ON "posts"("related_event_id");
CREATE INDEX "posts_status_idx" ON "posts"("status");
CREATE INDEX "posts_visibility_scope_idx" ON "posts"("visibility_scope");
CREATE INDEX "posts_is_pinned_idx" ON "posts"("is_pinned");
CREATE INDEX "posts_published_at_idx" ON "posts"("published_at");

CREATE UNIQUE INDEX "albums_slug_key" ON "albums"("slug");
CREATE INDEX "albums_clan_id_idx" ON "albums"("clan_id");
CREATE INDEX "albums_branch_id_idx" ON "albums"("branch_id");
CREATE INDEX "albums_related_event_id_idx" ON "albums"("related_event_id");
CREATE INDEX "albums_status_idx" ON "albums"("status");
CREATE INDEX "albums_visibility_scope_idx" ON "albums"("visibility_scope");

CREATE INDEX "media_album_id_idx" ON "media"("album_id");
CREATE INDEX "media_person_id_idx" ON "media"("person_id");
CREATE INDEX "media_event_id_idx" ON "media"("event_id");
CREATE INDEX "media_file_type_idx" ON "media"("file_type");
CREATE INDEX "media_deleted_at_idx" ON "media"("deleted_at");

CREATE UNIQUE INDEX "page_content_key_key" ON "page_content"("key");

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_related_event_id_fkey"
  FOREIGN KEY ("related_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_related_event_id_fkey"
  FOREIGN KEY ("related_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "albums"
  ADD CONSTRAINT "albums_cover_media_id_fkey"
  FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media"
  ADD CONSTRAINT "media_album_id_fkey"
  FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media"
  ADD CONSTRAINT "media_person_id_fkey"
  FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media"
  ADD CONSTRAINT "media_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "media"
  ADD CONSTRAINT "media_uploaded_by_fkey"
  FOREIGN KEY ("uploaded_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "page_content"
  ADD CONSTRAINT "page_content_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
