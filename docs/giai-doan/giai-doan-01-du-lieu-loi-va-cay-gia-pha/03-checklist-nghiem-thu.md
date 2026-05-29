# Giai đoạn 01 - Checklist nghiệm thu dữ liệu lõi và cây gia phả

## 1. Database

- [ ] Có migration tạo bảng dòng họ.
- [ ] Có migration tạo bảng chi/nhánh nhiều tầng.
- [ ] Có migration tạo bảng thành viên.
- [ ] Có migration tạo bảng quan hệ gia đình.
- [ ] Có enum hoặc ràng buộc cho loại quan hệ.
- [ ] Có enum hoặc ràng buộc cho trạng thái sống/mất.
- [ ] Có cột quyền riêng tư cơ bản cho hồ sơ thành viên.
- [ ] Có index phục vụ tìm kiếm theo tên.
- [ ] Có index phục vụ lọc theo chi/nhánh.
- [ ] Có ràng buộc tránh dữ liệu quan hệ mồ côi.

## 2. Backend

- [ ] API lấy thông tin dòng họ hoạt động.
- [ ] API cập nhật thông tin dòng họ có kiểm tra quyền.
- [ ] API tạo chi/nhánh hoạt động.
- [ ] API sửa chi/nhánh hoạt động.
- [ ] API xóa mềm hoặc vô hiệu hóa chi/nhánh hoạt động.
- [ ] API lấy cây chi/nhánh trả đúng cấu trúc phân cấp.
- [ ] API tạo thành viên hoạt động.
- [ ] API sửa hồ sơ thành viên hoạt động.
- [ ] API tìm kiếm thành viên theo tên hoạt động.
- [ ] API lọc thành viên theo chi/nhánh hoạt động.
- [ ] API xem chi tiết thành viên hoạt động.
- [ ] API gắn cha/mẹ hoạt động.
- [ ] API gắn vợ/chồng hoạt động.
- [ ] API gắn con hoạt động.
- [ ] API gỡ quan hệ có kiểm tra quyền.
- [ ] API lấy phả đồ toàn họ hoạt động.
- [ ] API lấy phả đồ theo chi/nhánh hoạt động.
- [ ] API trả lỗi rõ ràng khi gắn quan hệ không hợp lệ.
- [ ] Các API thay đổi dữ liệu được bảo vệ bằng permission guard.

## 3. Frontend quản trị

- [ ] Sidebar có nhóm menu phả hệ phù hợp.
- [ ] Trang cấu hình dòng họ hiển thị và lưu được dữ liệu.
- [ ] Trang danh sách chi/nhánh hiển thị dạng cây hoặc phân cấp rõ ràng.
- [ ] Form tạo chi/nhánh validate dữ liệu bắt buộc.
- [ ] Form sửa chi/nhánh hoạt động.
- [ ] Trang danh sách thành viên có tìm kiếm.
- [ ] Trang danh sách thành viên có lọc theo chi/nhánh.
- [ ] Form tạo thành viên hoạt động.
- [ ] Form sửa thành viên hoạt động.
- [ ] Trang chi tiết thành viên hiển thị quan hệ chính.
- [ ] Trình gắn quan hệ gia đình hoạt động ở mức cơ bản.
- [ ] Trạng thái loading, empty và error được xử lý.

## 4. Frontend người dùng

- [ ] Trang cây gia phả toàn họ mở được.
- [ ] Trang cây gia phả theo chi/nhánh mở được.
- [ ] Node thành viên hiển thị thông tin tối thiểu.
- [ ] Click vào node mở được hồ sơ hoặc panel thông tin nhanh.
- [ ] Tìm kiếm thành viên từ giao diện người dùng hoạt động.
- [ ] Hồ sơ người đang sống ẩn thông tin nhạy cảm khi không đủ quyền.
- [ ] Trang không có dữ liệu hiển thị thông báo phù hợp.

## 5. Quyền và bảo mật

- [ ] Người chưa đăng nhập không truy cập được trang quản trị.
- [ ] Người thiếu quyền không tạo/sửa/xóa dữ liệu phả hệ được.
- [ ] Thành viên chỉ xem được dữ liệu theo cấu hình quyền xem.
- [ ] Thông tin nhạy cảm của người đang sống không bị lộ ở trang công khai.
- [ ] Audit log ghi nhận các thao tác tạo/sửa/xóa quan trọng nếu hệ thống hỗ trợ.

## 6. Kiểm thử và build

- [ ] Backend unit test pass.
- [ ] Backend API/e2e test chính pass.
- [ ] Frontend test chính pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.
- [ ] Dev server frontend chạy được.
- [ ] Dev server backend chạy được.

## 7. Điều kiện nghiệm thu cuối

- [ ] Quản trị có thể tạo dòng họ, chi/nhánh, thành viên và quan hệ.
- [ ] Thành viên có thể xem cây gia phả và tra cứu hồ sơ được phép.
- [ ] Dữ liệu phả hệ đủ ổn định để triển khai lịch giỗ ở giai đoạn 2.

