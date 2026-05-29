# Giai đoạn 03 - Checklist nghiệm thu cổng thông tin, bài viết và tư liệu dòng họ

## 1. Điều kiện trước nghiệm thu

- [ ] Dữ liệu dòng họ và chi/nhánh đã có.
- [ ] Dữ liệu sự kiện từ giai đoạn 2 đã có hoặc UI xử lý được khi chưa có.
- [ ] Đã chốt chuyên mục nội dung.
- [ ] Đã chốt giới hạn upload file.

## 2. Nội dung và chuyên mục

- [ ] Có model chuyên mục.
- [ ] Có model bài viết.
- [ ] Có trạng thái draft.
- [ ] Có trạng thái published.
- [ ] Có trạng thái hidden.
- [ ] Slug bài viết không bị trùng.
- [ ] Bài viết có thể ghim nổi bật.
- [ ] Bài viết có phạm vi hiển thị.

## 3. Cổng thông tin

- [ ] Trang chủ mở được.
- [ ] Trang chủ không lỗi khi chưa có nhiều dữ liệu.
- [ ] Trang giới thiệu mở được.
- [ ] Trang lịch sử hoặc nội dung truyền thống mở được.
- [ ] Danh sách bài viết mở được.
- [ ] Chi tiết bài viết mở được bằng slug.
- [ ] Danh sách album mở được.
- [ ] Chi tiết album mở được.

## 4. Quản trị nội dung

- [ ] Có thể tạo bài viết.
- [ ] Có thể lưu nháp.
- [ ] Có thể chỉnh sửa bài viết.
- [ ] Có thể publish bài viết.
- [ ] Có thể hạ bài.
- [ ] Có thể ghim hoặc bỏ ghim bài viết.
- [ ] Có thể quản lý chuyên mục.
- [ ] Có thể cập nhật nội dung trang giới thiệu.

## 5. Album và media

- [ ] Có thể tạo album.
- [ ] Có thể sửa album.
- [ ] Có thể đặt ảnh đại diện album.
- [ ] Có thể upload ảnh.
- [ ] Có thể upload tài liệu nếu được phép.
- [ ] File sai loại bị chặn.
- [ ] File vượt dung lượng bị chặn.
- [ ] Có thể cập nhật caption.
- [ ] Có thể xóa mềm media.

## 6. Liên kết sự kiện và quyền

- [ ] Bài viết liên kết được với sự kiện.
- [ ] Album liên kết được với sự kiện.
- [ ] Người thiếu quyền không publish nội dung được.
- [ ] Trưởng chi chỉ quản lý nội dung thuộc phạm vi được cấp.
- [ ] Khách chỉ xem được nội dung public.
- [ ] Nội dung branch không hiển thị sai phạm vi.

## 7. Kiểm thử và build

- [ ] Backend test bài viết pass.
- [ ] Backend test album/media pass.
- [ ] Frontend test trang public chính pass.
- [ ] Test upload pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 8. Điều kiện nghiệm thu cuối

- [ ] Cổng thông tin vận hành được.
- [ ] Trưởng họ hoặc admin đăng được thông báo/bài viết.
- [ ] Album và tài liệu lưu trữ được.
- [ ] Nội dung liên kết được với sự kiện.

