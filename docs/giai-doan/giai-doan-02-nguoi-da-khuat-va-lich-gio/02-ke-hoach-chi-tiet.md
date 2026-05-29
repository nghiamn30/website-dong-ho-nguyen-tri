# Giai đoạn 02 - Kế hoạch chi tiết người đã khuất và lịch giỗ

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống phải quản lý được người đã khuất, ngày giỗ âm lịch, sự kiện dòng họ và thông báo nhắc lịch ở mức vận hành ban đầu.

## 2. Điều kiện bắt đầu

- Giai đoạn 1 đã có hồ sơ thành viên ổn định.
- Thành viên đã có trạng thái sống/mất.
- Thành viên đã có chi/nhánh để xác định phạm vi thông báo.
- Permission nền tảng đã hoạt động.

## 3. Thứ tự triển khai đề xuất

### Bước 1 - Mở rộng hồ sơ người đã khuất

- Bổ sung dữ liệu ngày mất.
- Bổ sung loại lịch ngày mất nếu cần.
- Bổ sung nơi an táng.
- Bổ sung bản đồ hoặc ghi chú nơi an táng.
- Bổ sung quyền hiển thị thông tin người đã khuất.

### Bước 2 - Thiết kế ngày giỗ

- Tạo bảng `DeathAnniversary`.
- Lưu ngày âm, tháng âm, tháng nhuận.
- Lưu phạm vi thông báo.
- Lưu mốc nhắc trước ngày giỗ.
- Liên kết ngày giỗ với hồ sơ thành viên.

### Bước 3 - Thiết kế sự kiện

- Tạo bảng `Event`.
- Phân biệt sự kiện tự động và sự kiện thủ công.
- Hỗ trợ loại sự kiện: ngày giỗ, giỗ tổ, họp họ, tin vui, tin buồn, hoạt động.
- Hỗ trợ trạng thái: draft, published, completed, cancelled.
- Hỗ trợ phạm vi hiển thị.

### Bước 4 - Xử lý lịch âm/dương

- Chốt cách chuyển đổi ngày âm sang ngày dương.
- Tạo service quy đổi ngày giỗ theo năm.
- Tạo cơ chế kiểm thử các ngày âm thường gặp.
- Xử lý tháng nhuận rõ ràng.
- Không ghi đè ngày âm gốc khi quy đổi.

### Bước 5 - Backend API

Nhóm API cần có:

| Nhóm | API đề xuất |
|---|---|
| Deceased profile | Cập nhật thông tin người đã khuất |
| Death anniversary | CRUD ngày giỗ, lấy danh sách theo tháng/năm |
| Event | CRUD sự kiện, publish/cancel sự kiện |
| Calendar | Lấy lịch theo tháng/năm, sự kiện sắp tới |
| Notification | Lấy thông báo, đánh dấu đã đọc |
| Preference | Cập nhật lựa chọn nhận nhắc lịch |

### Bước 6 - Frontend quản trị

Routes đề xuất:

```text
/calendar/death-anniversaries
/calendar/events
/calendar/events/[id]
/calendar/reminder-settings
```

Màn hình cần triển khai:

- Danh sách ngày giỗ.
- Form tạo/sửa ngày giỗ.
- Danh sách sự kiện.
- Form tạo/sửa sự kiện.
- Lịch tháng cho quản trị.
- Cấu hình nhắc lịch.

### Bước 7 - Frontend người dùng

Routes đề xuất:

```text
/calendar
/calendar/events/[id]
/notifications
/account/notification-settings
```

Màn hình cần triển khai:

- Lịch sự kiện theo tháng.
- Danh sách sự kiện sắp tới.
- Chi tiết sự kiện.
- Danh sách thông báo cá nhân.
- Cài đặt nhận nhắc lịch.

### Bước 8 - Nhắc lịch và email

- Tạo job tìm sự kiện cần nhắc.
- Gửi notification trong website.
- Gửi email nếu đã cấu hình email provider.
- Chống gửi trùng bằng bảng log hoặc trạng thái gửi.
- Ghi nhận lỗi gửi để quản trị kiểm tra.

## 4. Permission đề xuất

```text
death-anniversaries.view
death-anniversaries.manage
events.view
events.manage
events.publish
notifications.view
notification-settings.manage-own
```

## 5. Kiểm thử

- Test chuyển đổi ngày âm/dương.
- Test tạo ngày giỗ từ hồ sơ người đã khuất.
- Test lấy lịch theo tháng/năm.
- Test phạm vi thông báo theo chi.
- Test không gửi nhắc lịch trùng.
- Test ẩn thông tin không đủ quyền.

## 6. Ngoài phạm vi

- Zalo/SMS.
- Đăng ký tham dự sự kiện.
- Album ảnh sự kiện.
- Bài viết liên kết sự kiện, phần này chuyển sang giai đoạn 3.
- Quản lý quỹ hoặc đóng góp sự kiện.

