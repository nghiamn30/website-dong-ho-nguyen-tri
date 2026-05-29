# Giai đoạn 04 - Kế hoạch chi tiết quản trị nâng cao, kiểm duyệt và an toàn dữ liệu

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống có phân quyền theo chi/nhánh, quy trình đề xuất/duyệt dữ liệu, audit log nâng cao và backup/restore tối thiểu.

## 2. Căn cứ từ nghiên cứu

- Vẫn dùng 4 role: admin, trưởng họ, trưởng chi, người bình thường.
- Trưởng chi thao tác trong phạm vi chi/nhánh được gán.
- Trưởng chi được cập nhật ngày mất cho thành viên trong chi.
- Thành viên chưa mất chỉ hiển thị ngày, tháng, năm sinh.
- Đề xuất chỉnh sửa phải được duyệt trước khi ghi vào dữ liệu chính thức.
- Audit log cần ghi đủ dữ liệu trước/sau cho thao tác quan trọng.

## 3. Các mốc công việc trong giai đoạn

| Mốc | Nội dung trọng tâm | Kết quả cần đạt |
|---|---|---|
| G04-M01 | Chốt ma trận quyền và phạm vi chi/nhánh | Có rule quyền chính thức cho 4 role |
| G04-M02 | Triển khai branch-scoped permission | Trưởng chi cập nhật được dữ liệu trong chi, bị chặn ngoài chi |
| G04-M03 | Triển khai đề xuất chỉnh sửa | Người dùng gửi đề xuất, trưởng họ/admin duyệt hoặc từ chối |
| G04-M04 | Mở rộng audit và rule hiển thị sống/mất | Log có trước/sau, UI hiển thị đúng ngày sinh/ngày mất |
| G04-M05 | Triển khai backup/restore tối thiểu | Có script, tài liệu và thử restore |
| G04-M06 | Kiểm thử và nghiệm thu | Test quyền, duyệt, audit, backup, lint và build đạt |

## 4. Kế hoạch triển khai theo mốc

### G04-M01 - Ma trận quyền

- Chốt permission theo phân hệ.
- Chốt rule admin, trưởng họ, trưởng chi, người bình thường.
- Chốt phạm vi `branch_id` cho trưởng chi.
- Seed hoặc migrate permission mới.

### G04-M02 - Branch-scoped permission

- Mở rộng bảng gán role để có `branch_id` nếu cần.
- Tạo service kiểm tra phạm vi chi/nhánh.
- Áp dụng guard cho API phả hệ, ngày giỗ, sự kiện và nội dung.
- Bổ sung API cập nhật ngày mất trong phạm vi chi.
- Chặn trưởng chi cập nhật dữ liệu ngoài chi.

### G04-M03 - Đề xuất chỉnh sửa

- Tạo model `ChangeRequest`.
- Hỗ trợ request create/update/delete.
- Lưu dữ liệu đề xuất và lý do.
- Tạo API gửi đề xuất.
- Tạo API duyệt/từ chối.
- Khi duyệt, cập nhật dữ liệu chính thức trong transaction.

### G04-M04 - Audit và rule hiển thị

- Chuẩn hóa `entity_type` và `action`.
- Ghi `before_data` và `after_data`.
- Ghi actor, thời gian và lý do nếu có.
- Cập nhật UI hồ sơ:
  - Người chưa mất: chỉ hiển thị ngày, tháng, năm sinh.
  - Người đã mất: hiển thị ngày mất, ngày giỗ và dữ liệu liên quan.

### G04-M05 - Backup/restore

- Tạo script backup database.
- Tạo script restore cho môi trường được phép.
- Xác định cách backup file upload.
- Viết hướng dẫn vận hành.
- Thử restore trên môi trường không phải production.

### G04-M06 - Kiểm thử

- Test trưởng chi cập nhật ngày mất trong chi.
- Test trưởng chi bị chặn ngoài chi.
- Test đề xuất/duyệt/từ chối.
- Test transaction khi duyệt.
- Test audit log trước/sau.
- Test backup và restore tối thiểu.

## 5. Permission đề xuất

```text
roles.manage-branch-scope
change-requests.create
change-requests.review
audit-logs.view
deceased-info.update-branch
backup.run
backup.restore
```

## 6. Ngoài phạm vi

- Chữ ký số.
- Duyệt nhiều cấp phức tạp.
- Chính sách pháp lý đầy đủ thay cho tư vấn chuyên môn.
- Backup cloud tự động nếu chưa chốt hạ tầng.
- Dashboard phân tích nâng cao.

