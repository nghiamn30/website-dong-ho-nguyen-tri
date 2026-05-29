# Giai đoạn 04 - Checklist nghiệm thu quản trị nâng cao, kiểm duyệt và an toàn dữ liệu

## 1. Điều kiện trước nghiệm thu

- [ ] 4 role nghiệp vụ đã tồn tại.
- [ ] Có dữ liệu chi/nhánh và thành viên.
- [ ] Có dữ liệu ngày mất/ngày giỗ từ giai đoạn 2.
- [ ] Có audit log nền tảng.

## 2. Phân quyền theo chi/nhánh

- [ ] User có thể được gán vai trò theo chi/nhánh.
- [ ] Guard kiểm tra đúng phạm vi chi/nhánh.
- [ ] Trưởng chi xem được dữ liệu chi phụ trách.
- [ ] Trưởng chi cập nhật được ngày mất thành viên trong chi.
- [ ] Trưởng chi không cập nhật được ngày mất thành viên ngoài chi.
- [ ] Người bình thường không sửa được dữ liệu chính thức.
- [ ] Admin thao tác được toàn hệ thống.
- [ ] Trưởng họ thao tác được dữ liệu toàn họ theo quyền.

## 3. Quy trình đề xuất chỉnh sửa

- [ ] Người bình thường gửi được đề xuất chỉnh sửa.
- [ ] Trưởng chi gửi được đề xuất trong phạm vi chi.
- [ ] Đề xuất lưu dữ liệu đề nghị thay đổi.
- [ ] Đề xuất lưu lý do.
- [ ] Đề xuất có trạng thái pending.
- [ ] Trưởng họ/admin duyệt được đề xuất.
- [ ] Trưởng họ/admin từ chối được đề xuất kèm lý do.
- [ ] Duyệt đề xuất cập nhật dữ liệu trong transaction.
- [ ] Từ chối đề xuất không làm đổi dữ liệu chính thức.

## 4. Audit log và hiển thị sống/mất

- [ ] Thao tác tạo/sửa/xóa mềm dữ liệu quan trọng được ghi log.
- [ ] Log có actor.
- [ ] Log có entity type.
- [ ] Log có action.
- [ ] Log có before_data và after_data khi phù hợp.
- [ ] Người chưa mất chỉ hiển thị ngày, tháng, năm sinh.
- [ ] Người đã mất hiển thị ngày mất/ngày giỗ khi có dữ liệu.
- [ ] UI không hiển thị nhầm trường ngày mất cho người chưa mất.

## 5. Backup và restore

- [ ] Có script backup database.
- [ ] Backup tạo file kiểm tra được.
- [ ] Có script hoặc quy trình restore.
- [ ] Restore được thử trên môi trường không phải production.
- [ ] Có hướng dẫn vận hành backup/restore.
- [ ] Có giới hạn quyền chạy backup/restore.

## 6. Frontend

- [ ] Trang danh sách đề xuất hoạt động.
- [ ] Trang chi tiết đề xuất hoạt động.
- [ ] Form duyệt/từ chối hoạt động.
- [ ] Trang audit log có bộ lọc cơ bản.
- [ ] UI phân quyền theo chi hoạt động nếu triển khai.
- [ ] Trạng thái loading, empty và error được xử lý.

## 7. Kiểm thử và build

- [ ] Test branch-scoped permission pass.
- [ ] Test trưởng chi cập nhật ngày mất pass.
- [ ] Test đề xuất/duyệt pass.
- [ ] Test audit log pass.
- [ ] Test backup/restore tối thiểu pass.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 8. Điều kiện nghiệm thu cuối

- [ ] Quyền theo chi/nhánh hoạt động.
- [ ] Dữ liệu quan trọng có quy trình duyệt.
- [ ] Audit log đủ truy vết.
- [ ] Backup/restore tối thiểu vận hành được.

