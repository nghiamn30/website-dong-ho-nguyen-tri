# Nghiên cứu giai đoạn 4: Quản trị nâng cao, kiểm duyệt và an toàn dữ liệu

## 1. Bối cảnh

### Dự án đã có những gì

- Nền tảng đã có authentication, role/permission guard, audit log và quản lý user.
- Sau giai đoạn 1, hệ thống có dữ liệu phả hệ, chi/nhánh và 4 role nghiệp vụ.
- Sau giai đoạn 2, hệ thống có ngày mất, ngày giỗ, sự kiện và lịch nhắc.
- Sau giai đoạn 3, hệ thống có bài viết, album và media.
- Chưa có quy trình đề xuất/duyệt dữ liệu chính thức.
- Chưa có phân quyền theo chi/nhánh ở mức đầy đủ.
- Chưa có quy trình backup/restore nghiệp vụ.

Giai đoạn 4 củng cố vận hành dài hạn: ai được sửa dữ liệu nào, thay đổi được duyệt ra sao, audit log ghi thế nào và dữ liệu được backup như thế nào.

## 2. Vai trò áp dụng

| Vai trò | Phạm vi trong giai đoạn 4 |
|---|---|
| Admin | Toàn quyền, phân quyền, backup/restore và cấu hình hệ thống |
| Trưởng họ | Duyệt dữ liệu toàn họ, duyệt nội dung quan trọng, xem audit |
| Trưởng chi | Cập nhật hoặc đề xuất dữ liệu trong chi/nhánh phụ trách |
| Người bình thường | Gửi đề xuất chỉnh sửa, xem dữ liệu đã công bố |

Quyền đặc biệt cần áp dụng:

- Trưởng chi có quyền cập nhật ngày mất cho thành viên trong chi/nhánh phụ trách.
- Nếu thành viên chưa mất, giao diện hồ sơ chỉ hiển thị ngày, tháng, năm sinh; không hiển thị trường ngày mất/ngày giỗ như dữ liệu đang áp dụng.

## 3. Module cần xây dựng

| Module | Mục tiêu |
|---|---|
| Phân quyền theo chi/nhánh | Giới hạn quyền thao tác của trưởng chi |
| Đề xuất chỉnh sửa | Người dùng gửi yêu cầu sửa dữ liệu |
| Duyệt dữ liệu | Trưởng họ/admin duyệt hoặc từ chối thay đổi |
| Audit log nâng cao | Ghi dữ liệu trước/sau cho thao tác quan trọng |
| Cài đặt hiển thị theo trạng thái sống/mất | Kiểm soát trường ngày sinh, ngày mất, ngày giỗ |
| Backup/restore | Sao lưu và phục hồi dữ liệu tối thiểu |

## 4. Hiện trạng và khoảng cách

| Nội dung | Hiện trạng | Khoảng cách cần xử lý |
|---|---|---|
| Role/permission | Có nền tảng | Cần branch-scope cho trưởng chi |
| Trưởng chi | Có vai trò nghiệp vụ | Cần rule cập nhật ngày mất trong chi |
| Đề xuất chỉnh sửa | Chưa có | Cần model và workflow duyệt/từ chối |
| Audit log | Có nền tảng | Cần chuẩn hóa entity/action và dữ liệu trước/sau |
| Hiển thị sống/mất | Có dữ liệu từ giai đoạn 2 | Cần rule UI rõ ràng |
| Backup/restore | Chưa chuẩn hóa | Cần script và tài liệu vận hành |

## 5. Dữ liệu đề xuất

### BranchScopedRole

- `id`
- `user_id`
- `role_id`
- `branch_id`
- `created_at`
- `updated_at`

### ChangeRequest

- `id`
- `requested_by`
- `entity_type`
- `entity_id`
- `request_type`
- `proposed_data`
- `reason`
- `status`
- `reviewed_by`
- `reviewed_at`
- `review_note`
- `created_at`
- `updated_at`

### AuditLog mở rộng

- `id`
- `actor_id`
- `entity_type`
- `entity_id`
- `action`
- `before_data`
- `after_data`
- `reason`
- `created_at`

### PrivacyDisplayRule

- `id`
- `subject_type`
- `field_name`
- `condition`
- `display_rule`
- `created_at`
- `updated_at`

### BackupJob

- `id`
- `job_type`
- `status`
- `file_path`
- `started_by`
- `started_at`
- `finished_at`
- `error_message`

## 6. Quyết định thiết kế

1. Không mở thêm role mới trong giai đoạn này, vẫn dùng admin, trưởng họ, trưởng chi, người bình thường.
2. Trưởng chi có phạm vi thao tác theo `branch_id`.
3. Trưởng chi được cập nhật ngày mất của thành viên trong chi/nhánh phụ trách.
4. Trưởng chi không được cập nhật ngày mất của thành viên ngoài phạm vi.
5. Thành viên chưa mất chỉ hiển thị ngày, tháng, năm sinh trong UI hồ sơ.
6. Dữ liệu ngày mất/ngày giỗ chỉ hiển thị khi thành viên có trạng thái đã khuất hoặc có dữ liệu phù hợp.
7. Đề xuất chỉnh sửa không ghi trực tiếp vào dữ liệu chính thức cho đến khi được duyệt.
8. Duyệt đề xuất phải chạy trong transaction và ghi audit log.
9. Backup/restore tối thiểu cần có script và hướng dẫn vận hành, chưa bắt buộc UI đầy đủ.

