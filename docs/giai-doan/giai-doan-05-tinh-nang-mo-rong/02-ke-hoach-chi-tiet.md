# Giai đoạn 05 - Kế hoạch chi tiết tính năng mở rộng

## 1. Mục tiêu bàn giao

Sau giai đoạn này, hệ thống có thể bổ sung các tính năng nâng cao theo thứ tự ưu tiên, không làm ảnh hưởng nền tảng MVP đã ổn định.

## 2. Điều kiện bắt đầu

- Giai đoạn 1-4 đã nghiệm thu.
- Dữ liệu phả hệ đủ sạch.
- Quyền riêng tư đã được áp dụng nhất quán.
- Có nhu cầu thực tế từ người dùng hoặc ban chấp hành.
- Có quyết định ưu tiên rõ cho từng tính năng.

## 3. Cách triển khai khuyến nghị

Không triển khai toàn bộ giai đoạn 5 như một khối lớn. Nên chia thành từng mini-phase:

1. Mini-phase 5.1: Tra cứu xưng hô.
2. Mini-phase 5.2: Xuất phả đồ PDF/ảnh.
3. Mini-phase 5.3: QR Code.
4. Mini-phase 5.4: Đăng ký tham dự sự kiện.
5. Mini-phase 5.5: Zalo/SMS.
6. Mini-phase 5.6: Quản lý quỹ.
7. Mini-phase 5.7: Số hóa tư liệu nâng cao.

## 4. Kế hoạch theo nhóm tính năng

### 4.1. Tra cứu xưng hô

- Nghiên cứu thuật toán tìm đường quan hệ giữa hai người.
- Chuẩn hóa dữ liệu quan hệ đầu vào.
- Tạo API tra cứu quan hệ.
- Tạo giao diện chọn hai thành viên.
- Trả kết quả quan hệ và cách xưng hô.
- Thêm cảnh báo khi dữ liệu chưa đủ để xác định.

### 4.2. Xuất phả đồ PDF/ảnh

- Đánh giá yêu cầu in: khổ giấy, số đời, kiểu hiển thị.
- Đánh giá thư viện render phù hợp với stack hiện tại.
- Tạo layout phả đồ dành riêng cho export.
- Tạo job export nếu cây lớn.
- Tạo API tải file.
- Tạo giao diện chọn phạm vi export.

### 4.3. QR Code

- Chốt loại QR: hồ sơ, mộ phần, album, sự kiện.
- Chốt quyền truy cập khi quét QR.
- Tạo slug hoặc public token nếu cần.
- Tạo API sinh QR.
- Tạo giao diện tải QR.
- Kiểm thử QR với tài khoản có quyền và không có quyền.

### 4.4. Đăng ký tham dự sự kiện

- Mở rộng model sự kiện với trạng thái đăng ký.
- Tạo model đăng ký tham dự.
- Hỗ trợ đăng ký cá nhân hoặc theo hộ.
- Tạo API đăng ký/hủy đăng ký.
- Tạo danh sách người tham dự cho ban tổ chức.
- Tạo xuất danh sách nếu cần.

### 4.5. Zalo/SMS

- Chọn nhà cung cấp.
- Chốt chi phí và quota.
- Lưu consent nhận tin của thành viên.
- Tạo adapter gửi tin.
- Tạo log gửi tin.
- Tạo cơ chế retry và chống gửi trùng.

### 4.6. Quản lý quỹ dòng họ

- Chốt quy trình thu/chi.
- Tạo model quỹ, giao dịch, chứng từ.
- Tạo phân quyền kế toán/quản trị/quản sát.
- Tạo báo cáo thu chi.
- Tạo cơ chế duyệt giao dịch nếu cần.
- Không trộn quỹ với dữ liệu phả hệ lõi.

### 4.7. Số hóa tư liệu nâng cao

- Mở rộng metadata cho media.
- Cho phép gắn tư liệu với thành viên, sự kiện, chi/nhánh.
- Nghiên cứu OCR nếu có nhu cầu.
- Nghiên cứu phục dựng ảnh nếu có nhu cầu và quy tắc đồng ý.
- Tạo quy trình duyệt tư liệu trước khi công khai.

## 5. Permission đề xuất

```text
kinship.lookup
family-tree.export
qr-codes.manage
event-registrations.manage
external-notifications.manage
funds.view
funds.manage
advanced-archives.manage
```

## 6. Kiểm thử chung

- Không làm hỏng luồng giai đoạn 1-4.
- Kiểm thử quyền riêng tư cho mọi tính năng mở rộng.
- Kiểm thử dữ liệu lớn nếu tính năng liên quan phả đồ.
- Kiểm thử tích hợp ngoài bằng sandbox trước.
- Kiểm thử rollback nếu tính năng có migration lớn.

## 7. Ngoài phạm vi mặc định

Các tính năng dưới đây chỉ triển khai khi có quyết định riêng:

- AI kể chuyện gia phả.
- Phục dựng ảnh tự động.
- Tích hợp thanh toán.
- Ứng dụng mobile riêng.
- Đồng bộ dữ liệu với nền tảng bên ngoài.

## 8. Kết quả bàn giao

Mỗi mini-phase phải bàn giao riêng:

- Đặc tả tính năng.
- Migration/API/UI tương ứng.
- Permission tương ứng.
- Checklist nghiệm thu riêng.
- Kết quả test và build.
- Ghi chú vận hành nếu có tích hợp ngoài.

