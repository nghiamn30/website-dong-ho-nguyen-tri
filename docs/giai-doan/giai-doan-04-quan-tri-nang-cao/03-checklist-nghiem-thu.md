# Giai đoạn 04 - Checklist nghiệm thu quản trị nâng cao

## 1. Phân quyền

- [ ] Có danh sách vai trò chính thức.
- [ ] Có danh sách permission chính thức.
- [ ] Permission được seed hoặc migration ổn định.
- [ ] User có thể được gán vai trò toàn hệ thống.
- [ ] User có thể được gán vai trò theo chi/nhánh.
- [ ] Guard kiểm tra đúng quyền toàn hệ thống.
- [ ] Guard kiểm tra đúng quyền theo chi/nhánh.
- [ ] Đại diện chi không thao tác được dữ liệu chi khác.
- [ ] Giao diện ẩn hoặc chặn thao tác khi thiếu quyền.

## 2. Đề xuất chỉnh sửa

- [ ] Thành viên có thể gửi đề xuất chỉnh sửa hồ sơ.
- [ ] Đại diện chi có thể gửi đề xuất cho dữ liệu thuộc chi.
- [ ] Đề xuất lưu dữ liệu đề nghị thay đổi.
- [ ] Đề xuất lưu lý do.
- [ ] Đề xuất có trạng thái pending.
- [ ] Ban phả xem được danh sách đề xuất chờ duyệt.
- [ ] Ban phả xem được chi tiết trước/sau.
- [ ] Ban phả có thể duyệt đề xuất.
- [ ] Ban phả có thể từ chối đề xuất kèm lý do.
- [ ] Duyệt đề xuất cập nhật dữ liệu chính thức trong transaction.
- [ ] Từ chối đề xuất không làm thay đổi dữ liệu chính thức.

## 3. Audit log

- [ ] Thao tác tạo dữ liệu quan trọng được ghi log.
- [ ] Thao tác sửa dữ liệu quan trọng được ghi log.
- [ ] Thao tác xóa mềm hoặc ẩn dữ liệu được ghi log.
- [ ] Log có actor.
- [ ] Log có thời gian.
- [ ] Log có entity type.
- [ ] Log có action.
- [ ] Log có dữ liệu trước/sau khi phù hợp.
- [ ] Trang audit log có lọc theo actor.
- [ ] Trang audit log có lọc theo entity.
- [ ] Trang audit log có lọc theo thời gian.

## 4. Quyền riêng tư

- [ ] Có cấu hình riêng tư mặc định cho người đang sống.
- [ ] Có cấu hình riêng tư mặc định cho người đã khuất.
- [ ] Ngày sinh đầy đủ của người đang sống bị ẩn khi không đủ quyền.
- [ ] Địa chỉ hoặc nơi sinh sống bị ẩn khi không đủ quyền.
- [ ] Số điện thoại hoặc thông tin liên hệ bị ẩn khi không đủ quyền.
- [ ] Nơi an táng hiển thị theo cấu hình.
- [ ] Tư liệu gia đình hiển thị theo cấu hình.
- [ ] API không trả dữ liệu nhạy cảm cho người thiếu quyền.

## 5. Sao lưu và khôi phục

- [ ] Có script backup database.
- [ ] Có tài liệu chạy backup.
- [ ] Backup tạo ra file kiểm tra được.
- [ ] Có script hoặc quy trình restore.
- [ ] Restore đã được thử trên môi trường không phải production.
- [ ] Có ghi nhận lịch sử backup nếu thiết kế.
- [ ] Có phân quyền cho thao tác backup.
- [ ] Có phân quyền cho thao tác restore.

## 6. Frontend

- [ ] Trang danh sách đề xuất hoạt động.
- [ ] Trang chi tiết đề xuất hoạt động.
- [ ] Form duyệt/từ chối hoạt động.
- [ ] Trang cấu hình riêng tư hoạt động.
- [ ] Trang phân quyền theo chi hoạt động nếu triển khai UI.
- [ ] Trang nhật ký thao tác hoạt động.
- [ ] Trạng thái loading, empty và error được xử lý.

## 7. Kiểm thử và build

- [ ] Test phân quyền theo chi pass.
- [ ] Test quy trình đề xuất pass.
- [ ] Test duyệt/từ chối pass.
- [ ] Test audit log pass.
- [ ] Test riêng tư API pass.
- [ ] Test backup/restore tối thiểu pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 8. Điều kiện nghiệm thu cuối

- [ ] Dữ liệu quan trọng không còn bị sửa trực tiếp ngoài quyền cho phép.
- [ ] Quy trình kiểm duyệt đủ dùng cho dữ liệu phả hệ.
- [ ] Quyền theo chi/nhánh hoạt động ổn định.
- [ ] Quyền riêng tư được áp dụng nhất quán.
- [ ] Hệ thống có phương án backup/restore tối thiểu.

