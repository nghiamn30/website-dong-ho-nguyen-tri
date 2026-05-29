# Giai đoạn 04 - Kế hoạch chi tiết quản trị nâng cao

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống phải có cơ chế kiểm duyệt thay đổi dữ liệu, phân quyền theo chi/nhánh, cấu hình riêng tư rõ ràng và khả năng sao lưu/khôi phục tối thiểu.

## 2. Điều kiện bắt đầu

- Giai đoạn 1 đã có dữ liệu phả hệ.
- Giai đoạn 2 đã có lịch giỗ/sự kiện.
- Giai đoạn 3 đã có nội dung, album/tài liệu.
- Role/permission nền tảng đã ổn định.
- Audit log nền tảng đã có hoặc cần được mở rộng.

## 3. Thứ tự triển khai đề xuất

### Bước 1 - Ma trận quyền

- Chốt vai trò chính thức: thành viên, đại diện chi, biên tập viên, ban phả, ban chấp hành, admin.
- Chốt permission theo từng phân hệ.
- Chốt cách gắn quyền với chi/nhánh.
- Seed lại permission nếu cần.
- Cập nhật giao diện quản lý vai trò.

### Bước 2 - Phân quyền theo chi/nhánh

- Mở rộng `UserRole` hoặc bảng tương đương để lưu `branch_id`.
- Tạo service kiểm tra phạm vi chi/nhánh.
- Áp dụng guard ở API phả hệ, lịch, nội dung.
- Kiểm thử trường hợp đại diện chi truy cập dữ liệu ngoài phạm vi.

### Bước 3 - Quy trình đề xuất chỉnh sửa

- Tạo bảng `ChangeRequest`.
- Hỗ trợ request create/update/delete cho các entity quan trọng.
- Lưu `proposed_data`, `reason`, `status`, `review_note`.
- Tạo API gửi đề xuất.
- Tạo API duyệt/từ chối.
- Khi duyệt, cập nhật dữ liệu chính thức trong transaction.

### Bước 4 - Giao diện kiểm duyệt

Routes đề xuất:

```text
/governance/change-requests
/governance/change-requests/[id]
/governance/privacy
/governance/audit-logs
/governance/backups
```

Màn hình cần có:

- Danh sách đề xuất chờ duyệt.
- Chi tiết đề xuất với dữ liệu trước/sau.
- Form duyệt/từ chối.
- Cấu hình quyền riêng tư.
- Nhật ký thao tác có bộ lọc.
- Màn hình backup/restore tối thiểu nếu cho phép thao tác qua UI.

### Bước 5 - Audit log nâng cao

- Chuẩn hóa entity type và action.
- Ghi dữ liệu trước/sau cho thay đổi quan trọng.
- Ghi actor, thời gian, lý do nếu có.
- Cho phép lọc theo người thao tác, entity, thời gian.
- Không ghi dữ liệu nhạy cảm không cần thiết vào log.

### Bước 6 - Cài đặt riêng tư

- Tạo cấu hình mặc định cho người đang sống.
- Tạo cấu hình mặc định cho người đã khuất.
- Tạo cấu hình phạm vi xem hồ sơ, ngày giỗ, nơi an táng, tư liệu.
- Áp dụng rule riêng tư ở API trước khi trả dữ liệu.
- Hiển thị giải thích rõ trong giao diện quản trị.

### Bước 7 - Sao lưu và khôi phục

- Tạo script backup database.
- Tạo script restore database cho môi trường được phép.
- Xác định chiến lược backup file upload.
- Ghi log lịch sử backup.
- Viết tài liệu vận hành backup/restore.

## 4. Permission đề xuất

```text
change-requests.view
change-requests.create
change-requests.review
privacy-settings.view
privacy-settings.manage
roles.manage-branch-scope
audit-logs.view
backups.view
backups.run
backups.restore
```

## 5. Kiểm thử

- Test guard phân quyền theo chi.
- Test gửi đề xuất chỉnh sửa.
- Test duyệt đề xuất trong transaction.
- Test từ chối đề xuất không làm thay đổi dữ liệu chính.
- Test audit log trước/sau.
- Test riêng tư với người đang sống.
- Test backup tạo file hợp lệ.
- Test restore trên môi trường thử nghiệm.

## 6. Ngoài phạm vi

- Chữ ký số.
- Quy trình duyệt nhiều cấp phức tạp.
- Chính sách pháp lý đầy đủ thay cho tư vấn chuyên môn.
- Backup cloud tự động nếu chưa chốt hạ tầng.
- Phân tích hành vi người dùng nâng cao.

## 7. Kết quả bàn giao

- Phân quyền theo chi/nhánh hoạt động.
- Quy trình đề xuất và duyệt dữ liệu hoạt động.
- Audit log đủ phục vụ truy vết.
- Cài đặt riêng tư được áp dụng ở API và UI.
- Có quy trình backup/restore tối thiểu.

