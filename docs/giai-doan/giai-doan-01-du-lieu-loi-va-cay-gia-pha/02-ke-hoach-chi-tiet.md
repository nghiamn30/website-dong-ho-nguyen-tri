# Giai đoạn 01 - Kế hoạch chi tiết nền tảng dữ liệu, tổ chức và phân quyền

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống có dữ liệu lõi để quản lý dòng họ, chi/nhánh, thành viên, quan hệ gia đình và phả đồ lấy thủy tổ làm gốc.

## 2. Căn cứ từ nghiên cứu

- Dự án đã có auth, role/permission, audit log, layout và UI nền tảng.
- Giai đoạn này xây mới các module nghiệp vụ lõi, không xây lịch giỗ, bài viết, album hoặc kiểm duyệt nâng cao.
- Thông tin cá nhân trong gia phả được xem bởi mọi người, không phân quyền đọc.
- Phân quyền chỉ áp dụng cho thao tác quản trị dữ liệu.
- Quyết định G01-M01: chưa dùng React Flow trong giai đoạn 1; phả đồ dùng React/CSS phân cấp, không thêm dependency mới.
- Vai trò áp dụng: admin, trưởng họ, trưởng chi, người bình thường.

## 3. Các mốc công việc trong giai đoạn

| Mốc | Nội dung trọng tâm | Kết quả cần đạt |
|---|---|---|
| G01-M01 | Chốt dữ liệu lõi và giải pháp phả đồ | Có schema nghiệp vụ và quyết định chưa dùng React Flow ở giai đoạn 1 |
| G01-M02 | Triển khai database và seed quyền | Có migration, index, enum và 4 role nghiệp vụ |
| G01-M03 | Triển khai backend API lõi | API dòng họ, chi/nhánh, thành viên, quan hệ và phả đồ hoạt động |
| G01-M04 | Triển khai giao diện quản trị | Quản trị nhập được dữ liệu phả hệ ban đầu |
| G01-M05 | Triển khai giao diện xem/tra cứu | Người dùng xem được phả đồ và hồ sơ cá nhân |
| G01-M06 | Kiểm thử và nghiệm thu | Test, lint, build pass và checklist nghiệm thu đạt |

## 4. Kế hoạch triển khai theo mốc

### G01-M01 - Chốt dữ liệu lõi và giải pháp phả đồ

- Chốt model `Clan`, `Branch`, `Person`, `Relationship`.
- Chốt `founder_person_id` để xác định thủy tổ.
- Chốt `head_person_id` hoặc `is_branch_head` để xác định người đứng đầu chi/nhánh.
- Chốt chưa dùng React Flow ở giai đoạn 1 để giữ dependency gọn và giảm rủi ro khi dữ liệu còn nhỏ.
- Triển khai phả đồ bằng React/CSS phân cấp có kiểm soát.
- Ghi lại điều kiện xem xét React Flow ở giai đoạn sau: cây lớn, cần zoom/pan nâng cao, kéo thả node hoặc export phức tạp.

### G01-M02 - Database và quyền

- Tạo migration cho các bảng nghiệp vụ.
- Thêm index tìm kiếm theo tên, đời và chi/nhánh.
- Seed 4 role: admin, trưởng họ, trưởng chi, người bình thường.
- Seed permission thao tác: quản lý dòng họ, chi/nhánh, thành viên, quan hệ.
- Không tạo permission đọc hồ sơ cá nhân vì dữ liệu đọc không phân quyền.

### G01-M03 - Backend API

| Nhóm | API cần có |
|---|---|
| Clan | Lấy/cập nhật thông tin dòng họ |
| Branch | CRUD chi/nhánh, lấy cây chi/nhánh |
| Person | CRUD thành viên, tìm kiếm, xem chi tiết |
| Relationship | Gắn/gỡ cha mẹ, vợ/chồng, con |
| Family tree | Lấy phả đồ từ thủy tổ, theo chi, theo thành viên |

Yêu cầu:

- Validate dữ liệu bằng DTO.
- Chặn xóa cứng dữ liệu có quan hệ.
- Ghi audit log khi thay đổi dữ liệu.
- Trả lỗi rõ khi quan hệ không hợp lệ.

### G01-M04 - Frontend quản trị

Routes đề xuất:

```text
/genealogy
/genealogy/clan
/genealogy/branches
/genealogy/persons
/genealogy/persons/[id]
/genealogy/relationships
```

Màn hình cần có:

- Tổng quan dữ liệu phả hệ.
- Cấu hình dòng họ và thủy tổ.
- Quản lý chi/nhánh dạng cây.
- Danh sách và form thành viên.
- Trình gắn quan hệ gia đình.

### G01-M05 - Frontend xem/tra cứu

Routes đề xuất:

```text
/family-tree
/family-tree/branches/[id]
/people
/people/[id]
```

Màn hình cần có:

- Cây gia phả toàn họ bắt đầu từ thủy tổ.
- Cây gia phả theo chi/nhánh.
- Tìm kiếm thành viên.
- Hồ sơ cá nhân dạng đọc, không kiểm tra role đọc.

### G01-M06 - Kiểm thử

- Test CRUD dòng họ, chi/nhánh, thành viên.
- Test gắn quan hệ hợp lệ và không hợp lệ.
- Test cây phả hệ từ thủy tổ.
- Test trưởng chi chỉ sửa được dữ liệu thuộc chi nếu đã áp dụng phạm vi.
- Test mọi vai trò đều xem được hồ sơ và cây phả hệ.
- Chạy lint, test và build.

## 5. Kết quả bàn giao

- Migration dữ liệu lõi.
- API nghiệp vụ giai đoạn 1.
- UI quản trị và xem phả đồ.
- Quyết định chưa dùng React Flow trong giai đoạn 1.
- Seed role/permission nghiệp vụ.
- Checklist nghiệm thu hoàn tất.

## 6. Ngoài phạm vi

- Ngày giỗ âm lịch.
- Sự kiện và nhắc lịch.
- Bài viết, album, tài liệu.
- Quy trình duyệt nâng cao.
- Xuất PDF/ảnh, QR code, tra cứu xưng hô.
