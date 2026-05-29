# Giai đoạn 01 - Nghiên cứu dữ liệu lõi và cây gia phả

## 1. Cơ sở nghiên cứu

Tài liệu này được tách từ `docs/nghien-cuu.md`, trọng tâm là phần:

- Quản lý cây gia phả và chi dòng tộc.
- Hồ sơ thành viên.
- Cấu trúc dữ liệu `Clan`, `Branch`, `Person`, `Relationship`.
- Luồng ban chấp hành dựng cây gia phả ban đầu.
- Các yêu cầu riêng tư cơ bản đối với người đang sống.

## 2. Mục tiêu giai đoạn

Xây dựng lớp dữ liệu và màn hình lõi để hệ thống có thể:

- Cấu hình thông tin dòng họ.
- Tạo và quản lý chi, phái, ngành, nhánh theo cấu trúc mềm.
- Tạo hồ sơ thành viên.
- Gắn quan hệ cha, mẹ, vợ/chồng, con.
- Hiển thị phả đồ toàn họ và phả đồ theo chi.
- Tìm kiếm thành viên theo tên, đời, chi/nhánh.
- Thiết lập quyền xem cơ bản cho dữ liệu phả hệ.

## 3. Phạm vi nghiệp vụ

### 3.1. Đối tượng sử dụng

| Đối tượng | Nhu cầu chính |
|---|---|
| Quản trị hệ thống | Cấu hình ban đầu, quản lý toàn bộ dữ liệu |
| Ban phả / ban chấp hành | Nhập dữ liệu phả hệ, kiểm tra quan hệ, chuẩn hóa hồ sơ |
| Đại diện chi | Theo dõi dữ liệu thuộc chi/nhánh của mình |
| Thành viên dòng họ | Tra cứu cây gia phả và hồ sơ được phép xem |

### 3.2. Thực thể nghiệp vụ chính

| Thực thể | Vai trò |
|---|---|
| Dòng họ | Thông tin gốc của toàn hệ thống |
| Chi/nhánh | Cấu trúc phân cấp để tổ chức thành viên |
| Thành viên | Hồ sơ một người trong hoặc liên quan đến dòng họ |
| Quan hệ | Liên kết giữa các thành viên trong phả hệ |

### 3.3. Quan hệ cần hỗ trợ

- Cha ruột.
- Mẹ ruột.
- Vợ/chồng.
- Con ruột.
- Con nuôi nếu có ghi nhận.
- Dâu/rể.
- Thành viên thuộc dòng họ chính.

## 4. Quy tắc nghiệp vụ cần chốt

1. Mỗi người chỉ có một hồ sơ duy nhất trong hệ thống.
2. Một thành viên có thể thuộc một chi/nhánh chính tại một thời điểm.
3. Cấu trúc chi/nhánh phải hỗ trợ nhiều tầng.
4. Tên tầng không bị cố định, có thể là Chi, Phái, Ngành, Nhánh hoặc tên khác.
5. Con cần gắn với ít nhất một phụ huynh khi xác lập quan hệ trực hệ.
6. Một người có thể có nhiều hôn phối, nhưng quan hệ phải phân biệt rõ từng cặp.
7. Không xóa cứng thành viên đã có quan hệ quan trọng, ưu tiên trạng thái ẩn/lưu trữ.
8. Thông tin nhạy cảm của người đang sống không được hiển thị công khai.

## 5. Màn hình cần nghiên cứu chi tiết

### Khu vực quản trị

- Dashboard phả hệ giai đoạn đầu.
- Cấu hình thông tin dòng họ.
- Danh sách chi/nhánh.
- Form tạo/sửa chi/nhánh.
- Danh sách thành viên.
- Form tạo/sửa hồ sơ thành viên.
- Trình gắn quan hệ gia đình.
- Trang xem nhanh hồ sơ thành viên.

### Khu vực người dùng

- Cây gia phả toàn họ.
- Cây gia phả theo chi/nhánh.
- Trang tra cứu thành viên.
- Trang hồ sơ thành viên dạng đọc.

## 6. Gợi ý mô hình dữ liệu

### Clan

- `id`
- `name`
- `description`
- `history`
- `logo_url`
- `banner_url`
- `ancestral_house_name`
- `ancestral_house_address`
- `map_url`
- `contact_information`
- `created_at`
- `updated_at`

### Branch

- `id`
- `clan_id`
- `parent_branch_id`
- `name`
- `type`
- `description`
- `representative_person_id`
- `display_order`
- `status`
- `created_at`
- `updated_at`

### Person

- `id`
- `clan_id`
- `branch_id`
- `full_name`
- `common_name`
- `gender`
- `avatar_url`
- `generation_number`
- `birth_date`
- `birth_calendar_type`
- `life_status`
- `biography`
- `hometown`
- `current_location`
- `privacy_level`
- `created_at`
- `updated_at`

### Relationship

- `id`
- `person_1_id`
- `person_2_id`
- `relationship_type`
- `is_clan_member`
- `start_date`
- `end_date`
- `note`
- `created_at`
- `updated_at`

## 7. Quyền và riêng tư tối thiểu

| Nội dung | Quy tắc đề xuất |
|---|---|
| Xem danh sách thành viên | Chỉ người đăng nhập hoặc theo cấu hình công khai giới hạn |
| Xem hồ sơ người đang sống | Ẩn thông tin nhạy cảm nếu không đủ quyền |
| Xem hồ sơ người đã khuất | Có thể công khai hơn nhưng vẫn theo cấu hình riêng tư |
| Tạo/sửa thành viên | Quản trị, ban phả hoặc vai trò được phân quyền |
| Gắn quan hệ | Chỉ vai trò có quyền quản lý phả hệ |

## 8. Rủi ro cần xử lý sớm

- Dữ liệu trùng người do nhập nhiều lần.
- Gắn sai cha/mẹ gây sai cả nhánh phả hệ.
- Cây quá lớn gây khó hiển thị hoặc hiệu năng kém.
- Chưa thống nhất cách gọi chi/phái/ngành/nhánh.
- Lộ thông tin người đang sống ở trang công khai.

## 9. Kết quả nghiên cứu cần đạt

Kết thúc giai đoạn nghiên cứu, đội triển khai phải có:

- Quy tắc tạo chi/nhánh và thành viên.
- Quy tắc gắn quan hệ gia đình.
- Danh sách màn hình chính thức cho giai đoạn 1.
- Database schema chi tiết để triển khai.
- Danh sách API cần có.
- Ma trận quyền tối thiểu cho dữ liệu phả hệ.

