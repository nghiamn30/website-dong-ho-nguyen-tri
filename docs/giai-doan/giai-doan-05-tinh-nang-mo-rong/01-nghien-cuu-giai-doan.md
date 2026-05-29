# Nghiên cứu giai đoạn 5: Tính năng mở rộng và tối ưu vận hành

## 1. Bối cảnh

### Dự án đã có những gì

- Sau giai đoạn 1, hệ thống có dữ liệu phả hệ, chi/nhánh, thành viên và phả đồ.
- Sau giai đoạn 2, hệ thống có ngày giỗ, sự kiện và lịch nhắc.
- Sau giai đoạn 3, hệ thống có cổng thông tin, bài viết, album và tư liệu.
- Sau giai đoạn 4, hệ thống có phân quyền theo chi, kiểm duyệt, audit và backup tối thiểu.
- Các tính năng mở rộng chưa nên triển khai đồng loạt vì phụ thuộc dữ liệu thật, nhu cầu thật và chi phí vận hành.

Giai đoạn 5 là giai đoạn tối ưu và mở rộng theo nhu cầu thực tế. Mỗi tính năng nên được xem là một mini-phase độc lập.

## 2. Vai trò áp dụng

| Vai trò | Phạm vi trong giai đoạn 5 |
|---|---|
| Admin | Bật/tắt tính năng mở rộng, cấu hình tích hợp ngoài, kiểm soát vận hành |
| Trưởng họ | Quyết định ưu tiên tính năng và phạm vi sử dụng toàn họ |
| Trưởng chi | Sử dụng hoặc quản lý tính năng mở rộng trong chi nếu được cấp quyền |
| Người bình thường | Sử dụng tính năng đã được bật và được phép truy cập |

Không thêm role mặc định trong giai đoạn 5. Nếu tính năng như quản lý quỹ cần role riêng, phải có nghiên cứu và quyết định tách biệt.

## 3. Module cần xây dựng

| Module | Mục tiêu |
|---|---|
| Tra cứu xưng hô | Tìm quan hệ và cách xưng hô giữa hai người |
| Xuất phả đồ | Xuất PDF/ảnh phục vụ in ấn hoặc lưu trữ |
| QR Code | Tạo mã QR cho hồ sơ, mộ phần, sự kiện hoặc tư liệu |
| Đăng ký tham dự sự kiện | Thành viên xác nhận tham dự sự kiện |
| Zalo/SMS | Nhắc lịch qua kênh ngoài email |
| Quản lý quỹ | Theo dõi thu chi dòng họ nếu có nhu cầu |
| Số hóa tư liệu nâng cao | OCR, metadata nâng cao, liên kết tư liệu sâu hơn |

## 4. Hiện trạng và khoảng cách

| Nội dung | Hiện trạng | Khoảng cách cần xử lý |
|---|---|---|
| Tra cứu xưng hô | Có cây phả hệ nếu giai đoạn 1 đạt | Cần thuật toán và quy tắc xưng hô |
| Xuất phả đồ | Có phả đồ hiển thị | Cần layout in/export và xử lý cây lớn |
| QR Code | Chưa có | Cần public token/slug và kiểm soát quyền |
| Đăng ký sự kiện | Có sự kiện từ giai đoạn 2 | Cần model đăng ký và danh sách tham dự |
| Zalo/SMS | Chưa có tích hợp | Cần nhà cung cấp, chi phí và consent |
| Quản lý quỹ | Chưa có | Cần quy trình tài chính riêng |
| Số hóa nâng cao | Có media từ giai đoạn 3 | Cần metadata, OCR hoặc xử lý nâng cao |

## 5. Dữ liệu đề xuất

### KinshipLookupLog

- `id`
- `source_person_id`
- `target_person_id`
- `result`
- `created_by`
- `created_at`

### ExportJob

- `id`
- `export_type`
- `scope_type`
- `scope_id`
- `status`
- `file_url`
- `created_by`
- `created_at`
- `finished_at`

### QrCode

- `id`
- `entity_type`
- `entity_id`
- `public_token`
- `target_url`
- `status`
- `created_by`
- `created_at`

### EventRegistration

- `id`
- `event_id`
- `user_id`
- `person_id`
- `guest_count`
- `status`
- `note`
- `created_at`
- `updated_at`

### ExternalNotificationLog

- `id`
- `channel`
- `provider`
- `recipient`
- `message_type`
- `status`
- `error_message`
- `created_at`

### FundTransaction

- `id`
- `fund_id`
- `transaction_type`
- `amount`
- `description`
- `evidence_media_id`
- `created_by`
- `approved_by`
- `created_at`

## 6. Quyết định thiết kế

1. Giai đoạn 5 không triển khai đồng loạt; mỗi tính năng là một mini-phase có nghiên cứu, kế hoạch và nghiệm thu riêng.
2. Tính năng mở rộng không được làm thay đổi dữ liệu lõi nếu không có migration và rollback rõ ràng.
3. Tra cứu xưng hô chỉ triển khai khi dữ liệu quan hệ đủ sạch.
4. Xuất phả đồ phụ thuộc quyết định hiển thị ở giai đoạn 1, đặc biệt nếu dùng React Flow.
5. QR Code phải tôn trọng quyền truy cập, không làm lộ dữ liệu riêng tư hoặc dữ liệu chưa được publish.
6. Zalo/SMS chỉ triển khai khi có consent nhận tin, chi phí và nhà cung cấp rõ ràng.
7. Quản lý quỹ cần nghiên cứu riêng về quy trình tài chính, audit và phân quyền.
8. AI/OCR/phục dựng ảnh không thuộc mặc định của giai đoạn 5, chỉ triển khai khi có quyết định riêng.

