# Giai đoạn 02 - Checklist nghiệm thu người đã khuất, ngày giỗ và lịch nhắc

## 1. Điều kiện trước nghiệm thu

- [ ] Dữ liệu thành viên và chi/nhánh từ giai đoạn 1 hoạt động.
- [ ] Có cách xác định người đứng đầu chi/nhánh.
- [ ] Có quyết định kỹ thuật cho chuyển đổi âm/dương.
- [ ] Có cấu hình email hoặc ghi rõ email chưa bật ở môi trường hiện tại.

## 2. Hồ sơ người đã khuất

- [ ] Có thể cập nhật trạng thái đã khuất.
- [ ] Có thể nhập ngày mất.
- [ ] Có thể nhập nơi an táng.
- [ ] Có thể nhập ghi chú nơi an táng.
- [ ] Người chưa mất không hiển thị nhầm trường ngày mất/ngày giỗ.

## 3. Ngày giỗ và lịch âm

- [ ] Có thể tạo ngày giỗ âm lịch.
- [ ] Có thể lưu tháng nhuận.
- [ ] Có thể sửa ngày giỗ.
- [ ] Có thể vô hiệu hóa ngày giỗ.
- [ ] Ngày âm gốc không bị ghi đè.
- [ ] Ngày dương quy đổi đúng theo bộ test đã chốt.
- [ ] Lịch tháng hiển thị ngày giỗ đúng.

## 4. Logic chi/nhánh nhận nhắc

- [ ] Thành viên có thể được đánh dấu là người đứng đầu chi/nhánh.
- [ ] Ngày giỗ của người đứng đầu chi/nhánh tạo phạm vi nhắc mặc định cho chi/nhánh đó.
- [ ] Trưởng họ/admin có thể đổi phạm vi nhắc.
- [ ] Thành viên ngoài phạm vi không nhận nhắc sai.
- [ ] Trưởng chi quản lý được ngày giỗ trong chi phụ trách.
- [ ] Trưởng chi không quản lý được ngày giỗ ngoài chi.

## 5. Sự kiện và notification

- [ ] Có thể tạo sự kiện thủ công.
- [ ] Có thể publish/hủy sự kiện.
- [ ] Có sự kiện tự động từ ngày giỗ.
- [ ] Danh sách sự kiện sắp tới hoạt động.
- [ ] Notification trong website được tạo đúng mốc.
- [ ] Email gửi được khi cấu hình sẵn sàng.
- [ ] Không gửi notification/email trùng.
- [ ] Người dùng đánh dấu thông báo đã đọc được.

## 6. Frontend

- [ ] Trang lịch tháng mở được.
- [ ] Trang chi tiết sự kiện mở được.
- [ ] Trang quản trị ngày giỗ hoạt động.
- [ ] Trang quản trị sự kiện hoạt động.
- [ ] Trang thông báo cá nhân hoạt động.
- [ ] Form ngày giỗ validate dữ liệu bắt buộc.
- [ ] Trạng thái loading, empty và error được xử lý.

## 7. Kiểm thử và build

- [ ] Test service lịch âm pass.
- [ ] Test logic phạm vi chi/nhánh pass.
- [ ] Test notification pass.
- [ ] Test permission trưởng chi pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 8. Điều kiện nghiệm thu cuối

- [ ] Có thể nhập người đã khuất và ngày giỗ âm lịch.
- [ ] Có thể xem lịch giỗ/sự kiện theo tháng.
- [ ] Có thể nhận nhắc lịch theo đúng chi/nhánh.
- [ ] Phân hệ đủ ổn định để liên kết bài viết/album ở giai đoạn 3.

