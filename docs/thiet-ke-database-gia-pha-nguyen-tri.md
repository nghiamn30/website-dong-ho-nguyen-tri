# Thiết kế database gia phả dòng họ Nguyễn Trí

## 1. Đánh giá schema hiện tại

Schema hiện tại đã đủ để nhập dữ liệu lõi ban đầu, nhưng chưa đủ chặt cho nghiệp vụ gia phả lâu dài.

Nên giữ:

- `clans` như bảng cấu hình dòng họ, nhưng vì website chỉ phục vụ dòng họ Nguyễn Trí nên nên enforce một dòng duy nhất.
- `branches` để quản lý chi/phái/ngành/nhánh nhiều tầng.
- `persons` làm hồ sơ thành viên và phối ngẫu.
- `clans.founder_person_id` để xác định node gốc của cây gia phả.
- `branches.head_person_id` làm nguồn dữ liệu hiện tại cho trưởng chi/nhánh.

Nên sửa/xóa:

- Xóa `persons.is_branch_head`; đang trùng nguồn với `branches.head_person_id`.
- Xóa bảng `relationships` tổng quát hiện tại hoặc migrate thành bảng chuyên biệt. `person_1_id/person_2_id` không nói rõ chiều dữ liệu, dễ làm frontend dựng cây sai.
- Bỏ `RelationshipType.CHILD`. Quan hệ cha/mẹ/con chỉ nên lưu một chiều chuẩn: cha/mẹ -> con.
- Không lưu `SPOUSE` trong bảng quan hệ tổng quát nếu cần nhiều cuộc hôn nhân, trạng thái hôn nhân và con chung; nên tách `marriages`.
- Sửa `gender` chỉ còn `MALE`, `FEMALE`, không đặt default để bắt buộc người nhập chọn rõ.

Lỗi toàn vẹn dữ liệu có thể xảy ra hiện tại:

- Một quan hệ có thể nhập hai chiều: A `FATHER` B và B `CHILD` A.
- Vợ/chồng có thể bị lưu hai bản ghi ngược chiều: A `SPOUSE` B và B `SPOUSE` A.
- DB chưa chặn tự quan hệ với chính mình; service có chặn nhưng DB vẫn nên có constraint.
- `branches.head_person_id` có thể trỏ tới người ở chi khác; một người có thể đứng đầu nhiều chi.
- `persons.is_branch_head = true` nhưng không có branch nào trỏ tới người đó.
- Thủy tổ có thể không thuộc đúng dòng họ nếu sau này có nhiều dòng hoặc dữ liệu import sai.
- `birth_date + birth_calendar_type` chỉ lưu một loại ngày, không hỗ trợ đồng thời âm/dương và tháng nhuận.
- `life_status` không ràng buộc với ngày mất; người sống vẫn có thể có ngày mất nếu mở rộng thiếu check.

## 2. Quyết định thiết kế chính

### Lịch âm/dương

PostgreSQL `DATE` chỉ biểu diễn lịch dương Gregorian, không nên nhét ngày âm vào `DATE`. Ngày âm nên lưu bằng bộ cột:

- `*_lunar_year`
- `*_lunar_month`
- `*_lunar_day`
- `*_lunar_is_leap_month`

Các trường đề xuất:

- `birth_solar_date`: ngày sinh dương, dùng để sort, tính tuổi, tìm theo khoảng ngày.
- `birth_lunar_year/month/day/is_leap_month`: ngày sinh âm, dùng để hiển thị theo truyền thống nếu được nhập hoặc quy đổi.
- `death_solar_date`: ngày mất dương, dùng để thống kê và đối chiếu thời gian.
- `death_lunar_year/month/day/is_leap_month`: ngày mất âm, dùng làm mặc định cho ngày giỗ.
- `death_anniversary_calendar/month/day/is_leap_month`: ngày giỗ riêng nếu không lấy đúng ngày mất.
- `birth_date_source`, `death_date_source`: cho biết ngày nào là dữ liệu gốc do người nhập cung cấp. Trường còn lại có thể là dữ liệu quy đổi phục vụ tra cứu/hiển thị.

Quy tắc hiển thị/ngày giỗ:

- Khi hiển thị hồ sơ, ưu tiên ngày theo `*_date_source`, sau đó hiển thị ngày quy đổi nếu có.
- Khi tính giỗ, ưu tiên `death_anniversary_*` nếu có.
- Nếu không có ngày giỗ riêng, dùng `death_lunar_month/day/is_leap_month`.
- Nếu chỉ có `death_solar_date`, service lịch phải quy đổi sang ngày âm theo từng năm, không ghi đè dữ liệu gốc.

### Giới tính

`gender` chỉ gồm `MALE`, `FEMALE`.

Ảnh hưởng nhập liệu:

- Form tạo thành viên phải bắt buộc chọn giới tính, không dùng default `UNKNOWN`.
- Dữ liệu lịch sử chưa rõ giới tính phải được xác minh trước khi lưu hồ sơ chính, hoặc lưu ở trạng thái nháp ngoài bảng `persons`.
- Constraint/trigger có thể dùng giới tính để kiểm tra cha là nam, mẹ là nữ, chồng là nam, vợ là nữ.

### Người đã mất và `life_status`

Không nên suy ra hoàn toàn từ ngày mất, vì thực tế có nhiều người đã mất nhưng chưa rõ ngày. Nên giữ `life_status` với hai giá trị `LIVING`, `DECEASED`.

Quy tắc:

- `life_status` bắt buộc.
- Ngày mất âm/dương, ngày giỗ riêng, nơi an táng là tùy chọn.
- Người sống không được có ngày mất, ngày giỗ, nơi an táng.
- Người đã mất có thể chưa có ngày mất nếu gia phả chưa xác minh.

### Quan hệ cha/mẹ/con

Không dùng `person_1_id/person_2_id`. Bảng chuẩn là `parent_child_relations`.

Chiều dữ liệu duy nhất:

```text
parent_person_id -> child_person_id
```

Không lưu chiều ngược lại. Frontend suy ra:

- Con của A: các dòng có `parent_person_id = A`.
- Cha/mẹ của B: các dòng có `child_person_id = B`.
- Anh/chị/em: những người có chung cha hoặc mẹ.
- Con nuôi: `relation_type = ADOPTIVE`.

### Quan hệ cha/mẹ ruột, cha/mẹ nuôi, con nuôi

Không cần enum `FATHER`, `MOTHER`, `CHILD`, `ADOPTED_CHILD` trong bảng quan hệ tổng quát. Mô hình rõ hơn:

- `parent_role`: `FATHER`, `MOTHER`.
- `relation_type`: `BIOLOGICAL`, `ADOPTIVE`.

Như vậy:

- Cha ruột: `parent_role = FATHER`, `relation_type = BIOLOGICAL`.
- Mẹ ruột: `parent_role = MOTHER`, `relation_type = BIOLOGICAL`.
- Cha nuôi: `parent_role = FATHER`, `relation_type = ADOPTIVE`.
- Mẹ nuôi: `parent_role = MOTHER`, `relation_type = ADOPTIVE`.
- Con nuôi được suy ra từ dòng `ADOPTIVE` nhìn từ phía `child_person_id`.

### Quan hệ vợ/chồng

Nên tách `marriages`, không dùng `SPOUSE` trong `relationships`.

Lý do:

- Không có bản ghi ngược chiều.
- Quản lý rõ `husband_person_id`, `wife_person_id`.
- Một người có thể có nhiều cuộc hôn nhân.
- Có trạng thái hôn nhân, ngày bắt đầu/kết thúc, ghi chú.
- Con chung có thể suy ra từ bảng cha/mẹ/con: con có cha ruột là chồng và mẹ ruột là vợ.

Nếu sau này cần quản lý con riêng/con chung theo từng cuộc hôn nhân vượt ngoài suy luận cha mẹ, có thể bổ sung bảng `marriage_children`, nhưng không nên thêm khi chưa có nghiệp vụ rõ vì dễ trùng nguồn với `parent_child_relations`.

### Thủy tổ và `clans`

Vẫn giữ:

- `clans.founder_person_id`
- `persons.clan_id`

Đây là vòng tham chiếu có kiểm soát. Flow đúng:

1. Tạo clan không có `founder_person_id`.
2. Tạo person thủy tổ với `clan_id` của clan.
3. Cập nhật `clans.founder_person_id`.

Ràng buộc DB cần đảm bảo thủy tổ thuộc đúng dòng họ bằng composite FK `(id, founder_person_id) -> persons(clan_id, id)`.

Vì website chỉ dành cho dòng họ Nguyễn Trí, `clans` nên là bảng singleton: thêm `singleton_key boolean unique check`.

### Trưởng chi/nhánh

Nguồn dữ liệu chính duy nhất: `branches.head_person_id`.

Không lưu `persons.is_branch_head`.

Ràng buộc:

- Một branch chỉ có một trưởng branch: tự nhiên do một cột `head_person_id`.
- Một người không đứng đầu nhiều branch: unique partial index trên `branches(head_person_id)`.
- Trưởng branch phải thuộc branch đó: composite FK `(id, head_person_id) -> persons(branch_id, id)`.
- Lịch sử chuyển giao lưu ở `branch_leadership_history`.

Chuyển quyền tự động khi mất là nghiệp vụ service:

- Khi khai báo trưởng chi đã mất, service tìm con trai ruột còn sống của trưởng chi.
- Ưu tiên theo `birth_solar_date`, sau đó `display_order` trong quan hệ cha con, sau đó `created_at`.
- Nếu không tìm được ứng viên chắc chắn, để trống hoặc yêu cầu chuyển thủ công.
- Mọi lần chuyển phải insert lịch sử và update `branches.head_person_id` trong cùng transaction.

## 3. PostgreSQL schema đề xuất

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE gender AS ENUM ('MALE', 'FEMALE');
CREATE TYPE life_status AS ENUM ('LIVING', 'DECEASED');
CREATE TYPE calendar_type AS ENUM ('SOLAR', 'LUNAR');
CREATE TYPE branch_status AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE parent_role AS ENUM ('FATHER', 'MOTHER');
CREATE TYPE parent_relation_type AS ENUM ('BIOLOGICAL', 'ADOPTIVE');
CREATE TYPE marriage_status AS ENUM ('ACTIVE', 'DIVORCED', 'WIDOWED', 'ENDED', 'UNKNOWN');
CREATE TYPE leadership_transfer_type AS ENUM ('INITIAL', 'MANUAL', 'AUTO_DEATH', 'AUTO_SENIOR_SON');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key BOOLEAN NOT NULL DEFAULT TRUE,
  name VARCHAR(180) NOT NULL DEFAULT 'Dòng họ Nguyễn Trí',
  description TEXT,
  history TEXT,
  founder_person_id UUID,
  logo_url TEXT,
  banner_url TEXT,
  ancestral_house_name VARCHAR(180),
  ancestral_house_address TEXT,
  contact_information TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT clans_singleton_key_check CHECK (singleton_key),
  CONSTRAINT clans_singleton_key_unique UNIQUE (singleton_key)
);

CREATE TRIGGER clans_set_updated_at
BEFORE UPDATE ON clans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL,
  parent_branch_id UUID,
  name VARCHAR(180) NOT NULL,
  type VARCHAR(80) NOT NULL DEFAULT 'Chi',
  description TEXT,
  head_person_id UUID,
  display_order INTEGER NOT NULL DEFAULT 0,
  status branch_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT branches_display_order_check CHECK (display_order >= 0),
  CONSTRAINT branches_not_own_parent_check CHECK (parent_branch_id IS NULL OR parent_branch_id <> id),
  CONSTRAINT branches_id_clan_unique UNIQUE (id, clan_id),
  CONSTRAINT branches_clan_fkey
    FOREIGN KEY (clan_id) REFERENCES clans(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE branches
  ADD CONSTRAINT branches_parent_same_clan_fkey
  FOREIGN KEY (parent_branch_id, clan_id) REFERENCES branches(id, clan_id)
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX branches_root_name_unique
  ON branches(clan_id, name)
  WHERE parent_branch_id IS NULL;

CREATE UNIQUE INDEX branches_child_name_unique
  ON branches(clan_id, parent_branch_id, name)
  WHERE parent_branch_id IS NOT NULL;

CREATE INDEX branches_clan_idx ON branches(clan_id);
CREATE INDEX branches_parent_branch_idx ON branches(parent_branch_id);
CREATE INDEX branches_status_idx ON branches(status);
CREATE INDEX branches_display_order_idx ON branches(display_order);

CREATE TRIGGER branches_set_updated_at
BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL,
  branch_id UUID,
  full_name VARCHAR(180) NOT NULL,
  common_name VARCHAR(180),
  gender gender NOT NULL,
  is_clan_member BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT,
  generation_number INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,

  birth_date_source calendar_type,
  birth_solar_date DATE,
  birth_lunar_year SMALLINT,
  birth_lunar_month SMALLINT,
  birth_lunar_day SMALLINT,
  birth_lunar_is_leap_month BOOLEAN NOT NULL DEFAULT FALSE,

  life_status life_status NOT NULL DEFAULT 'LIVING',
  death_date_source calendar_type,
  death_solar_date DATE,
  death_lunar_year SMALLINT,
  death_lunar_month SMALLINT,
  death_lunar_day SMALLINT,
  death_lunar_is_leap_month BOOLEAN NOT NULL DEFAULT FALSE,

  death_anniversary_calendar calendar_type,
  death_anniversary_month SMALLINT,
  death_anniversary_day SMALLINT,
  death_anniversary_is_leap_month BOOLEAN NOT NULL DEFAULT FALSE,

  burial_place TEXT,
  burial_map_url TEXT,
  grave_image_url TEXT,
  death_note TEXT,

  biography TEXT,
  hometown VARCHAR(180),
  current_location VARCHAR(180),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT persons_generation_number_check CHECK (generation_number IS NULL OR generation_number > 0),
  CONSTRAINT persons_display_order_check CHECK (display_order >= 0),
  CONSTRAINT persons_birth_lunar_month_check CHECK (birth_lunar_month IS NULL OR birth_lunar_month BETWEEN 1 AND 12),
  CONSTRAINT persons_birth_lunar_day_check CHECK (birth_lunar_day IS NULL OR birth_lunar_day BETWEEN 1 AND 30),
  CONSTRAINT persons_death_lunar_month_check CHECK (death_lunar_month IS NULL OR death_lunar_month BETWEEN 1 AND 12),
  CONSTRAINT persons_death_lunar_day_check CHECK (death_lunar_day IS NULL OR death_lunar_day BETWEEN 1 AND 30),
  CONSTRAINT persons_anniversary_month_check CHECK (death_anniversary_month IS NULL OR death_anniversary_month BETWEEN 1 AND 12),
  CONSTRAINT persons_anniversary_day_check CHECK (death_anniversary_day IS NULL OR death_anniversary_day BETWEEN 1 AND 31),

  CONSTRAINT persons_birth_lunar_complete_check CHECK (
    (birth_lunar_year IS NULL AND birth_lunar_month IS NULL AND birth_lunar_day IS NULL AND birth_lunar_is_leap_month = FALSE)
    OR (birth_lunar_year IS NOT NULL AND birth_lunar_month IS NOT NULL AND birth_lunar_day IS NOT NULL)
  ),
  CONSTRAINT persons_death_lunar_complete_check CHECK (
    (death_lunar_year IS NULL AND death_lunar_month IS NULL AND death_lunar_day IS NULL AND death_lunar_is_leap_month = FALSE)
    OR (death_lunar_year IS NOT NULL AND death_lunar_month IS NOT NULL AND death_lunar_day IS NOT NULL)
  ),
  CONSTRAINT persons_birth_source_check CHECK (
    birth_date_source IS NULL
    OR (birth_date_source = 'SOLAR' AND birth_solar_date IS NOT NULL)
    OR (birth_date_source = 'LUNAR' AND birth_lunar_year IS NOT NULL AND birth_lunar_month IS NOT NULL AND birth_lunar_day IS NOT NULL)
  ),
  CONSTRAINT persons_death_source_check CHECK (
    death_date_source IS NULL
    OR (death_date_source = 'SOLAR' AND death_solar_date IS NOT NULL)
    OR (death_date_source = 'LUNAR' AND death_lunar_year IS NOT NULL AND death_lunar_month IS NOT NULL AND death_lunar_day IS NOT NULL)
  ),
  CONSTRAINT persons_anniversary_complete_check CHECK (
    (death_anniversary_calendar IS NULL AND death_anniversary_month IS NULL AND death_anniversary_day IS NULL AND death_anniversary_is_leap_month = FALSE)
    OR (death_anniversary_calendar IS NOT NULL AND death_anniversary_month IS NOT NULL AND death_anniversary_day IS NOT NULL)
  ),
  CONSTRAINT persons_anniversary_leap_only_lunar_check CHECK (
    death_anniversary_is_leap_month = FALSE OR death_anniversary_calendar = 'LUNAR'
  ),
  CONSTRAINT persons_living_has_no_death_data_check CHECK (
    life_status = 'DECEASED'
    OR (
      death_date_source IS NULL
      AND death_solar_date IS NULL
      AND death_lunar_year IS NULL
      AND death_lunar_month IS NULL
      AND death_lunar_day IS NULL
      AND death_lunar_is_leap_month = FALSE
      AND death_anniversary_calendar IS NULL
      AND death_anniversary_month IS NULL
      AND death_anniversary_day IS NULL
      AND death_anniversary_is_leap_month = FALSE
      AND burial_place IS NULL
      AND burial_map_url IS NULL
      AND grave_image_url IS NULL
      AND death_note IS NULL
    )
  ),
  CONSTRAINT persons_death_after_birth_check CHECK (
    birth_solar_date IS NULL OR death_solar_date IS NULL OR death_solar_date >= birth_solar_date
  ),
  CONSTRAINT persons_id_clan_unique UNIQUE (id, clan_id),
  CONSTRAINT persons_branch_id_id_unique UNIQUE (branch_id, id),
  CONSTRAINT persons_clan_fkey
    FOREIGN KEY (clan_id) REFERENCES clans(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT persons_branch_same_clan_fkey
    FOREIGN KEY (branch_id, clan_id) REFERENCES branches(id, clan_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

ALTER TABLE clans
  ADD CONSTRAINT clans_founder_same_clan_fkey
  FOREIGN KEY (id, founder_person_id) REFERENCES persons(clan_id, id)
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE branches
  ADD CONSTRAINT branches_head_same_branch_fkey
  FOREIGN KEY (id, head_person_id) REFERENCES persons(branch_id, id)
  ON DELETE RESTRICT ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX branches_one_head_role_per_person_idx
  ON branches(head_person_id)
  WHERE head_person_id IS NOT NULL;

CREATE INDEX persons_clan_idx ON persons(clan_id);
CREATE INDEX persons_branch_idx ON persons(branch_id);
CREATE INDEX persons_full_name_idx ON persons(full_name);
CREATE INDEX persons_generation_idx ON persons(generation_number);
CREATE INDEX persons_gender_idx ON persons(gender);
CREATE INDEX persons_life_status_idx ON persons(life_status);
CREATE INDEX persons_birth_solar_idx ON persons(birth_solar_date);
CREATE INDEX persons_death_solar_idx ON persons(death_solar_date);
CREATE INDEX persons_death_anniversary_lunar_idx
  ON persons(death_anniversary_month, death_anniversary_day)
  WHERE death_anniversary_calendar = 'LUNAR';

CREATE TRIGGER persons_set_updated_at
BEFORE UPDATE ON persons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE parent_child_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL,
  parent_person_id UUID NOT NULL,
  child_person_id UUID NOT NULL,
  parent_role parent_role NOT NULL,
  relation_type parent_relation_type NOT NULL DEFAULT 'BIOLOGICAL',
  display_order INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT parent_child_not_self_check CHECK (parent_person_id <> child_person_id),
  CONSTRAINT parent_child_display_order_check CHECK (display_order >= 0),
  CONSTRAINT parent_child_unique_type_per_pair UNIQUE (parent_person_id, child_person_id, relation_type),
  CONSTRAINT parent_child_one_parent_per_role_type UNIQUE (child_person_id, parent_role, relation_type),
  CONSTRAINT parent_child_clan_fkey
    FOREIGN KEY (clan_id) REFERENCES clans(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT parent_child_parent_same_clan_fkey
    FOREIGN KEY (parent_person_id, clan_id) REFERENCES persons(id, clan_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT parent_child_child_same_clan_fkey
    FOREIGN KEY (child_person_id, clan_id) REFERENCES persons(id, clan_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX parent_child_parent_idx ON parent_child_relations(parent_person_id);
CREATE INDEX parent_child_child_idx ON parent_child_relations(child_person_id);
CREATE INDEX parent_child_clan_idx ON parent_child_relations(clan_id);
CREATE INDEX parent_child_relation_type_idx ON parent_child_relations(relation_type);

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
BEFORE INSERT OR UPDATE ON parent_child_relations
FOR EACH ROW EXECUTE FUNCTION assert_parent_child_rules();

CREATE TRIGGER parent_child_set_updated_at
BEFORE UPDATE ON parent_child_relations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE marriages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID NOT NULL,
  husband_person_id UUID NOT NULL,
  wife_person_id UUID NOT NULL,
  status marriage_status NOT NULL DEFAULT 'ACTIVE',
  married_solar_date DATE,
  ended_solar_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT marriages_not_self_check CHECK (husband_person_id <> wife_person_id),
  CONSTRAINT marriages_date_order_check CHECK (
    married_solar_date IS NULL OR ended_solar_date IS NULL OR ended_solar_date >= married_solar_date
  ),
  CONSTRAINT marriages_unique_pair UNIQUE (husband_person_id, wife_person_id),
  CONSTRAINT marriages_clan_fkey
    FOREIGN KEY (clan_id) REFERENCES clans(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT marriages_husband_same_clan_fkey
    FOREIGN KEY (husband_person_id, clan_id) REFERENCES persons(id, clan_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT marriages_wife_same_clan_fkey
    FOREIGN KEY (wife_person_id, clan_id) REFERENCES persons(id, clan_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX marriages_clan_idx ON marriages(clan_id);
CREATE INDEX marriages_husband_idx ON marriages(husband_person_id);
CREATE INDEX marriages_wife_idx ON marriages(wife_person_id);
CREATE INDEX marriages_status_idx ON marriages(status);

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
BEFORE INSERT OR UPDATE ON marriages
FOR EACH ROW EXECUTE FUNCTION assert_marriage_rules();

CREATE TRIGGER marriages_set_updated_at
BEFORE UPDATE ON marriages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE branch_leadership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  predecessor_person_id UUID,
  successor_person_id UUID,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transfer_type leadership_transfer_type NOT NULL,
  reason TEXT,
  note TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT branch_leadership_has_person_check CHECK (
    predecessor_person_id IS NOT NULL OR successor_person_id IS NOT NULL
  ),
  CONSTRAINT branch_leadership_not_same_person_check CHECK (
    predecessor_person_id IS NULL
    OR successor_person_id IS NULL
    OR predecessor_person_id <> successor_person_id
  ),
  CONSTRAINT branch_leadership_branch_fkey
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT branch_leadership_predecessor_same_branch_fkey
    FOREIGN KEY (branch_id, predecessor_person_id) REFERENCES persons(branch_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT branch_leadership_successor_same_branch_fkey
    FOREIGN KEY (branch_id, successor_person_id) REFERENCES persons(branch_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX branch_leadership_branch_date_idx
  ON branch_leadership_history(branch_id, transfer_date DESC, created_at DESC);
CREATE INDEX branch_leadership_predecessor_idx
  ON branch_leadership_history(predecessor_person_id);
CREATE INDEX branch_leadership_successor_idx
  ON branch_leadership_history(successor_person_id);
```

## 4. Giải thích từng bảng

### `clans`

Lưu cấu hình dòng họ Nguyễn Trí. Dù chỉ có một dòng họ, vẫn nên giữ bảng này vì code hiện tại đã dùng `clan`, và đây là nơi đặt lịch sử, logo, nhà thờ, liên hệ, thủy tổ.

`singleton_key` đảm bảo DB chỉ có một dòng. `founder_person_id` là node gốc để dựng cây. Composite FK đảm bảo thủy tổ thuộc đúng clan.

### `branches`

Lưu cấu trúc chi/nhánh nhiều tầng. `parent_branch_id` cho phép chi -> phái -> ngành -> nhánh. Composite FK `(parent_branch_id, clan_id)` ngăn nhánh con trỏ sang clan khác.

`head_person_id` là nguồn hiện tại duy nhất cho trưởng chi. Không cần `persons.is_branch_head`.

### `persons`

Lưu hồ sơ thành viên và phối ngẫu. `is_clan_member` phân biệt người thuộc dòng họ chính với dâu/rể/phối ngẫu, nhưng vẫn đặt trong cùng cây dữ liệu để quan hệ vợ chồng và con cái hoạt động thống nhất.

Ngày âm/dương được lưu song song. Các trường `*_date_source` giúp biết đâu là dữ liệu gốc. Ngày giỗ riêng lưu bằng tháng/ngày và calendar, vì giỗ là sự kiện lặp hằng năm, không phải một `DATE` cố định.

### `parent_child_relations`

Lưu quan hệ cha/mẹ -> con theo một chiều chuẩn. Không có `CHILD` vì con là quan hệ suy ra. Unique constraint ngăn một người có hai cha ruột, hai mẹ ruột, hai cha nuôi hoặc hai mẹ nuôi cùng loại.

Trigger kiểm tra cha phải là nam, mẹ phải là nữ, và ngăn vòng lặp tổ tiên/hậu duệ.

### `marriages`

Lưu hôn nhân như một thực thể riêng. Không cần tạo hai dòng vợ/chồng ngược chiều. Một người có thể xuất hiện trong nhiều dòng marriage khác nhau để hỗ trợ nhiều cuộc hôn nhân.

Con chung mặc định suy ra bằng query từ `parent_child_relations`: child có cha là `husband_person_id` và mẹ là `wife_person_id`.

### `branch_leadership_history`

Lưu lịch sử chuyển trưởng chi/nhánh. Bảng này là log nghiệp vụ, còn nguồn hiện tại vẫn là `branches.head_person_id`.

`transfer_type` phân biệt bổ nhiệm ban đầu, chuyển thủ công, chuyển do người cũ mất, hoặc tự động chọn con trai trưởng.

## 5. Flow nghiệp vụ

### 5.1. Tạo dòng họ + thủy tổ

Transaction/service flow:

```text
BEGIN
1. INSERT clans(name = 'Dòng họ Nguyễn Trí') RETURNING id
2. INSERT persons(clan_id, full_name, gender, generation_number = 1, is_clan_member = true)
3. UPDATE clans SET founder_person_id = person.id WHERE id = clan.id
COMMIT
```

Nếu tạo clan trước rồi thoát giữa chừng, dữ liệu vẫn hợp lệ vì `founder_person_id` nullable. Service có thể kiểm tra cấu hình chưa hoàn tất để nhắc tạo thủy tổ.

### 5.2. Tạo branch

```text
1. Lấy clan singleton.
2. Kiểm tra parent_branch_id nếu có.
3. INSERT branches(clan_id, parent_branch_id, name, type, display_order).
4. Nếu có trưởng chi ban đầu, update branches.head_person_id trong transaction sau khi người đó đã thuộc branch.
5. Insert branch_leadership_history transfer_type = INITIAL.
```

### 5.3. Thêm thành viên

```text
1. Bắt buộc full_name, gender.
2. Nếu có branch_id, DB đảm bảo branch thuộc đúng clan.
3. Nhập ngày sinh dương, âm hoặc cả hai.
4. Nếu ngày nhập là âm, set birth_date_source = LUNAR và lưu lunar fields; service có thể quy đổi birth_solar_date.
5. Nếu ngày nhập là dương, set birth_date_source = SOLAR và lưu birth_solar_date; service có thể quy đổi lunar fields.
```

### 5.4. Thêm phối ngẫu

```text
1. Tạo person cho phối ngẫu nếu chưa có.
2. INSERT marriages(clan_id, husband_person_id, wife_person_id, status).
3. Không insert quan hệ SPOUSE ở bảng khác.
4. Frontend lấy spouse bằng marriages nơi person là husband hoặc wife.
```

### 5.5. Thêm con

```text
1. Tạo person con.
2. INSERT parent_child_relations(parent_person_id = cha, child_person_id = con, parent_role = FATHER, relation_type = BIOLOGICAL).
3. INSERT parent_child_relations(parent_person_id = mẹ, child_person_id = con, parent_role = MOTHER, relation_type = BIOLOGICAL).
4. Với con nuôi, dùng relation_type = ADOPTIVE.
```

Frontend không cần quan hệ `CHILD`; con của một người là các dòng có `parent_person_id` bằng người đó.

### 5.6. Khai báo mất

```text
1. UPDATE persons SET life_status = DECEASED.
2. Lưu death_solar_date và/hoặc death_lunar_year/month/day/is_leap_month.
3. Nếu ngày giỗ khác ngày mất, lưu death_anniversary_calendar/month/day/is_leap_month.
4. Lưu burial_place, burial_map_url, grave_image_url nếu có.
5. Nếu người đó là trưởng chi, gọi flow chuyển trưởng chi.
```

DB chặn trường hợp `life_status = LIVING` nhưng có dữ liệu ngày mất/ngày giỗ/mộ phần.

### 5.7. Chuyển trưởng branch

Transaction/service flow:

```text
BEGIN
1. SELECT branch FOR UPDATE.
2. predecessor = branches.head_person_id.
3. Nếu auto:
   - tìm con trai ruột còn sống của predecessor
   - ưu tiên birth_solar_date sớm nhất, rồi display_order, rồi created_at
4. Nếu manual:
   - successor lấy từ input
5. Kiểm tra successor thuộc branch.
6. UPDATE branches SET head_person_id = successor.
7. INSERT branch_leadership_history(predecessor, successor, transfer_date, transfer_type, reason).
COMMIT
```

### 5.8. Query dựng cây phả hệ frontend

Lấy dữ liệu:

```sql
SELECT * FROM persons WHERE clan_id = $1;
SELECT * FROM parent_child_relations WHERE clan_id = $1;
SELECT * FROM marriages WHERE clan_id = $1;
```

Root:

```sql
SELECT p.*
FROM clans c
JOIN persons p ON p.id = c.founder_person_id
WHERE c.singleton_key = TRUE;
```

Children của một node:

```sql
SELECT child.*, r.parent_role, r.relation_type, r.display_order
FROM parent_child_relations r
JOIN persons child ON child.id = r.child_person_id
WHERE r.parent_person_id = $1
ORDER BY r.display_order, child.birth_solar_date NULLS LAST, child.created_at;
```

Spouses của một node:

```sql
SELECT m.*, spouse.*
FROM marriages m
JOIN persons spouse
  ON spouse.id = CASE
    WHEN m.husband_person_id = $1 THEN m.wife_person_id
    ELSE m.husband_person_id
  END
WHERE m.husband_person_id = $1 OR m.wife_person_id = $1
ORDER BY m.married_solar_date NULLS LAST, m.created_at;
```

Con chung của một marriage:

```sql
SELECT child.*
FROM persons child
WHERE EXISTS (
  SELECT 1
  FROM parent_child_relations father
  WHERE father.child_person_id = child.id
    AND father.parent_person_id = $1
    AND father.parent_role = 'FATHER'
    AND father.relation_type = 'BIOLOGICAL'
)
AND EXISTS (
  SELECT 1
  FROM parent_child_relations mother
  WHERE mother.child_person_id = child.id
    AND mother.parent_person_id = $2
    AND mother.parent_role = 'MOTHER'
    AND mother.relation_type = 'BIOLOGICAL'
);
```

Frontend nên dựng cây từ `parent_child_relations`, không từ `branches`. `branches` chỉ là cách phân nhóm/quản trị; quan hệ huyết thống nằm ở bảng cha mẹ con.
