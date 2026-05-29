# Giai đoạn 02 - Kế hoạch chi tiết người đã khuất, ngày giỗ và lịch nhắc

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống quản lý được ngày mất, ngày giỗ âm lịch, sự kiện dòng họ và nhắc lịch theo phạm vi chi/nhánh phù hợp.

## 2. Căn cứ từ nghiên cứu

- Dữ liệu thành viên, chi/nhánh và người đứng đầu chi/nhánh đến từ giai đoạn 1.
- Ngày giỗ lưu theo âm lịch và cần quy đổi sang ngày dương theo từng năm.
- Logic nhắc lịch theo chi/nhánh dựa trên người được đánh dấu là đứng đầu chi/nhánh.
- Trưởng chi được thao tác dữ liệu trong phạm vi chi/nhánh phụ trách.
- Notification trong website và email là kênh nhắc lịch của giai đoạn này.

## 3. Các mốc công việc trong giai đoạn

| Mốc | Nội dung trọng tâm | Kết quả cần đạt |
|---|---|---|
| G02-M01 | Mở rộng hồ sơ người đã khuất | Hồ sơ lưu được ngày mất, nơi an táng và ghi chú |
| G02-M02 | Thiết kế ngày giỗ và logic chi/nhánh nhận nhắc | Có model ngày giỗ, tháng nhuận và phạm vi nhắc lịch |
| G02-M03 | Triển khai sự kiện và lịch | Có sự kiện tự động/thủ công và lịch tháng/năm |
| G02-M04 | Triển khai notification/email | Có nhắc lịch trong hệ thống và email, chống gửi trùng |
| G02-M05 | Triển khai UI quản trị/người dùng | Quản trị quản lý ngày giỗ, người dùng xem lịch |
| G02-M06 | Kiểm thử và nghiệm thu | Test lịch âm, phạm vi nhắc, permission, lint và build đạt |

## 4. Kế hoạch triển khai theo mốc

### G02-M01 - Hồ sơ người đã khuất

- Bổ sung ngày mất và loại lịch ngày mất.
- Bổ sung nơi an táng, bản đồ hoặc ghi chú.
- Chỉ hiển thị dữ liệu người đã khuất khi trạng thái phù hợp.
- Trưởng chi được cập nhật dữ liệu trong chi nếu đã có quyền phạm vi.

### G02-M02 - Ngày giỗ và phạm vi nhắc

- Tạo model `DeathAnniversary`.
- Lưu ngày âm, tháng âm, tháng nhuận.
- Liên kết ngày giỗ với người đã khuất.
- Xác định `branch_scope_id` theo chi/nhánh của người đứng đầu.
- Nếu người được giỗ là người đứng đầu chi/nhánh, mặc định nhắc thành viên trong chi/nhánh đó.
- Cho phép trưởng họ/admin ghi đè phạm vi toàn họ hoặc phạm vi khác.

### G02-M03 - Sự kiện và lịch

- Tạo model `Event`.
- Phân biệt sự kiện tự động từ ngày giỗ và sự kiện thủ công.
- Hỗ trợ loại sự kiện: ngày giỗ, giỗ tổ, họp họ, tin vui, tin buồn.
- Hỗ trợ trạng thái: draft, published, completed, cancelled.
- API trả lịch theo tháng, năm và sự kiện sắp tới.

### G02-M04 - Notification và email

- Tạo job tìm sự kiện cần nhắc.
- Tạo notification trong website.
- Gửi email nếu cấu hình sẵn sàng.
- Chống gửi trùng theo event, user, channel và mốc nhắc.
- Ghi nhận lỗi gửi để quản trị kiểm tra.

### G02-M05 - Giao diện

Routes đề xuất:

```text
/calendar
/calendar/events/[id]
/notifications
/account/notification-settings
/calendar/death-anniversaries
/calendar/events
/calendar/reminder-settings
```

Màn hình cần có:

- Danh sách ngày giỗ.
- Form ngày giỗ.
- Lịch tháng/năm.
- Danh sách sự kiện sắp tới.
- Chi tiết sự kiện.
- Danh sách thông báo cá nhân.
- Cấu hình nhận nhắc.

### G02-M06 - Kiểm thử

- Test quy đổi âm/dương.
- Test tháng nhuận.
- Test tạo sự kiện từ ngày giỗ.
- Test logic người đứng đầu chi/nhánh.
- Test không gửi thông báo trùng.
- Test trưởng chi chỉ cập nhật dữ liệu trong chi.

## 5. API và permission đề xuất

Permission:

```text
death-anniversaries.manage
events.manage
events.publish
notifications.manage-own
reminder-settings.manage-own
```

API chính:

- Cập nhật hồ sơ người đã khuất.
- CRUD ngày giỗ.
- CRUD sự kiện.
- Lấy lịch tháng/năm.
- Lấy sự kiện sắp tới.
- Lấy/đánh dấu thông báo.
- Cập nhật lựa chọn nhận nhắc.

## 6. Ngoài phạm vi

- Zalo/SMS.
- Đăng ký tham dự sự kiện.
- Album ảnh sự kiện.
- Bài viết liên kết sự kiện.
- Quản lý quỹ hoặc đóng góp.

