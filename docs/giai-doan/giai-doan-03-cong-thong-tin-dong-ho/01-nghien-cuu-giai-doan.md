# Giai đoạn 03 - Nghiên cứu cổng thông tin dòng họ

## 1. Cơ sở nghiên cứu

Tài liệu này được tách từ `docs/nghien-cuu.md`, trọng tâm là:

- Trang chủ công khai.
- Giới thiệu dòng họ và tư liệu lịch sử.
- Thông báo, bài viết và hoạt động dòng họ.
- Thư viện ảnh và tài liệu.
- Liên kết bài viết với sự kiện.

## 2. Mục tiêu giai đoạn

Xây dựng cổng thông tin để dòng họ có không gian công bố và lưu giữ nội dung:

- Trang chủ công khai.
- Trang giới thiệu, lịch sử, thủy tổ, từ đường, quy ước, ban chấp hành.
- Bài viết và thông báo.
- Hoạt động, tin vui, tin buồn.
- Album ảnh và tài liệu.
- Liên kết bài viết, album với sự kiện đã có ở giai đoạn 2.

## 3. Đối tượng sử dụng

| Đối tượng | Nhu cầu |
|---|---|
| Khách truy cập | Xem nội dung công khai |
| Thành viên dòng họ | Xem nội dung nội bộ theo quyền |
| Biên tập viên | Soạn bài, tải ảnh, quản lý album |
| Ban chấp hành | Duyệt/publish thông báo quan trọng |
| Quản trị | Quản lý cấu hình, chuyên mục và quyền |

## 4. Nhóm nội dung chính

| Nhóm | Ví dụ |
|---|---|
| Giới thiệu | Lịch sử dòng họ, thủy tổ, từ đường, quy ước |
| Thông báo | Mời họp họ, giỗ tổ, thông báo từ ban chấp hành |
| Hoạt động | Gặp mặt, lễ đầu xuân, khuyến học |
| Tin vui | Cưới hỏi, mừng thọ, thành tích học tập |
| Tin buồn | Cáo phó, tang lễ, chia buồn |
| Tư liệu | Phả ký, ảnh xưa, văn bản, tài liệu scan |

## 5. Quy tắc hiển thị

1. Nội dung có phạm vi công khai được hiển thị cho khách truy cập.
2. Nội dung nội bộ chỉ hiển thị sau đăng nhập.
3. Nội dung theo chi chỉ hiển thị với thành viên thuộc chi hoặc người có quyền.
4. Tin buồn, ảnh tư liệu và tài liệu gia đình cần có quyền hiển thị rõ ràng.
5. Bài viết liên kết sự kiện phải mở được từ trang chi tiết sự kiện.
6. Album liên kết sự kiện hoặc bài viết phải giữ được ngữ cảnh.

## 6. Thực thể nghiệp vụ

| Thực thể | Vai trò |
|---|---|
| Post | Bài viết, thông báo, tin tức |
| Category | Phân loại nội dung |
| Album | Nhóm ảnh/tư liệu |
| Media | File ảnh, video, tài liệu, âm thanh |
| PageContent | Nội dung trang giới thiệu tĩnh hoặc bán tĩnh |

## 7. Màn hình cần nghiên cứu chi tiết

### Khu vực công khai

- Trang chủ.
- Trang giới thiệu dòng họ.
- Trang lịch sử dòng họ.
- Trang từ đường/nhà thờ họ.
- Trang quy ước dòng họ.
- Danh sách bài viết.
- Chi tiết bài viết.
- Danh sách album.
- Chi tiết album.

### Khu vực quản trị

- Quản lý bài viết.
- Form soạn bài.
- Quản lý chuyên mục.
- Quản lý album.
- Upload media.
- Quản lý nội dung trang giới thiệu.

## 8. Rủi ro cần xử lý

- Công khai nhầm nội dung nội bộ.
- Upload file không kiểm soát dung lượng hoặc loại file.
- Bài viết thiếu trạng thái nháp/xuất bản.
- Ảnh/tài liệu không có quyền xem rõ ràng.
- Nội dung trang chủ quá phụ thuộc dữ liệu chưa có.

## 9. Kết quả nghiên cứu cần đạt

- Taxonomy nội dung chính thức.
- Quy tắc trạng thái bài viết.
- Quy tắc upload và quyền xem media.
- Cấu trúc trang chủ.
- Danh sách API bài viết, album, media.
- Danh sách màn hình quản trị nội dung.

