# Giai đoạn 03 - Kế hoạch chi tiết cổng thông tin dòng họ

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống phải có cổng thông tin dòng họ vận hành được: khách xem nội dung công khai, thành viên xem nội dung nội bộ, ban chấp hành/biên tập viên đăng bài và quản lý album/tài liệu.

## 2. Điều kiện bắt đầu

- Giai đoạn 1 đã có dữ liệu dòng họ, chi/nhánh và thành viên.
- Giai đoạn 2 đã có sự kiện để liên kết bài viết nếu cần.
- Authentication và permission đã ổn định.

## 3. Thứ tự triển khai đề xuất

### Bước 1 - Thiết kế nội dung

- Chốt nhóm chuyên mục.
- Chốt trạng thái bài viết: draft, published, hidden.
- Chốt phạm vi hiển thị: public, members, branch, council.
- Chốt cấu trúc trang chủ.
- Chốt thông tin tĩnh của trang giới thiệu.

### Bước 2 - Database

- Tạo bảng `Category`.
- Tạo bảng `Post`.
- Tạo bảng `Album`.
- Tạo bảng `Media`.
- Bổ sung liên kết tới `Event` nếu đã có.
- Bổ sung trường phạm vi hiển thị cho nội dung.

### Bước 3 - Backend API

Nhóm API cần có:

| Nhóm | API đề xuất |
|---|---|
| Public content | Lấy trang chủ, bài viết công khai, album công khai |
| Post admin | CRUD bài viết, publish, hide, pin |
| Category | CRUD chuyên mục |
| Album | CRUD album, liên kết sự kiện/bài viết |
| Media | Upload, cập nhật caption, xóa mềm |
| Page content | Cập nhật nội dung giới thiệu, lịch sử, từ đường |

Yêu cầu backend:

- Kiểm tra quyền theo trạng thái và phạm vi hiển thị.
- Validate slug không trùng.
- Kiểm soát loại file upload.
- Không trả file hoặc metadata nội bộ cho người không đủ quyền.

### Bước 4 - Frontend công khai

Routes đề xuất:

```text
/
/gioi-thieu
/gioi-thieu/lich-su
/gioi-thieu/thuy-to
/gioi-thieu/tu-duong
/gioi-thieu/quy-uoc
/tin-tuc
/tin-tuc/[slug]
/thu-vien
/thu-vien/[id]
```

Màn hình cần có:

- Trang chủ có banner, giới thiệu ngắn, thông báo nổi bật, sự kiện sắp tới, bài viết mới, album nổi bật.
- Trang giới thiệu dòng họ.
- Danh sách bài viết theo chuyên mục.
- Chi tiết bài viết.
- Danh sách album.
- Chi tiết album.

### Bước 5 - Frontend quản trị

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

- Danh sách bài viết có lọc theo trạng thái/chuyên mục.
- Form soạn bài.
- Chức năng lưu nháp, đăng bài, hạ bài, ghim bài.
- Quản lý chuyên mục.
- Quản lý album.
- Upload ảnh/tài liệu.
- Quản lý nội dung trang giới thiệu.

### Bước 6 - Permission đề xuất

```text
public-content.manage
posts.view
posts.manage
posts.publish
categories.manage
albums.view
albums.manage
media.upload
media.manage
```

### Bước 7 - Kiểm thử

- Test visibility public/members/branch.
- Test slug bài viết.
- Test publish/hide bài viết.
- Test upload file hợp lệ và không hợp lệ.
- Test trang chủ không lỗi khi thiếu dữ liệu.
- Test liên kết bài viết với sự kiện.

## 4. Ngoài phạm vi

- Quy trình duyệt nội dung nhiều cấp, chuyển sang giai đoạn 4 nếu cần.
- Bình luận bài viết.
- Livestream/video nâng cao.
- Tối ưu SEO chuyên sâu.
- Tự động xử lý ảnh nâng cao.

## 5. Kết quả bàn giao

- Cổng thông tin công khai hoạt động.
- Quản trị nội dung hoạt động.
- Album/tài liệu hoạt động ở mức cơ bản.
- Nội dung liên kết được với sự kiện.
- Quyền xem nội dung công khai/nội bộ/theo chi hoạt động.

