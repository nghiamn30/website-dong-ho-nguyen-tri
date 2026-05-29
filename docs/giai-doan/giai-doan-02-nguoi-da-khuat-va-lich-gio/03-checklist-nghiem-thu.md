# Giai đoạn 02 - Checklist nghiệm thu người đã khuất và lịch giỗ

## 1. Hồ sơ người đã khuất

- [ ] Hồ sơ thành viên có trạng thái đã khuất.
- [ ] Có thể nhập ngày mất.
- [ ] Có thể nhập loại lịch cho ngày mất nếu được thiết kế.
- [ ] Có thể nhập nơi an táng.
- [ ] Có thể nhập ghi chú hoặc bản đồ nơi an táng.
- [ ] Thông tin người đã khuất hiển thị theo quyền riêng tư.
- [ ] Hồ sơ người đang sống không hiển thị nhầm các trường người đã khuất.

## 2. Ngày giỗ

- [ ] Có bảng hoặc model lưu ngày giỗ.
- [ ] Có thể tạo ngày giỗ âm lịch.
- [ ] Có thể đánh dấu tháng nhuận.
- [ ] Có thể cập nhật ngày giỗ.
- [ ] Có thể vô hiệu hóa ngày giỗ.
- [ ] Ngày giỗ liên kết đúng với thành viên đã khuất.
- [ ] Danh sách ngày giỗ lọc được theo tháng.
- [ ] Danh sách ngày giỗ lọc được theo năm.
- [ ] Danh sách ngày giỗ lọc được theo chi/nhánh.

## 3. Sự kiện

- [ ] Có thể tạo sự kiện thủ công.
- [ ] Có thể sửa sự kiện.
- [ ] Có thể hủy sự kiện.
- [ ] Có thể publish sự kiện.
- [ ] Sự kiện có loại sự kiện rõ ràng.
- [ ] Sự kiện có phạm vi hiển thị.
- [ ] Sự kiện có thời gian bắt đầu.
- [ ] Sự kiện có địa điểm nếu cần.
- [ ] Sự kiện tự động từ ngày giỗ được phân biệt với sự kiện thủ công.

## 4. Lịch âm/dương

- [ ] Ngày âm gốc được lưu đầy đủ.
- [ ] Ngày dương quy đổi theo năm được tính đúng theo bộ test đã chốt.
- [ ] Tháng nhuận được xử lý đúng.
- [ ] Trường hợp không quy đổi được có lỗi rõ ràng.
- [ ] Không ghi đè mất dữ liệu ngày âm gốc.

## 5. Thông báo

- [ ] Thành viên xem được danh sách thông báo của mình.
- [ ] Có thể đánh dấu thông báo đã đọc.
- [ ] Người dùng có thể cấu hình nhận nhắc lịch.
- [ ] Job nhắc lịch tạo notification trong website.
- [ ] Email nhắc lịch gửi được khi có cấu hình.
- [ ] Không gửi thông báo trùng cho cùng một mốc nhắc.
- [ ] Phạm vi thông báo theo chi/nhánh hoạt động đúng.

## 6. Frontend

- [ ] Trang lịch tháng hiển thị sự kiện.
- [ ] Trang danh sách sự kiện sắp tới hoạt động.
- [ ] Trang chi tiết sự kiện hoạt động.
- [ ] Trang quản trị ngày giỗ hoạt động.
- [ ] Trang quản trị sự kiện hoạt động.
- [ ] Form ngày giỗ validate dữ liệu bắt buộc.
- [ ] Form sự kiện validate dữ liệu bắt buộc.
- [ ] Trạng thái loading, empty và error được xử lý.

## 7. Quyền và bảo mật

- [ ] Người thiếu quyền không tạo/sửa/xóa ngày giỗ được.
- [ ] Người thiếu quyền không publish sự kiện được.
- [ ] Thành viên chỉ nhận thông báo đúng phạm vi.
- [ ] Thông tin nơi an táng không bị công khai sai quyền.
- [ ] Audit log ghi nhận thao tác quan trọng nếu hệ thống hỗ trợ.

## 8. Kiểm thử và build

- [ ] Test backend cho ngày giỗ pass.
- [ ] Test backend cho sự kiện pass.
- [ ] Test service chuyển đổi lịch pass.
- [ ] Test notification pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.
- [ ] Dev frontend/backend chạy được sau khi merge.

## 9. Điều kiện nghiệm thu cuối

- [ ] Có thể nhập người đã khuất và ngày giỗ âm lịch.
- [ ] Có thể xem lịch giỗ/sự kiện theo tháng.
- [ ] Có thể nhận nhắc lịch trong website và email.
- [ ] Phân hệ lịch đủ ổn định để liên kết bài viết/album ở giai đoạn 3.

