# Giai đoạn 03 - Checklist nghiệm thu cổng thông tin dòng họ

## 1. Nội dung và chuyên mục

- [ ] Có model hoặc bảng chuyên mục.
- [ ] Có model hoặc bảng bài viết.
- [ ] Có trạng thái nháp.
- [ ] Có trạng thái đã xuất bản.
- [ ] Có trạng thái ẩn hoặc hạ bài.
- [ ] Có phạm vi hiển thị công khai.
- [ ] Có phạm vi hiển thị thành viên.
- [ ] Có phạm vi hiển thị theo chi/nhánh nếu thiết kế.
- [ ] Slug bài viết không bị trùng.
- [ ] Bài viết có thể ghim nổi bật.

## 2. Trang công khai

- [ ] Trang chủ mở được với dữ liệu thật hoặc trạng thái rỗng.
- [ ] Trang chủ hiển thị giới thiệu ngắn.
- [ ] Trang chủ hiển thị thông báo/bài viết nổi bật.
- [ ] Trang chủ hiển thị sự kiện sắp tới nếu có.
- [ ] Trang chủ hiển thị album nổi bật nếu có.
- [ ] Trang giới thiệu dòng họ mở được.
- [ ] Trang lịch sử dòng họ mở được.
- [ ] Trang từ đường/nhà thờ họ mở được.
- [ ] Danh sách bài viết mở được.
- [ ] Chi tiết bài viết mở được bằng slug.
- [ ] Danh sách album mở được.
- [ ] Chi tiết album mở được.

## 3. Quản trị bài viết

- [ ] Danh sách bài viết có phân trang hoặc tải dữ liệu ổn định.
- [ ] Có thể lọc bài viết theo trạng thái.
- [ ] Có thể lọc bài viết theo chuyên mục.
- [ ] Có thể tạo bài viết mới.
- [ ] Có thể lưu nháp.
- [ ] Có thể chỉnh sửa bài viết.
- [ ] Có thể xuất bản bài viết.
- [ ] Có thể hạ bài.
- [ ] Có thể ghim hoặc bỏ ghim bài viết.
- [ ] Form bài viết validate tiêu đề.
- [ ] Form bài viết validate chuyên mục nếu bắt buộc.

## 4. Album và media

- [ ] Có thể tạo album.
- [ ] Có thể sửa album.
- [ ] Có thể đặt ảnh đại diện album.
- [ ] Có thể upload ảnh vào album.
- [ ] Có thể upload tài liệu nếu được phép.
- [ ] Có kiểm tra loại file.
- [ ] Có kiểm tra dung lượng file.
- [ ] Có thể cập nhật caption media.
- [ ] Có thể xóa mềm media.
- [ ] Media chỉ hiển thị đúng phạm vi quyền.

## 5. Liên kết sự kiện

- [ ] Bài viết có thể liên kết với sự kiện.
- [ ] Album có thể liên kết với sự kiện.
- [ ] Từ chi tiết sự kiện mở được bài viết liên quan.
- [ ] Từ bài viết mở được sự kiện liên quan.
- [ ] Trang chủ hiển thị đúng sự kiện và bài viết liên quan nếu có.

## 6. Quyền và bảo mật

- [ ] Khách chỉ xem được nội dung công khai.
- [ ] Thành viên đăng nhập xem được nội dung nội bộ.
- [ ] Người thiếu quyền không vào được màn hình quản trị nội dung.
- [ ] Người thiếu quyền không publish bài viết được.
- [ ] File nội bộ không bị truy cập công khai sai quyền.
- [ ] Audit log ghi nhận thao tác publish/hide nếu hệ thống hỗ trợ.

## 7. Kiểm thử và build

- [ ] Backend test bài viết pass.
- [ ] Backend test album/media pass.
- [ ] Frontend test trang danh sách/chi tiết bài viết pass.
- [ ] Upload test với file hợp lệ pass.
- [ ] Upload test với file không hợp lệ bị chặn.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 8. Điều kiện nghiệm thu cuối

- [ ] Cổng thông tin công khai hoạt động.
- [ ] Ban chấp hành hoặc biên tập viên có thể đăng thông báo/bài viết.
- [ ] Thành viên chỉ xem được nội dung đúng quyền.
- [ ] Album/tài liệu có thể phục vụ lưu trữ tư liệu dòng họ.
- [ ] Hệ thống đủ nền tảng để triển khai kiểm duyệt nâng cao ở giai đoạn 4.

