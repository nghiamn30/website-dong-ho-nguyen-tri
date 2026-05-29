# Giai đoạn 05 - Nghiên cứu tính năng mở rộng

## 1. Cơ sở nghiên cứu

Tài liệu này được tách từ `docs/nghien-cuu.md`, trọng tâm là nhóm tính năng để sau:

- Tra cứu xưng hô.
- Xuất phả đồ PDF/ảnh.
- QR Code cho hồ sơ hoặc mộ phần.
- Quản lý quỹ dòng họ.
- Đăng ký tham dự sự kiện.
- Thông báo Zalo/SMS.
- Số hóa tư liệu nâng cao.

## 2. Mục tiêu giai đoạn

Giai đoạn này không nên triển khai đồng loạt. Mục tiêu là đánh giá, ưu tiên và triển khai từng tính năng mở rộng dựa trên dữ liệu thật và nhu cầu thực tế sau MVP.

## 3. Nguyên tắc ưu tiên

Một tính năng mở rộng chỉ nên triển khai khi:

1. Dữ liệu từ các giai đoạn 1-4 đã ổn định.
2. Có người dùng thật cần sử dụng.
3. Rủi ro riêng tư và vận hành đã được đánh giá.
4. Chi phí hạ tầng hoặc tích hợp ngoài được chấp nhận.
5. Có tiêu chí nghiệm thu riêng.

## 4. Nhóm tính năng cần nghiên cứu

### 4.1. Tra cứu xưng hô

Mục tiêu:

- Tính quan hệ giữa hai thành viên.
- Gợi ý cách xưng hô theo vai vế.
- Hỗ trợ tra cứu trong cùng chi hoặc toàn họ.

Điều kiện:

- Cây gia phả phải chính xác.
- Quan hệ cha/mẹ/vợ/chồng phải đủ dữ liệu.
- Cần quy tắc văn hóa xưng hô được thống nhất.

### 4.2. Xuất phả đồ PDF/ảnh

Mục tiêu:

- Xuất phả đồ để in hoặc chia sẻ.
- Hỗ trợ khổ lớn hoặc chia trang.

Điều kiện:

- Cần đánh giá thư viện render.
- Cần thiết kế layout in ấn riêng.
- Cần xử lý cây lớn nhiều thế hệ.

### 4.3. QR Code

Mục tiêu:

- QR cho hồ sơ thành viên.
- QR cho mộ phần hoặc tư liệu.

Điều kiện:

- Link public/private phải rõ quyền.
- Cần tránh lộ thông tin người đang sống.
- Cần xác định nội dung QR dẫn tới trang nào.

### 4.4. Quản lý quỹ dòng họ

Mục tiêu:

- Theo dõi đóng góp, thu chi, công khai minh bạch.

Điều kiện:

- Cần quy trình tài chính được dòng họ thống nhất.
- Cần phân quyền và kiểm duyệt riêng.
- Có thể cần xuất báo cáo.

### 4.5. Đăng ký tham dự sự kiện

Mục tiêu:

- Thành viên xác nhận tham dự họp họ, giỗ tổ, hoạt động lớn.
- Ban tổ chức nắm số lượng người tham gia.

Điều kiện:

- Phân hệ sự kiện phải ổn định.
- Cần quy tắc đăng ký hộ gia đình hoặc cá nhân.

### 4.6. Zalo/SMS

Mục tiêu:

- Nhắc lịch qua kênh phổ biến hơn email.

Điều kiện:

- Có chi phí gửi tin.
- Có tích hợp nhà cung cấp.
- Cần đồng ý nhận tin của thành viên.

### 4.7. Số hóa tư liệu nâng cao

Mục tiêu:

- Gắn tư liệu scan, ảnh cũ, câu chuyện, bản ghi âm vào hồ sơ.
- Có thể mở rộng OCR hoặc phục dựng ảnh sau này.

Điều kiện:

- Phân hệ media phải ổn định.
- Cần quy tắc bản quyền và quyền riêng tư.

## 5. Rủi ro chung

- Mở rộng quá sớm làm phức tạp MVP.
- Tích hợp ngoài gây chi phí vận hành.
- Tính năng in ấn hoặc xưng hô phụ thuộc dữ liệu rất chính xác.
- QR hoặc bản đồ có thể làm lộ dữ liệu riêng tư.
- Quản lý quỹ cần trách nhiệm tài chính rõ ràng.

## 6. Kết quả nghiên cứu cần đạt

- Danh sách ưu tiên tính năng mở rộng.
- Đánh giá chi phí, rủi ro và lợi ích từng tính năng.
- Thiết kế sơ bộ cho tính năng được chọn.
- Tiêu chí go/no-go trước khi triển khai.
- Checklist nghiệm thu riêng cho từng tính năng.

