# Giai đoạn 01 - Kế hoạch chi tiết dữ liệu lõi và cây gia phả

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống phải cho phép quản trị tạo bộ dữ liệu phả hệ ban đầu, xem được cây gia phả và tra cứu thành viên ở mức nền tảng.

## 2. Nguyên tắc triển khai

- Tận dụng authentication, permission guard, API client, layout và UI system hiện có.
- Không xây dựng các chức năng lịch giỗ, bài viết, album hoặc kiểm duyệt nâng cao trong giai đoạn này.
- Ưu tiên dữ liệu đúng và có thể mở rộng hơn là giao diện phả đồ quá phức tạp.
- Mọi API thay đổi dữ liệu cần lưu audit log nếu nền tảng đã hỗ trợ.

## 3. Thứ tự triển khai đề xuất

### Bước 1 - Chốt đặc tả dữ liệu

- Chốt mô hình `Clan`, `Branch`, `Person`, `Relationship`.
- Chốt enum cho giới tính, trạng thái sống/mất, loại quan hệ, quyền riêng tư.
- Chốt quy tắc chống trùng thành viên.
- Chốt cách lưu cây chi/nhánh nhiều tầng.

### Bước 2 - Cập nhật database

- Tạo migration cho các bảng nghiệp vụ giai đoạn 1.
- Thêm index cho tìm kiếm thành viên theo tên, chi/nhánh, đời.
- Thêm ràng buộc quan hệ để hạn chế dữ liệu mồ côi.
- Chuẩn bị seed dữ liệu mẫu rất nhỏ để test luồng, không dùng mock data nghiệp vụ lớn.

### Bước 3 - Backend API

Nhóm API cần có:

| Nhóm | API đề xuất |
|---|---|
| Clan | Lấy/cập nhật thông tin dòng họ |
| Branch | Tạo, sửa, xóa mềm, lấy cây chi/nhánh |
| Person | Tạo, sửa, xóa mềm, tìm kiếm, xem chi tiết |
| Relationship | Gắn, sửa, gỡ quan hệ gia đình |
| Family tree | Lấy phả đồ toàn họ, theo chi, theo một thành viên |

Yêu cầu backend:

- Validate dữ liệu đầu vào bằng DTO.
- Kiểm tra quyền theo permission guard.
- Không cho xóa cứng bản ghi quan trọng.
- Trả lỗi nghiệp vụ rõ ràng khi quan hệ không hợp lệ.

### Bước 4 - Frontend quản trị

Routes quản trị đề xuất:

```text
/genealogy
/genealogy/clan
/genealogy/branches
/genealogy/persons
/genealogy/persons/[id]
/genealogy/relationships
```

Màn hình cần triển khai:

- Tổng quan dữ liệu phả hệ.
- Cấu hình thông tin dòng họ.
- Quản lý chi/nhánh dạng cây.
- Danh sách thành viên có lọc/tìm kiếm.
- Form hồ sơ thành viên.
- Form gắn quan hệ cha/mẹ/vợ/chồng/con.

### Bước 5 - Frontend người dùng

Routes người dùng đề xuất:

```text
/family-tree
/family-tree/branches/[id]
/people
/people/[id]
```

Màn hình cần triển khai:

- Cây gia phả toàn họ.
- Bộ lọc theo chi/nhánh.
- Tìm kiếm thành viên.
- Hồ sơ thành viên dạng đọc.
- Trạng thái rỗng khi chưa có dữ liệu.

### Bước 6 - Permission tối thiểu

Permission đề xuất:

```text
clan.view
clan.manage
branches.view
branches.manage
persons.view
persons.manage
relationships.manage
family-tree.view
```

Vai trò giai đoạn đầu:

- Admin: toàn quyền.
- Ban phả / ban chấp hành: quản lý phả hệ.
- Thành viên: xem dữ liệu được phép.

### Bước 7 - Kiểm thử

- Unit test service xử lý chi/nhánh và quan hệ.
- API test cho CRUD chính.
- Test validation quan hệ sai.
- Frontend test cho các form quan trọng.
- Build production sau khi hoàn tất.

## 4. Kết quả bàn giao

- Database migration giai đoạn 1.
- Backend API cho dòng họ, chi/nhánh, thành viên, quan hệ và cây gia phả.
- Frontend route và màn hình quản trị cơ bản.
- Frontend route xem phả đồ và tra cứu thành viên.
- Permission seed tương ứng.
- Tài liệu cập nhật nếu có thay đổi so với kế hoạch.

## 5. Ngoài phạm vi

- Ngày giỗ âm lịch.
- Sự kiện, nhắc lịch và email.
- Bài viết, album, tài liệu.
- Quy trình đề xuất/duyệt thay đổi nâng cao.
- Xuất PDF/ảnh, QR code, xưng hô.

