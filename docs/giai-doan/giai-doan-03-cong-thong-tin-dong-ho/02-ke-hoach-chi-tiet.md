# Giai đoạn 03 - Kế hoạch chi tiết cổng thông tin, bài viết và tư liệu dòng họ

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống có cổng thông tin dòng họ, quản trị được bài viết/thông báo, album, tài liệu và liên kết nội dung với sự kiện.

## 2. Căn cứ từ nghiên cứu

- Dữ liệu dòng họ, chi/nhánh và sự kiện đã có từ giai đoạn trước.
- Nội dung cần có workflow nháp, xuất bản và hạ bài.
- Upload media phải kiểm soát loại file, dung lượng và quyền xem.
- Không thêm role mới ngoài 4 role đã thống nhất.
- Trang chủ phải hoạt động cả khi dữ liệu nội dung còn ít.

## 3. Các mốc công việc trong giai đoạn

| Mốc | Nội dung trọng tâm | Kết quả cần đạt |
|---|---|---|
| G03-M01 | Chốt taxonomy và cấu trúc nội dung | Có chuyên mục, trạng thái bài viết và phạm vi hiển thị |
| G03-M02 | Triển khai database nội dung/media | Có model bài viết, chuyên mục, album, media và page content |
| G03-M03 | Triển khai backend API | API public content, post admin, category, album, media hoạt động |
| G03-M04 | Triển khai cổng thông tin | Trang chủ, giới thiệu, tin tức và thư viện mở được |
| G03-M05 | Triển khai quản trị nội dung | Tạo bài, publish, quản lý album và upload media được |
| G03-M06 | Kiểm thử và nghiệm thu | Visibility, upload, liên kết sự kiện, lint và build đạt |

## 4. Kế hoạch triển khai theo mốc

### G03-M01 - Taxonomy và nội dung

- Chốt chuyên mục: thông báo, hoạt động, tin vui, tin buồn, tư liệu, văn bản.
- Chốt trạng thái: draft, published, hidden.
- Chốt phạm vi: public, members, branch, leadership.
- Chốt nội dung trang giới thiệu và trang chủ.

### G03-M02 - Database

- Tạo model `Category`, `Post`, `Album`, `Media`, `PageContent`.
- Thêm liên kết bài viết/album với `Event`.
- Thêm index theo slug, status, category và branch.
- Thiết kế lưu file theo cấu hình hiện tại của dự án.

### G03-M03 - Backend API

| Nhóm | API cần có |
|---|---|
| Public | Trang chủ, bài viết public, album public |
| Post admin | CRUD, publish, hide, pin |
| Category | CRUD chuyên mục |
| Album | CRUD album, chọn ảnh đại diện |
| Media | Upload, cập nhật caption, xóa mềm |
| Page content | Cập nhật giới thiệu, lịch sử, từ đường |

### G03-M04 - Cổng thông tin

Routes đề xuất:

```text
/
/gioi-thieu
/gioi-thieu/lich-su
/gioi-thieu/thuy-to
/gioi-thieu/tu-duong
/tin-tuc
/tin-tuc/[slug]
/thu-vien
/thu-vien/[id]
```

### G03-M05 - Quản trị nội dung

Routes đề xuất:

```text
/content/posts
/content/posts/new
/content/posts/[id]
/content/categories
/content/albums
/content/media
/content/pages
```

Màn hình cần có:

- Danh sách bài viết.
- Form soạn bài.
- Quản lý chuyên mục.
- Quản lý album.
- Upload media.
- Quản lý nội dung giới thiệu.

### G03-M06 - Kiểm thử

- Test public/member/branch visibility.
- Test slug không trùng.
- Test publish/hide/pin.
- Test upload file hợp lệ và không hợp lệ.
- Test liên kết bài viết/album với sự kiện.
- Test trang chủ khi không có dữ liệu.

## 5. Permission đề xuất

```text
posts.manage
posts.publish
categories.manage
albums.manage
media.upload
media.manage
pages.manage
```

## 6. Ngoài phạm vi

- Bình luận.
- Duyệt nội dung nhiều cấp.
- SEO nâng cao.
- Tối ưu xử lý ảnh nâng cao.
- Livestream hoặc video processing.

