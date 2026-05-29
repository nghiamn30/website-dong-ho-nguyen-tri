# Nghiên cứu giai đoạn 2: Người đã khuất, ngày giỗ và lịch nhắc

## 1. Bối cảnh

### Dự án đã có những gì

- Nền tảng kỹ thuật đã có auth, role/permission, audit log, layout và API client.
- Sau giai đoạn 1, hệ thống dự kiến đã có dòng họ, chi/nhánh, thành viên, quan hệ và phả đồ.
- Thành viên đã có `life_status`, `birth_date`, `branch_id` và cờ/nghiệp vụ xác định người đứng đầu chi/nhánh.
- Chưa có dữ liệu ngày mất, ngày giỗ âm lịch, sự kiện, lịch nhắc và thông báo.
- Chưa có cơ chế chuyển đổi âm lịch/dương lịch được chốt trong codebase.

Giai đoạn 2 biến dữ liệu phả hệ thành lịch truyền thống: ngày mất, ngày giỗ, giỗ tổ, sự kiện và nhắc lịch cho đúng người trong chi/nhánh.

## 2. Vai trò áp dụng

| Vai trò | Phạm vi trong giai đoạn 2 |
|---|---|
| Admin | Cấu hình lịch, xử lý dữ liệu toàn hệ thống, kiểm tra job nhắc lịch |
| Trưởng họ | Quản lý ngày giỗ/sự kiện toàn họ, giỗ tổ và phạm vi thông báo |
| Trưởng chi | Cập nhật thông tin người đã khuất và ngày giỗ trong chi phụ trách |
| Người bình thường | Xem lịch giỗ/sự kiện và nhận nhắc lịch phù hợp |

Luồng đọc lịch có thể mở cho mọi người trong hệ thống, nhưng thao tác tạo/sửa ngày giỗ, sự kiện và phạm vi nhắc lịch phải kiểm soát theo vai trò.

## 3. Module cần xây dựng

| Module | Mục tiêu |
|---|---|
| Hồ sơ người đã khuất | Lưu ngày mất, ngày giỗ, nơi an táng |
| Ngày giỗ âm lịch | Lưu ngày/tháng âm, tháng nhuận và quy tắc lặp |
| Lịch sự kiện | Hiển thị giỗ, giỗ tổ, họp họ và sự kiện thủ công |
| Logic chi/nhánh nhận nhắc | Dựa trên người đứng đầu chi/nhánh để xác định nhóm nhận nhắc |
| Notification | Tạo thông báo trong hệ thống |
| Email reminder | Gửi email nhắc lịch nếu cấu hình sẵn sàng |
| Cài đặt nhận nhắc | Cho phép người dùng quản lý lựa chọn nhận thông báo |

## 4. Hiện trạng và khoảng cách

| Nội dung | Hiện trạng | Khoảng cách cần xử lý |
|---|---|---|
| Ngày mất | Chưa có hoặc chưa đủ | Cần mở rộng hồ sơ thành viên |
| Ngày giỗ âm lịch | Chưa có | Cần model riêng và rule chuyển đổi |
| Người đứng đầu chi/nhánh | Được đề xuất từ giai đoạn 1 | Cần dùng làm căn cứ tạo lịch nhắc |
| Sự kiện | Chưa có | Cần model `Event` và lịch tháng/năm |
| Notification | Chưa có nghiệp vụ lịch | Cần model/log chống gửi trùng |
| Email | Chưa chốt vận hành | Cần adapter hoặc cấu hình gửi email |

## 5. Dữ liệu đề xuất

### Person mở rộng

- `death_date`
- `death_calendar_type`
- `burial_place`
- `burial_map_url`
- `death_note`

### DeathAnniversary

- `id`
- `person_id`
- `lunar_day`
- `lunar_month`
- `is_leap_month`
- `solar_date_cache`
- `recurrence_type`
- `branch_scope_id`
- `notification_scope`
- `notify_before_days`
- `ceremony_note`
- `active`
- `created_at`
- `updated_at`

### Event

- `id`
- `clan_id`
- `branch_id`
- `source_type`
- `source_id`
- `title`
- `event_type`
- `description`
- `calendar_type`
- `lunar_day`
- `lunar_month`
- `is_leap_month`
- `start_datetime`
- `end_datetime`
- `location`
- `visibility_scope`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### Notification

- `id`
- `user_id`
- `event_id`
- `channel`
- `reminder_key`
- `title`
- `content`
- `read_at`
- `sent_at`
- `status`
- `created_at`

## 6. Quyết định thiết kế

1. Ngày giỗ ưu tiên lưu theo âm lịch, bao gồm ngày, tháng và trạng thái tháng nhuận.
2. Ngày âm gốc không bị ghi đè khi quy đổi sang ngày dương.
3. Hệ thống cần service riêng để quy đổi ngày âm/dương theo năm.
4. Mỗi thành viên có tùy chọn xác định có phải người đứng đầu chi/nhánh hay không.
5. Khi người được giỗ là người đứng đầu chi/nhánh, lịch nhắc mặc định gửi cho thành viên trong chi/nhánh đó.
6. Trưởng họ có thể ghi đè phạm vi nhắc lịch thành toàn họ hoặc phạm vi khác.
7. Trưởng chi chỉ quản lý ngày mất/ngày giỗ trong chi/nhánh phụ trách.
8. Cần chống gửi trùng bằng `reminder_key` hoặc bảng log gửi thông báo.
9. Zalo/SMS chưa triển khai ở giai đoạn này.

