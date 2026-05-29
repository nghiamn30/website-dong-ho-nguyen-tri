# Nghiên cứu giai đoạn 1: Nền tảng dữ liệu, tổ chức và phân quyền

## 1. Bối cảnh

### Dự án đã có những gì

- Tech stack nền tảng đã sẵn sàng: Next.js, NestJS, Prisma, PostgreSQL, TypeScript và pnpm workspace.
- Frontend đã có layout quản trị, sidebar, theme, UI components, API client và các trang hệ thống như login, 403, 404.
- Backend đã có authentication, JWT cookie, user, role, permission guard, audit log nền tảng và health endpoint.
- Database hiện mới có các bảng nền tảng: user, role, permission và audit log.
- Chưa có dữ liệu nghiệp vụ gia phả: dòng họ, chi/nhánh, thành viên, quan hệ gia đình và phả đồ.
- Chưa có thư viện React Flow hoặc giải pháp phả đồ được chốt trong dự án.

Giai đoạn 1 là giai đoạn đặt nền dữ liệu lõi. Nếu mô hình dòng họ, chi/nhánh, thành viên và quan hệ không ổn định thì các giai đoạn lịch giỗ, thông báo, kiểm duyệt và mở rộng sẽ bị lệch theo.

## 2. Vai trò áp dụng

Giai đoạn 1 thống nhất 4 vai trò nghiệp vụ:

| Vai trò | Phạm vi |
|---|---|
| Admin | Toàn quyền kỹ thuật, cấu hình hệ thống, phân quyền và dữ liệu |
| Trưởng họ | Quản lý dữ liệu toàn họ, cấu hình thông tin dòng họ và phả đồ |
| Trưởng chi | Quản lý dữ liệu thành viên, quan hệ và thông tin trong chi/nhánh phụ trách |
| Người bình thường | Xem cây phả hệ, xem thông tin cá nhân và tra cứu dữ liệu |

Quyết định quan trọng của giai đoạn này:

- Thông tin cá nhân của từng người trong gia phả là dữ liệu mọi người đều có thể xem.
- Không phân quyền ở luồng đọc hồ sơ cá nhân và cây phả hệ.
- Phân quyền chỉ áp dụng cho thao tác tạo, sửa, xóa, gắn quan hệ, cấu hình và quản trị dữ liệu.

## 3. Module cần xây dựng

| Module | Mục tiêu |
|---|---|
| Cấu hình dòng họ | Lưu thông tin chung của dòng họ, thủy tổ, mô tả, liên hệ |
| Quản lý chi/nhánh | Tạo cấu trúc chi, phái, ngành, nhánh nhiều tầng |
| Quản lý thành viên | Tạo hồ sơ người trong gia phả |
| Quan hệ gia đình | Gắn cha, mẹ, vợ/chồng, con và quan hệ liên quan |
| Phả đồ | Hiển thị cây phả hệ lấy thủy tổ làm node gốc |
| Tra cứu | Tìm thành viên theo tên, đời, chi/nhánh |
| Role/permission nghiệp vụ | Ánh xạ 4 vai trò vào quyền thao tác dữ liệu |

## 4. Hiện trạng và khoảng cách

| Nội dung | Hiện trạng | Khoảng cách cần xử lý |
|---|---|---|
| Dữ liệu dòng họ | Chưa có model nghiệp vụ | Cần model `Clan` hoặc cấu hình tương đương |
| Chi/nhánh | Chưa có | Cần model phân cấp nhiều tầng |
| Thành viên | Chưa có | Cần model `Person` và form quản trị |
| Quan hệ | Chưa có | Cần model quan hệ và rule chống sai dữ liệu |
| Phả đồ | Chưa có thư viện/giải pháp | Cần đánh giá React Flow trước khi chốt |
| Quyền nghiệp vụ | Mới có role/permission nền tảng | Cần seed 4 role và permission thao tác |
| Audit | Có nền tảng audit log | Cần ghi log cho thao tác thay đổi dữ liệu phả hệ |

## 5. Dữ liệu đề xuất

### Clan

- `id`
- `name`
- `description`
- `history`
- `founder_person_id`
- `logo_url`
- `banner_url`
- `ancestral_house_name`
- `ancestral_house_address`
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
- `head_person_id`
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
- `is_branch_head`
- `biography`
- `hometown`
- `current_location`
- `created_at`
- `updated_at`

### Relationship

- `id`
- `person_1_id`
- `person_2_id`
- `relationship_type`
- `start_date`
- `end_date`
- `note`
- `created_at`
- `updated_at`

## 6. Quyết định thiết kế

1. Phả đồ toàn họ lấy thủy tổ làm người đứng đầu.
2. `Clan.founder_person_id` hoặc cơ chế tương đương được dùng để xác định node gốc.
3. Chi/nhánh hỗ trợ nhiều tầng, không ép tên cấp bậc cố định.
4. `Branch.head_person_id` hoặc `Person.is_branch_head` được dùng để đánh dấu người đứng đầu chi/nhánh, làm nền cho lịch nhắc ở giai đoạn 2.
5. Thông tin cá nhân trong gia phả được xem công khai trong hệ thống, không phân quyền đọc theo vai trò.
6. Các thao tác ghi dữ liệu phải có permission và audit log.
7. Quyết định G01-M01: chưa dùng React Flow trong giai đoạn 1. Phả đồ được render bằng React/CSS phân cấp để giữ dependency gọn và đủ đáp ứng nhập dữ liệu ban đầu.
8. React Flow sẽ được xem lại ở giai đoạn sau nếu phát sinh nhu cầu:
   - Render cây nhiều node.
   - Zoom/pan.
   - Custom node hiển thị thông tin thành viên.
   - Edge thể hiện quan hệ.
   - Lazy loading hoặc giới hạn render khi cây lớn.
   - Khả năng phục vụ export ở giai đoạn sau.
9. Nếu cần chuyển sang React Flow hoặc thư viện khác, phải có prototype và tiêu chí hiệu năng trước khi thêm dependency.
