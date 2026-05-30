-- Giai đoạn 1: dữ liệu lõi gia phả dòng họ Nguyễn Trí.
-- Thiết kế theo docs/thiet-ke-database-gia-pha-nguyen-tri.md.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "life_status" AS ENUM ('LIVING', 'DECEASED');
CREATE TYPE "calendar_type" AS ENUM ('SOLAR', 'LUNAR');
CREATE TYPE "branch_status" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "parent_role" AS ENUM ('FATHER', 'MOTHER');
CREATE TYPE "parent_relation_type" AS ENUM ('BIOLOGICAL', 'ADOPTIVE');
CREATE TYPE "marriage_status" AS ENUM ('ACTIVE', 'DIVORCED', 'WIDOWED', 'ENDED', 'UNKNOWN');
CREATE TYPE "leadership_transfer_type" AS ENUM ('INITIAL', 'MANUAL', 'AUTO_DEATH', 'AUTO_SENIOR_SON');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- clans: cấu hình dòng họ, ràng buộc singleton.
CREATE TABLE "clans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "singleton_key" BOOLEAN NOT NULL DEFAULT TRUE,
  "name" VARCHAR(180) NOT NULL DEFAULT 'Dòng họ Nguyễn Trí',
  "description" TEXT,
  "history" TEXT,
  "founder_person_id" UUID,
  "logo_url" TEXT,
  "banner_url" TEXT,
  "ancestral_house_name" VARCHAR(180),
  "ancestral_house_address" TEXT,
  "contact_information" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "clans_singleton_key_check" CHECK ("singleton_key"),
  CONSTRAINT "clans_singleton_key_unique" UNIQUE ("singleton_key")
);

CREATE TRIGGER clans_set_updated_at
BEFORE UPDATE ON "clans"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- branches: chi/phái/ngành/nhánh nhiều tầng.
CREATE TABLE "branches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clan_id" UUID NOT NULL,
  "parent_branch_id" UUID,
  "name" VARCHAR(180) NOT NULL,
  "type" VARCHAR(80) NOT NULL DEFAULT 'Chi',
  "description" TEXT,
  "head_person_id" UUID,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "status" "branch_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "branches_display_order_check" CHECK ("display_order" >= 0),
  CONSTRAINT "branches_not_own_parent_check" CHECK ("parent_branch_id" IS NULL OR "parent_branch_id" <> "id"),
  CONSTRAINT "branches_id_clan_unique" UNIQUE ("id", "clan_id"),
  CONSTRAINT "branches_clan_fkey"
    FOREIGN KEY ("clan_id") REFERENCES "clans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "branches"
  ADD CONSTRAINT "branches_parent_same_clan_fkey"
  FOREIGN KEY ("parent_branch_id", "clan_id") REFERENCES "branches"("id", "clan_id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX "branches_root_name_unique"
  ON "branches"("clan_id", "name")
  WHERE "parent_branch_id" IS NULL;

CREATE UNIQUE INDEX "branches_child_name_unique"
  ON "branches"("clan_id", "parent_branch_id", "name")
  WHERE "parent_branch_id" IS NOT NULL;

CREATE INDEX "branches_clan_idx" ON "branches"("clan_id");
CREATE INDEX "branches_parent_branch_idx" ON "branches"("parent_branch_id");
CREATE INDEX "branches_status_idx" ON "branches"("status");
CREATE INDEX "branches_display_order_idx" ON "branches"("display_order");

CREATE TRIGGER branches_set_updated_at
BEFORE UPDATE ON "branches"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- persons: hồ sơ thành viên và phối ngẫu.
CREATE TABLE "persons" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clan_id" UUID NOT NULL,
  "branch_id" UUID,
  "full_name" VARCHAR(180) NOT NULL,
  "common_name" VARCHAR(180),
  "gender" "gender" NOT NULL,
  "is_clan_member" BOOLEAN NOT NULL DEFAULT TRUE,
  "avatar_url" TEXT,
  "generation_number" INTEGER,
  "display_order" INTEGER NOT NULL DEFAULT 0,

  "birth_date_source" "calendar_type",
  "birth_solar_date" DATE,
  "birth_lunar_year" SMALLINT,
  "birth_lunar_month" SMALLINT,
  "birth_lunar_day" SMALLINT,
  "birth_lunar_is_leap_month" BOOLEAN NOT NULL DEFAULT FALSE,

  "life_status" "life_status" NOT NULL DEFAULT 'LIVING',
  "death_date_source" "calendar_type",
  "death_solar_date" DATE,
  "death_lunar_year" SMALLINT,
  "death_lunar_month" SMALLINT,
  "death_lunar_day" SMALLINT,
  "death_lunar_is_leap_month" BOOLEAN NOT NULL DEFAULT FALSE,

  "death_anniversary_calendar" "calendar_type",
  "death_anniversary_month" SMALLINT,
  "death_anniversary_day" SMALLINT,
  "death_anniversary_is_leap_month" BOOLEAN NOT NULL DEFAULT FALSE,

  "burial_place" TEXT,
  "burial_map_url" TEXT,
  "grave_image_url" TEXT,
  "death_note" TEXT,

  "biography" TEXT,
  "hometown" VARCHAR(180),
  "current_location" VARCHAR(180),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "persons_generation_number_check" CHECK ("generation_number" IS NULL OR "generation_number" > 0),
  CONSTRAINT "persons_display_order_check" CHECK ("display_order" >= 0),
  CONSTRAINT "persons_birth_lunar_month_check" CHECK ("birth_lunar_month" IS NULL OR "birth_lunar_month" BETWEEN 1 AND 12),
  CONSTRAINT "persons_birth_lunar_day_check" CHECK ("birth_lunar_day" IS NULL OR "birth_lunar_day" BETWEEN 1 AND 30),
  CONSTRAINT "persons_death_lunar_month_check" CHECK ("death_lunar_month" IS NULL OR "death_lunar_month" BETWEEN 1 AND 12),
  CONSTRAINT "persons_death_lunar_day_check" CHECK ("death_lunar_day" IS NULL OR "death_lunar_day" BETWEEN 1 AND 30),
  CONSTRAINT "persons_anniversary_month_check" CHECK ("death_anniversary_month" IS NULL OR "death_anniversary_month" BETWEEN 1 AND 12),
  CONSTRAINT "persons_anniversary_day_check" CHECK ("death_anniversary_day" IS NULL OR "death_anniversary_day" BETWEEN 1 AND 31),

  CONSTRAINT "persons_birth_lunar_complete_check" CHECK (
    ("birth_lunar_year" IS NULL AND "birth_lunar_month" IS NULL AND "birth_lunar_day" IS NULL AND "birth_lunar_is_leap_month" = FALSE)
    OR ("birth_lunar_year" IS NOT NULL AND "birth_lunar_month" IS NOT NULL AND "birth_lunar_day" IS NOT NULL)
  ),
  CONSTRAINT "persons_death_lunar_complete_check" CHECK (
    ("death_lunar_year" IS NULL AND "death_lunar_month" IS NULL AND "death_lunar_day" IS NULL AND "death_lunar_is_leap_month" = FALSE)
    OR ("death_lunar_year" IS NOT NULL AND "death_lunar_month" IS NOT NULL AND "death_lunar_day" IS NOT NULL)
  ),
  CONSTRAINT "persons_birth_source_check" CHECK (
    "birth_date_source" IS NULL
    OR ("birth_date_source" = 'SOLAR' AND "birth_solar_date" IS NOT NULL)
    OR ("birth_date_source" = 'LUNAR' AND "birth_lunar_year" IS NOT NULL AND "birth_lunar_month" IS NOT NULL AND "birth_lunar_day" IS NOT NULL)
  ),
  CONSTRAINT "persons_death_source_check" CHECK (
    "death_date_source" IS NULL
    OR ("death_date_source" = 'SOLAR' AND "death_solar_date" IS NOT NULL)
    OR ("death_date_source" = 'LUNAR' AND "death_lunar_year" IS NOT NULL AND "death_lunar_month" IS NOT NULL AND "death_lunar_day" IS NOT NULL)
  ),
  CONSTRAINT "persons_anniversary_complete_check" CHECK (
    ("death_anniversary_calendar" IS NULL AND "death_anniversary_month" IS NULL AND "death_anniversary_day" IS NULL AND "death_anniversary_is_leap_month" = FALSE)
    OR ("death_anniversary_calendar" IS NOT NULL AND "death_anniversary_month" IS NOT NULL AND "death_anniversary_day" IS NOT NULL)
  ),
  CONSTRAINT "persons_anniversary_leap_only_lunar_check" CHECK (
    "death_anniversary_is_leap_month" = FALSE OR "death_anniversary_calendar" = 'LUNAR'
  ),
  CONSTRAINT "persons_living_has_no_death_data_check" CHECK (
    "life_status" = 'DECEASED'
    OR (
      "death_date_source" IS NULL
      AND "death_solar_date" IS NULL
      AND "death_lunar_year" IS NULL
      AND "death_lunar_month" IS NULL
      AND "death_lunar_day" IS NULL
      AND "death_lunar_is_leap_month" = FALSE
      AND "death_anniversary_calendar" IS NULL
      AND "death_anniversary_month" IS NULL
      AND "death_anniversary_day" IS NULL
      AND "death_anniversary_is_leap_month" = FALSE
      AND "burial_place" IS NULL
      AND "burial_map_url" IS NULL
      AND "grave_image_url" IS NULL
      AND "death_note" IS NULL
    )
  ),
  CONSTRAINT "persons_death_after_birth_check" CHECK (
    "birth_solar_date" IS NULL OR "death_solar_date" IS NULL OR "death_solar_date" >= "birth_solar_date"
  ),
  CONSTRAINT "persons_id_clan_unique" UNIQUE ("id", "clan_id"),
  CONSTRAINT "persons_branch_id_id_unique" UNIQUE ("branch_id", "id"),
  CONSTRAINT "persons_clan_fkey"
    FOREIGN KEY ("clan_id") REFERENCES "clans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "persons_branch_same_clan_fkey"
    FOREIGN KEY ("branch_id", "clan_id") REFERENCES "branches"("id", "clan_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE "clans"
  ADD CONSTRAINT "clans_founder_same_clan_fkey"
  FOREIGN KEY ("id", "founder_person_id") REFERENCES "persons"("clan_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "branches"
  ADD CONSTRAINT "branches_head_same_branch_fkey"
  FOREIGN KEY ("id", "head_person_id") REFERENCES "persons"("branch_id", "id")
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX "branches_one_head_role_per_person_idx"
  ON "branches"("head_person_id")
  WHERE "head_person_id" IS NOT NULL;

CREATE INDEX "persons_clan_idx" ON "persons"("clan_id");
CREATE INDEX "persons_branch_idx" ON "persons"("branch_id");
CREATE INDEX "persons_full_name_idx" ON "persons"("full_name");
CREATE INDEX "persons_generation_idx" ON "persons"("generation_number");
CREATE INDEX "persons_gender_idx" ON "persons"("gender");
CREATE INDEX "persons_life_status_idx" ON "persons"("life_status");
CREATE INDEX "persons_birth_solar_idx" ON "persons"("birth_solar_date");
CREATE INDEX "persons_death_solar_idx" ON "persons"("death_solar_date");
CREATE INDEX "persons_death_anniversary_lunar_idx"
  ON "persons"("death_anniversary_month", "death_anniversary_day")
  WHERE "death_anniversary_calendar" = 'LUNAR';

CREATE TRIGGER persons_set_updated_at
BEFORE UPDATE ON "persons"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- parent_child_relations: cha/mẹ -> con theo một chiều chuẩn.
CREATE TABLE "parent_child_relations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clan_id" UUID NOT NULL,
  "parent_person_id" UUID NOT NULL,
  "child_person_id" UUID NOT NULL,
  "parent_role" "parent_role" NOT NULL,
  "relation_type" "parent_relation_type" NOT NULL DEFAULT 'BIOLOGICAL',
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "parent_child_not_self_check" CHECK ("parent_person_id" <> "child_person_id"),
  CONSTRAINT "parent_child_display_order_check" CHECK ("display_order" >= 0),
  CONSTRAINT "parent_child_unique_type_per_pair" UNIQUE ("parent_person_id", "child_person_id", "relation_type"),
  CONSTRAINT "parent_child_one_parent_per_role_type" UNIQUE ("child_person_id", "parent_role", "relation_type"),
  CONSTRAINT "parent_child_clan_fkey"
    FOREIGN KEY ("clan_id") REFERENCES "clans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "parent_child_parent_same_clan_fkey"
    FOREIGN KEY ("parent_person_id", "clan_id") REFERENCES "persons"("id", "clan_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "parent_child_child_same_clan_fkey"
    FOREIGN KEY ("child_person_id", "clan_id") REFERENCES "persons"("id", "clan_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "parent_child_parent_idx" ON "parent_child_relations"("parent_person_id");
CREATE INDEX "parent_child_child_idx" ON "parent_child_relations"("child_person_id");
CREATE INDEX "parent_child_clan_idx" ON "parent_child_relations"("clan_id");
CREATE INDEX "parent_child_relation_type_idx" ON "parent_child_relations"("relation_type");

CREATE OR REPLACE FUNCTION assert_parent_child_rules()
RETURNS trigger AS $$
DECLARE
  v_parent_gender gender;
  v_cycle_found BOOLEAN;
BEGIN
  SELECT gender INTO v_parent_gender
  FROM persons
  WHERE id = NEW.parent_person_id;

  IF NEW.parent_role = 'FATHER' AND v_parent_gender <> 'MALE' THEN
    RAISE EXCEPTION 'parent_person_id % must be MALE for FATHER relation', NEW.parent_person_id;
  END IF;

  IF NEW.parent_role = 'MOTHER' AND v_parent_gender <> 'FEMALE' THEN
    RAISE EXCEPTION 'parent_person_id % must be FEMALE for MOTHER relation', NEW.parent_person_id;
  END IF;

  WITH RECURSIVE descendants(person_id) AS (
    SELECT r.child_person_id
    FROM parent_child_relations r
    WHERE r.parent_person_id = NEW.child_person_id
      AND r.id <> NEW.id
    UNION
    SELECT r.child_person_id
    FROM parent_child_relations r
    JOIN descendants d ON d.person_id = r.parent_person_id
    WHERE r.id <> NEW.id
  )
  SELECT EXISTS (
    SELECT 1 FROM descendants WHERE person_id = NEW.parent_person_id
  ) INTO v_cycle_found;

  IF v_cycle_found THEN
    RAISE EXCEPTION 'parent-child relation would create a cycle';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parent_child_assert_rules
BEFORE INSERT OR UPDATE ON "parent_child_relations"
FOR EACH ROW EXECUTE FUNCTION assert_parent_child_rules();

CREATE TRIGGER parent_child_set_updated_at
BEFORE UPDATE ON "parent_child_relations"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- marriages: hôn nhân như thực thể riêng.
CREATE TABLE "marriages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clan_id" UUID NOT NULL,
  "husband_person_id" UUID NOT NULL,
  "wife_person_id" UUID NOT NULL,
  "status" "marriage_status" NOT NULL DEFAULT 'ACTIVE',
  "married_solar_date" DATE,
  "ended_solar_date" DATE,
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "marriages_not_self_check" CHECK ("husband_person_id" <> "wife_person_id"),
  CONSTRAINT "marriages_date_order_check" CHECK (
    "married_solar_date" IS NULL OR "ended_solar_date" IS NULL OR "ended_solar_date" >= "married_solar_date"
  ),
  CONSTRAINT "marriages_unique_pair" UNIQUE ("husband_person_id", "wife_person_id"),
  CONSTRAINT "marriages_clan_fkey"
    FOREIGN KEY ("clan_id") REFERENCES "clans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "marriages_husband_same_clan_fkey"
    FOREIGN KEY ("husband_person_id", "clan_id") REFERENCES "persons"("id", "clan_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "marriages_wife_same_clan_fkey"
    FOREIGN KEY ("wife_person_id", "clan_id") REFERENCES "persons"("id", "clan_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "marriages_clan_idx" ON "marriages"("clan_id");
CREATE INDEX "marriages_husband_idx" ON "marriages"("husband_person_id");
CREATE INDEX "marriages_wife_idx" ON "marriages"("wife_person_id");
CREATE INDEX "marriages_status_idx" ON "marriages"("status");

CREATE OR REPLACE FUNCTION assert_marriage_rules()
RETURNS trigger AS $$
DECLARE
  v_husband_gender gender;
  v_wife_gender gender;
BEGIN
  SELECT gender INTO v_husband_gender
  FROM persons
  WHERE id = NEW.husband_person_id;

  SELECT gender INTO v_wife_gender
  FROM persons
  WHERE id = NEW.wife_person_id;

  IF v_husband_gender <> 'MALE' THEN
    RAISE EXCEPTION 'husband_person_id % must be MALE', NEW.husband_person_id;
  END IF;

  IF v_wife_gender <> 'FEMALE' THEN
    RAISE EXCEPTION 'wife_person_id % must be FEMALE', NEW.wife_person_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marriages_assert_rules
BEFORE INSERT OR UPDATE ON "marriages"
FOR EACH ROW EXECUTE FUNCTION assert_marriage_rules();

CREATE TRIGGER marriages_set_updated_at
BEFORE UPDATE ON "marriages"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- branch_leadership_history: lịch sử chuyển trưởng chi/nhánh.
CREATE TABLE "branch_leadership_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL,
  "predecessor_person_id" UUID,
  "successor_person_id" UUID,
  "transfer_date" DATE NOT NULL DEFAULT CURRENT_DATE,
  "transfer_type" "leadership_transfer_type" NOT NULL,
  "reason" TEXT,
  "note" TEXT,
  "created_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "branch_leadership_has_person_check" CHECK (
    "predecessor_person_id" IS NOT NULL OR "successor_person_id" IS NOT NULL
  ),
  CONSTRAINT "branch_leadership_not_same_person_check" CHECK (
    "predecessor_person_id" IS NULL
    OR "successor_person_id" IS NULL
    OR "predecessor_person_id" <> "successor_person_id"
  ),
  CONSTRAINT "branch_leadership_branch_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "branch_leadership_predecessor_same_branch_fkey"
    FOREIGN KEY ("branch_id", "predecessor_person_id") REFERENCES "persons"("branch_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT "branch_leadership_successor_same_branch_fkey"
    FOREIGN KEY ("branch_id", "successor_person_id") REFERENCES "persons"("branch_id", "id")
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX "branch_leadership_branch_date_idx"
  ON "branch_leadership_history"("branch_id", "transfer_date" DESC, "created_at" DESC);
CREATE INDEX "branch_leadership_predecessor_idx"
  ON "branch_leadership_history"("predecessor_person_id");
CREATE INDEX "branch_leadership_successor_idx"
  ON "branch_leadership_history"("successor_person_id");
