# Giai đoạn 05 - Kế hoạch chi tiết tính năng mở rộng và tối ưu vận hành

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống có thể bổ sung từng tính năng mở rộng theo mini-phase độc lập, có kiểm soát rủi ro, quyền truy cập và vận hành.

## 2. Căn cứ từ nghiên cứu

- Giai đoạn 5 chỉ bắt đầu khi MVP giai đoạn 1-4 đã ổn định.
- Không triển khai tất cả tính năng mở rộng trong cùng một đợt.
- Mỗi mini-phase phải có quyết định go/no-go.
- Mọi tích hợp ngoài cần đánh giá chi phí, consent và khả năng tắt khi sự cố.
- QR, export, xưng hô và Zalo/SMS đều phải tôn trọng quyền truy cập.

## 3. Các mốc công việc trong giai đoạn

| Mốc | Nội dung trọng tâm | Kết quả cần đạt |
|---|---|---|
| G05-M01 | Đánh giá và chọn tính năng mở rộng | Có quyết định go/no-go và phạm vi mini-phase |
| G05-M02 | Thiết kế mini-phase | Có đặc tả dữ liệu, API, UI, permission và rủi ro |
| G05-M03 | Triển khai backend/frontend | Tính năng hoạt động độc lập, không phá vỡ MVP |
| G05-M04 | Kiểm thử dữ liệu lớn hoặc tích hợp ngoài | Test hiệu năng, quyền, sandbox provider nếu có |
| G05-M05 | Tài liệu vận hành và nghiệm thu | Có hướng dẫn vận hành, rollback và checklist đạt |
| G05-M06 | Tổng kết và chọn mini-phase tiếp theo | Có kết quả nghiệm thu và quyết định tiếp tục/dừng |

## 4. Cách triển khai khuyến nghị

Triển khai theo mini-phase:

1. G05.1 - Tra cứu xưng hô.
2. G05.2 - Xuất phả đồ PDF/ảnh.
3. G05.3 - QR Code.
4. G05.4 - Đăng ký tham dự sự kiện.
5. G05.5 - Zalo/SMS.
6. G05.6 - Quản lý quỹ.
7. G05.7 - Số hóa tư liệu nâng cao.

## 5. Kế hoạch theo nhóm tính năng

### Tra cứu xưng hô

- Chuẩn hóa dữ liệu quan hệ.
- Xây thuật toán tìm đường quan hệ.
- Tạo API chọn hai thành viên.
- Hiển thị kết quả và cảnh báo khi dữ liệu thiếu.

### Xuất phả đồ PDF/ảnh

- Chốt khổ giấy và phạm vi xuất.
- Tận dụng hoặc điều chỉnh giải pháp phả đồ từ giai đoạn 1.
- Tạo job export nếu cây lớn.
- Cung cấp file tải về.

### QR Code

- Chốt entity được tạo QR.
- Tạo token hoặc URL an toàn.
- Kiểm soát quyền khi quét QR.
- Cho phép tải hoặc vô hiệu hóa QR.

### Đăng ký tham dự sự kiện

- Mở rộng sự kiện với trạng thái đăng ký.
- Tạo model đăng ký.
- Hỗ trợ đăng ký/hủy đăng ký.
- Cho ban tổ chức xem danh sách tham dự.

### Zalo/SMS

- Chọn nhà cung cấp.
- Lưu consent nhận tin.
- Tạo adapter gửi tin.
- Tạo log gửi và chống gửi trùng.

### Quản lý quỹ

- Chốt quy trình thu/chi.
- Tạo model quỹ và giao dịch.
- Ghi chứng từ và audit log.
- Tạo báo cáo thu chi.

### Số hóa tư liệu nâng cao

- Mở rộng metadata media.
- Gắn tư liệu với thành viên, sự kiện, chi/nhánh.
- Nghiên cứu OCR nếu có nhu cầu.
- Không bật AI/phục dựng ảnh nếu chưa có quyết định riêng.

## 6. Permission đề xuất

```text
kinship.lookup
family-tree.export
qr-codes.manage
event-registrations.manage
external-notifications.manage
funds.manage
advanced-archives.manage
```

## 7. Ngoài phạm vi mặc định

- Ứng dụng mobile riêng.
- Tích hợp thanh toán.
- AI kể chuyện gia phả.
- Phục dựng ảnh tự động.
- Đồng bộ dữ liệu với nền tảng bên ngoài.

