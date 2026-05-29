# Giai đoạn 02 - Nghiên cứu người đã khuất và lịch giỗ

## 1. Cơ sở nghiên cứu

Tài liệu này được tách từ `docs/nghien-cuu.md`, trọng tâm là:

- Hồ sơ người đã khuất.
- Ngày mất, ngày giỗ âm lịch và nơi an táng.
- Lịch giỗ tự động.
- Sự kiện dòng họ.
- Thông báo trong website và email.

## 2. Mục tiêu giai đoạn

Xây dựng phân hệ lịch giỗ và sự kiện để hệ thống có thể:

- Bổ sung thông tin người đã khuất vào hồ sơ thành viên.
- Lưu ngày giỗ âm lịch, tháng nhuận và phạm vi thông báo.
- Tự sinh lịch giỗ hằng năm từ hồ sơ người đã khuất.
- Tạo và quản lý sự kiện thủ công như giỗ tổ, họp họ, lễ đầu xuân.
- Hiển thị sự kiện sắp tới trên dashboard hoặc trang người dùng.
- Gửi thông báo trong website và email theo mốc nhắc lịch.

## 3. Thực thể nghiệp vụ

| Thực thể | Vai trò |
|---|---|
| DeathAnniversary | Lưu quy tắc giỗ lặp lại hằng năm cho người đã khuất |
| Event | Lưu sự kiện thủ công hoặc sự kiện được sinh từ hồ sơ |
| Notification | Ghi nhận thông báo gửi cho thành viên |
| NotificationPreference | Lưu lựa chọn nhận nhắc lịch của từng tài khoản |

## 4. Quy tắc nghiệp vụ cần chốt

1. Ngày giỗ có thể dùng âm lịch hoặc dương lịch, nhưng phiên bản đầu phải ưu tiên âm lịch.
2. Ngày giỗ âm lịch cần lưu ngày, tháng và trạng thái tháng nhuận.
3. Mỗi người đã khuất có thể có một ngày giỗ chính thức.
4. Sự kiện giỗ tự động cần có ngày dương quy đổi theo từng năm.
5. Sự kiện thủ công phải có người tạo, phạm vi hiển thị và trạng thái xuất bản.
6. Người dùng có thể nhận nhắc lịch theo toàn họ, theo chi hoặc sự kiện lớn.
7. Email/Zalo/SMS không được trộn chung; giai đoạn này chỉ xét website notification và email.

## 5. Nghiên cứu lịch âm

Ngày giỗ tại Việt Nam thường tổ chức theo âm lịch. Trước khi triển khai cần chốt:

- Nguồn thuật toán hoặc thư viện chuyển đổi âm/dương.
- Cách xử lý tháng nhuận.
- Cách kiểm thử các năm có tháng nhuận.
- Cách lưu ngày âm để không mất dữ liệu gốc.
- Cách cache ngày dương quy đổi trong từng năm.

Nếu cần thêm thư viện, phải đánh giá riêng và chỉ thêm sau khi thống nhất.

## 6. Màn hình cần nghiên cứu chi tiết

### Khu vực quản trị

- Bổ sung thông tin người đã khuất trong hồ sơ thành viên.
- Danh sách ngày giỗ.
- Form tạo/sửa ngày giỗ.
- Danh sách sự kiện.
- Form tạo/sửa sự kiện.
- Cấu hình mốc nhắc lịch.

### Khu vực người dùng

- Lịch giỗ theo tháng.
- Danh sách sự kiện sắp tới.
- Trang chi tiết sự kiện.
- Trung tâm thông báo cá nhân.
- Cài đặt nhận nhắc lịch.

## 7. Phạm vi thông báo

| Phạm vi | Ý nghĩa |
|---|---|
| Toàn họ | Tất cả thành viên có quyền nhận thông báo |
| Theo chi/nhánh | Chỉ thành viên thuộc chi/nhánh liên quan |
| Nhóm vai trò | Ban chấp hành, ban phả hoặc quản trị |
| Cá nhân | Một số tài khoản được chọn trực tiếp |

## 8. Rủi ro cần xử lý

- Sai ngày âm/dương gây mất niềm tin vào hệ thống.
- Gửi email nhắc lịch trùng lặp.
- Thông báo sai phạm vi chi/nhánh.
- Sự kiện tự động và sự kiện thủ công bị trùng.
- Công khai thông tin người đã khuất hoặc nơi an táng khi chưa được phép.

## 9. Kết quả nghiên cứu cần đạt

- Quy tắc lưu ngày giỗ âm lịch.
- Quy tắc tạo sự kiện tự động hằng năm.
- Quy tắc tạo sự kiện thủ công.
- Danh sách API lịch giỗ/sự kiện/thông báo.
- Màn hình quản trị và người dùng cho lịch.
- Chiến lược kiểm thử chuyển đổi âm/dương.

