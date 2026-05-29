# Giai đoạn 04 - Nghiên cứu quản trị nâng cao

## 1. Cơ sở nghiên cứu

Tài liệu này được tách từ `docs/nghien-cuu.md`, trọng tâm là:

- Quy trình duyệt dữ liệu.
- Phân quyền theo chi.
- Nhật ký thao tác.
- Cài đặt quyền riêng tư.
- Sao lưu và khôi phục dữ liệu.
- Bảo vệ dữ liệu cá nhân của người đang sống.

## 2. Mục tiêu giai đoạn

Hoàn thiện lớp quản trị để dữ liệu gia phả có thể vận hành lâu dài, an toàn và kiểm soát được:

- Thành viên hoặc đại diện chi gửi đề xuất chỉnh sửa.
- Ban phả/ban chấp hành duyệt hoặc từ chối đề xuất.
- Quyền được giới hạn theo vai trò và chi/nhánh.
- Mọi thao tác quan trọng có nhật ký.
- Quyền riêng tư được cấu hình rõ ràng.
- Có quy trình sao lưu và khôi phục dữ liệu.

## 3. Đối tượng sử dụng

| Đối tượng | Vai trò |
|---|---|
| Thành viên | Gửi đề xuất sửa thông tin của mình hoặc người thân |
| Đại diện chi | Đề xuất/cập nhật dữ liệu thuộc chi |
| Ban phả | Kiểm tra và duyệt dữ liệu phả hệ |
| Ban chấp hành | Duyệt nội dung/sự kiện quan trọng |
| Quản trị tối cao | Cấu hình quyền, riêng tư, backup |

## 4. Thực thể nghiệp vụ

| Thực thể | Vai trò |
|---|---|
| ChangeRequest | Lưu đề xuất thay đổi dữ liệu |
| ReviewAction | Lưu quyết định duyệt/từ chối |
| AuditLog | Lưu vết thao tác quan trọng |
| BranchScopedRole | Liên kết quyền của người dùng với chi/nhánh |
| PrivacySetting | Cấu hình riêng tư theo hệ thống hoặc theo hồ sơ |
| BackupJob | Ghi nhận quá trình sao lưu/khôi phục |

## 5. Quy trình chỉnh sửa dữ liệu gia phả

```text
Thành viên hoặc đại diện chi gửi đề xuất
→ Ban phả kiểm tra dữ liệu
→ Duyệt hoặc từ chối kèm lý do
→ Nếu duyệt, hệ thống cập nhật dữ liệu chính thức
→ Audit log ghi nhận trước/sau
```

## 6. Quy tắc phân quyền theo chi

1. Admin có quyền toàn hệ thống.
2. Ban phả có thể có quyền toàn họ hoặc theo phạm vi được cấp.
3. Đại diện chi chỉ thao tác trên dữ liệu thuộc chi/nhánh của mình.
4. Biên tập viên chỉ quản lý nội dung trong phạm vi được cấp.
5. Thành viên chỉ gửi đề xuất, không sửa trực tiếp dữ liệu chính thức nếu chưa được quyền.

## 7. Quyền riêng tư cần nghiên cứu

| Nhóm dữ liệu | Quy tắc |
|---|---|
| Người đang sống | Ẩn ngày sinh đầy đủ, địa chỉ, số điện thoại nếu không đủ quyền |
| Người đã khuất | Có thể hiển thị rộng hơn theo quy ước dòng họ |
| Vị trí sinh sống | Không công khai bản đồ hoặc địa chỉ chi tiết |
| Nơi an táng | Hiển thị theo phạm vi được cấu hình |
| Tư liệu gia đình | Cần quyền xem và kiểm duyệt |

## 8. Sao lưu và khôi phục

Nghiên cứu cần làm rõ:

- Sao lưu database theo lịch nào.
- Có sao lưu file upload không.
- Lưu backup ở đâu.
- Ai có quyền tạo backup thủ công.
- Ai có quyền khôi phục dữ liệu.
- Cách kiểm tra backup có thể phục hồi.

## 9. Rủi ro cần xử lý

- Người đại diện chi sửa nhầm dữ liệu chi khác.
- Duyệt đề xuất làm mất dữ liệu cũ.
- Audit log thiếu dữ liệu trước/sau.
- Cấu hình riêng tư phức tạp gây khó hiểu.
- Backup tồn tại nhưng không phục hồi được.

## 10. Kết quả nghiên cứu cần đạt

- Quy trình duyệt dữ liệu chính thức.
- Ma trận quyền theo vai trò và chi/nhánh.
- Mô hình `ChangeRequest`.
- Quy tắc audit log.
- Quy tắc riêng tư áp dụng toàn hệ thống.
- Quy trình backup/restore tối thiểu.

