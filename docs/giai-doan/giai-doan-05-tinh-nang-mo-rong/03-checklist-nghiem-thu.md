# Giai đoạn 05 - Checklist nghiệm thu tính năng mở rộng và tối ưu vận hành

## 1. Điều kiện trước nghiệm thu

- [ ] Giai đoạn 1 đã nghiệm thu.
- [ ] Giai đoạn 2 đã nghiệm thu.
- [ ] Giai đoạn 3 đã nghiệm thu.
- [ ] Giai đoạn 4 đã nghiệm thu.
- [ ] Có quyết định mini-phase cụ thể.
- [ ] Có đánh giá rủi ro riêng tư.
- [ ] Có kế hoạch rollback.

## 2. Tra cứu xưng hô

- [ ] Có API chọn hai thành viên.
- [ ] Hệ thống tìm được đường quan hệ khi dữ liệu đủ.
- [ ] Hệ thống cảnh báo khi dữ liệu không đủ.
- [ ] Kết quả xưng hô được kiểm tra bằng dữ liệu mẫu.
- [ ] Người thiếu quyền không truy cập dữ liệu bị hạn chế.

## 3. Xuất phả đồ PDF/ảnh

- [ ] Có giao diện chọn phạm vi export.
- [ ] Có thể export toàn họ hoặc theo chi trong giới hạn cho phép.
- [ ] File export tải về được.
- [ ] Layout không mất node quan trọng.
- [ ] Cây lớn có cơ chế job hoặc cảnh báo.
- [ ] Export tôn trọng quyền truy cập.

## 4. QR Code

- [ ] Có thể tạo QR cho entity đã chốt.
- [ ] QR dẫn đúng trang.
- [ ] QR tôn trọng quyền truy cập.
- [ ] Có thể tải QR.
- [ ] Có thể vô hiệu hóa QR.
- [ ] QR không làm lộ dữ liệu chưa publish.

## 5. Đăng ký tham dự sự kiện

- [ ] Sự kiện bật/tắt đăng ký được.
- [ ] Thành viên đăng ký tham dự được.
- [ ] Thành viên hủy đăng ký được nếu còn hạn.
- [ ] Ban tổ chức xem danh sách tham dự được.
- [ ] Hệ thống chống đăng ký trùng.

## 6. Zalo/SMS

- [ ] Có cấu hình provider.
- [ ] Có consent nhận tin.
- [ ] Tin nhắn test gửi thành công ở sandbox.
- [ ] Có log gửi tin.
- [ ] Có chống gửi trùng.
- [ ] Có cách tắt kênh gửi khi sự cố.

## 7. Quản lý quỹ

- [ ] Có model quỹ.
- [ ] Có model giao dịch thu/chi.
- [ ] Có phân quyền quản lý quỹ.
- [ ] Có thể tạo khoản thu.
- [ ] Có thể tạo khoản chi.
- [ ] Có thể đính kèm chứng từ nếu thiết kế.
- [ ] Có báo cáo thu chi.
- [ ] Có audit log giao dịch.

## 8. Số hóa tư liệu nâng cao

- [ ] Media có metadata mở rộng.
- [ ] Tư liệu gắn được với thành viên.
- [ ] Tư liệu gắn được với sự kiện.
- [ ] Tư liệu gắn được với chi/nhánh.
- [ ] Quyền xem tư liệu hoạt động.
- [ ] OCR/AI chỉ bật khi có quyết định riêng.

## 9. Kiểm thử và build

- [ ] Tính năng mở rộng có test backend phù hợp.
- [ ] Tính năng mở rộng có test frontend phù hợp.
- [ ] Test permission pass.
- [ ] Test riêng tư pass.
- [ ] Test dữ liệu lớn pass nếu liên quan phả đồ.
- [ ] Test provider sandbox pass nếu có tích hợp ngoài.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 10. Điều kiện nghiệm thu cuối

- [ ] Mini-phase được triển khai độc lập.
- [ ] Không phá vỡ MVP giai đoạn 1-4.
- [ ] Có tài liệu vận hành nếu có tích hợp ngoài.
- [ ] Có kết quả test/build trước khi bàn giao.

