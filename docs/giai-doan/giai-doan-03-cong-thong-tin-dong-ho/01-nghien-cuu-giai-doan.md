# Nghiên cứu giai đoạn 3: Cổng thông tin, bài viết và tư liệu dòng họ

## 1. Bối cảnh

### Dự án đã có những gì

- Nền tảng kỹ thuật, auth, role/permission, audit log và UI system đã có.
- Sau giai đoạn 1, hệ thống đã có dữ liệu dòng họ, chi/nhánh, thành viên và phả đồ.
- Sau giai đoạn 2, hệ thống đã có ngày giỗ, sự kiện và lịch nhắc.
- Chưa có cổng thông tin công khai, bài viết, thông báo, album, tài liệu và trang giới thiệu nội dung.
- Chưa có cơ chế upload/tổ chức media nghiệp vụ dòng họ.

Giai đoạn 3 biến hệ thống từ nơi lưu dữ liệu phả hệ thành cổng thông tin dòng họ: giới thiệu, thông báo, hoạt động, tin vui, tin buồn, ảnh và tài liệu.

## 2. Vai trò áp dụng

| Vai trò | Phạm vi trong giai đoạn 3 |
|---|---|
| Admin | Quản lý toàn bộ nội dung, chuyên mục, media và cấu hình trang |
| Trưởng họ | Đăng/publish thông báo toàn họ, nội dung giới thiệu và hoạt động lớn |
| Trưởng chi | Đăng nội dung, album và thông báo thuộc chi/nhánh phụ trách nếu được cấp quyền |
| Người bình thường | Xem nội dung đã publish theo phạm vi hiển thị |

Giai đoạn này không thêm role mới. Nếu sau này cần biên tập viên riêng thì đưa vào giai đoạn quản trị nâng cao hoặc mở rộng.

## 3. Module cần xây dựng

| Module | Mục tiêu |
|---|---|
| Trang chủ/cổng thông tin | Hiển thị giới thiệu, sự kiện, thông báo, bài viết và album nổi bật |
| Trang giới thiệu | Lịch sử dòng họ, thủy tổ, từ đường, quy ước, ban chấp hành |
| Chuyên mục | Phân loại bài viết và thông báo |
| Bài viết/thông báo | Soạn, lưu nháp, publish, hạ bài, ghim bài |
| Album | Tạo album ảnh/tài liệu theo sự kiện, chi/nhánh hoặc chủ đề |
| Media | Upload ảnh, tài liệu và metadata |
| Liên kết sự kiện | Gắn bài viết/album với sự kiện từ giai đoạn 2 |

## 4. Hiện trạng và khoảng cách

| Nội dung | Hiện trạng | Khoảng cách cần xử lý |
|---|---|---|
| Trang chủ nghiệp vụ | Chưa có | Cần thiết kế cổng thông tin dòng họ |
| Nội dung giới thiệu | Chưa có model | Cần page content hoặc post type riêng |
| Bài viết | Chưa có | Cần model, workflow nháp/publish |
| Chuyên mục | Chưa có | Cần taxonomy nội dung |
| Album/media | Chưa có | Cần upload, quyền xem, lưu file |
| Liên kết sự kiện | Sự kiện có từ giai đoạn 2 | Cần gắn bài viết/album với event |

## 5. Dữ liệu đề xuất

### Category

- `id`
- `name`
- `slug`
- `description`
- `display_order`
- `status`
- `created_at`
- `updated_at`

### Post

- `id`
- `clan_id`
- `branch_id`
- `category_id`
- `related_event_id`
- `title`
- `slug`
- `summary`
- `content`
- `thumbnail_url`
- `visibility_scope`
- `is_pinned`
- `status`
- `author_id`
- `published_at`
- `created_at`
- `updated_at`

### Album

- `id`
- `clan_id`
- `branch_id`
- `related_event_id`
- `title`
- `description`
- `cover_media_id`
- `visibility_scope`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### Media

- `id`
- `album_id`
- `person_id`
- `event_id`
- `file_type`
- `file_url`
- `file_name`
- `mime_type`
- `file_size`
- `caption`
- `uploaded_by`
- `created_at`

### PageContent

- `id`
- `key`
- `title`
- `content`
- `updated_by`
- `updated_at`

## 6. Quyết định thiết kế

1. Cổng thông tin là phần nội dung độc lập, không làm thay đổi dữ liệu phả hệ.
2. Bài viết có trạng thái tối thiểu: draft, published, hidden.
3. Nội dung có phạm vi hiển thị: public, members, branch, leadership.
4. Trưởng họ có quyền publish nội dung toàn họ.
5. Trưởng chi chỉ publish hoặc quản lý nội dung thuộc chi nếu được phân quyền.
6. Bài viết và album có thể liên kết với sự kiện từ giai đoạn 2.
7. Upload media phải kiểm soát loại file, dung lượng và quyền xem.
8. Trang chủ phải chịu được trạng thái ít dữ liệu, không được lỗi khi chưa có bài viết hoặc album.

