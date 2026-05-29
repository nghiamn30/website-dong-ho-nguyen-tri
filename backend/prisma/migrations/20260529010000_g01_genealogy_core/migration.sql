CREATE TYPE "branch_status" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "calendar_type" AS ENUM ('SOLAR', 'LUNAR');
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');
CREATE TYPE "life_status" AS ENUM ('LIVING', 'DECEASED', 'UNKNOWN');
CREATE TYPE "relationship_type" AS ENUM ('FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'ADOPTED_CHILD');

CREATE TABLE "clans" (
  "id" UUID NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "history" TEXT,
  "founder_person_id" UUID,
  "logo_url" TEXT,
  "banner_url" TEXT,
  "ancestral_house_name" VARCHAR(180),
  "ancestral_house_address" TEXT,
  "contact_information" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "branches" (
  "id" UUID NOT NULL,
  "clan_id" UUID NOT NULL,
  "parent_branch_id" UUID,
  "name" VARCHAR(180) NOT NULL,
  "type" VARCHAR(80) NOT NULL DEFAULT 'Chi',
  "description" TEXT,
  "head_person_id" UUID,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "status" "branch_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "persons" (
  "id" UUID NOT NULL,
  "clan_id" UUID NOT NULL,
  "branch_id" UUID,
  "full_name" VARCHAR(180) NOT NULL,
  "common_name" VARCHAR(180),
  "gender" "gender" NOT NULL DEFAULT 'UNKNOWN',
  "avatar_url" TEXT,
  "generation_number" INTEGER,
  "birth_date" DATE,
  "birth_calendar_type" "calendar_type" NOT NULL DEFAULT 'SOLAR',
  "life_status" "life_status" NOT NULL DEFAULT 'LIVING',
  "is_branch_head" BOOLEAN NOT NULL DEFAULT false,
  "biography" TEXT,
  "hometown" VARCHAR(180),
  "current_location" VARCHAR(180),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relationships" (
  "id" UUID NOT NULL,
  "person_1_id" UUID NOT NULL,
  "person_2_id" UUID NOT NULL,
  "relationship_type" "relationship_type" NOT NULL,
  "start_date" DATE,
  "end_date" DATE,
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "clans_founder_person_id_idx" ON "clans"("founder_person_id");
CREATE INDEX "branches_clan_id_idx" ON "branches"("clan_id");
CREATE INDEX "branches_parent_branch_id_idx" ON "branches"("parent_branch_id");
CREATE INDEX "branches_head_person_id_idx" ON "branches"("head_person_id");
CREATE INDEX "branches_status_idx" ON "branches"("status");
CREATE INDEX "persons_clan_id_idx" ON "persons"("clan_id");
CREATE INDEX "persons_branch_id_idx" ON "persons"("branch_id");
CREATE INDEX "persons_full_name_idx" ON "persons"("full_name");
CREATE INDEX "persons_generation_number_idx" ON "persons"("generation_number");
CREATE INDEX "persons_is_branch_head_idx" ON "persons"("is_branch_head");
CREATE UNIQUE INDEX "relationships_person_1_id_person_2_id_relationship_type_key"
  ON "relationships"("person_1_id", "person_2_id", "relationship_type");
CREATE INDEX "relationships_person_1_id_idx" ON "relationships"("person_1_id");
CREATE INDEX "relationships_person_2_id_idx" ON "relationships"("person_2_id");
CREATE INDEX "relationships_relationship_type_idx" ON "relationships"("relationship_type");

ALTER TABLE "clans"
  ADD CONSTRAINT "clans_founder_person_id_fkey"
  FOREIGN KEY ("founder_person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "branches"
  ADD CONSTRAINT "branches_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branches"
  ADD CONSTRAINT "branches_parent_branch_id_fkey"
  FOREIGN KEY ("parent_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "branches"
  ADD CONSTRAINT "branches_head_person_id_fkey"
  FOREIGN KEY ("head_person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "persons"
  ADD CONSTRAINT "persons_clan_id_fkey"
  FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "persons"
  ADD CONSTRAINT "persons_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relationships"
  ADD CONSTRAINT "relationships_person_1_id_fkey"
  FOREIGN KEY ("person_1_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relationships"
  ADD CONSTRAINT "relationships_person_2_id_fkey"
  FOREIGN KEY ("person_2_id") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
