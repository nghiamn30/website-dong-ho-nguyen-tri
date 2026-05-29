# Giai đoạn 01 - Checklist nghiệm thu nền tảng dữ liệu, tổ chức và phân quyền

## 1. Điều kiện trước nghiệm thu

- [ ] Đã có quyết định chưa dùng React Flow trong giai đoạn 1.
- [ ] Đã chốt thủy tổ là node gốc của phả đồ toàn họ.
- [ ] Đã chốt 4 role: admin, trưởng họ, trưởng chi, người bình thường.
- [ ] Đã chốt thông tin cá nhân trong gia phả không phân quyền đọc.

## 2. Database

- [ ] Có bảng hoặc model dòng họ.
- [ ] Có trường xác định thủy tổ.
- [ ] Có bảng hoặc model chi/nhánh nhiều tầng.
- [ ] Có trường xác định người đứng đầu chi/nhánh.
- [ ] Có bảng hoặc model thành viên.
- [ ] Có bảng hoặc model quan hệ gia đình.
- [ ] Có index tìm kiếm theo tên.
- [ ] Có index lọc theo chi/nhánh.
- [ ] Có ràng buộc hạn chế dữ liệu quan hệ mồ côi.

## 3. Backend/API

- [ ] API lấy/cập nhật dòng họ hoạt động.
- [ ] API CRUD chi/nhánh hoạt động.
- [ ] API lấy cây chi/nhánh hoạt động.
- [ ] API CRUD thành viên hoạt động.
- [ ] API tìm kiếm thành viên hoạt động.
- [ ] API gắn cha/mẹ hoạt động.
- [ ] API gắn vợ/chồng hoạt động.
- [ ] API gắn con hoạt động.
- [ ] API lấy phả đồ từ thủy tổ hoạt động.
- [ ] API lấy phả đồ theo chi/nhánh hoạt động.
- [ ] API thay đổi dữ liệu được bảo vệ bằng permission.
- [ ] Thao tác thay đổi dữ liệu có audit log nếu nền tảng hỗ trợ.

## 4. Frontend

- [ ] Trang cấu hình dòng họ hoạt động.
- [ ] Trang quản lý chi/nhánh hoạt động.
- [ ] Trang quản lý thành viên hoạt động.
- [ ] Trang gắn quan hệ hoạt động.
- [ ] Trang phả đồ toàn họ mở được.
- [ ] Phả đồ hiển thị thủy tổ là node gốc.
- [ ] Trang phả đồ theo chi/nhánh mở được.
- [ ] Trang tra cứu thành viên hoạt động.
- [ ] Trang hồ sơ cá nhân mở được cho mọi vai trò.
- [ ] Trạng thái loading, empty và error được xử lý.

## 5. Role và quyền

- [ ] Admin thao tác được toàn hệ thống.
- [ ] Trưởng họ quản lý được dữ liệu toàn họ.
- [ ] Trưởng chi quản lý được dữ liệu trong chi/nhánh được phân công.
- [ ] Người bình thường không sửa được dữ liệu chính thức.
- [ ] Mọi vai trò xem được thông tin cá nhân và cây phả hệ.
- [ ] Không tồn tại chặn quyền đọc hồ sơ cá nhân theo role.

## 6. Kiểm thử và build

- [ ] Backend test chính pass.
- [ ] Frontend test chính pass.
- [ ] Test quan hệ sai bị chặn.
- [ ] Test phả đồ từ thủy tổ pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 7. Điều kiện nghiệm thu cuối

- [ ] Quản trị tạo được dòng họ, chi/nhánh, thành viên và quan hệ.
- [ ] Người dùng xem được cây phả hệ và hồ sơ cá nhân.
- [ ] Dữ liệu đủ ổn định để triển khai lịch giỗ ở giai đoạn 2.
