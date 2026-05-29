# Giai đoạn 05 - Checklist nghiệm thu tính năng mở rộng

## 1. Điều kiện chung trước khi triển khai

- [ ] Giai đoạn 1 đã nghiệm thu.
- [ ] Giai đoạn 2 đã nghiệm thu.
- [ ] Giai đoạn 3 đã nghiệm thu.
- [ ] Giai đoạn 4 đã nghiệm thu.
- [ ] Có quyết định ưu tiên tính năng mở rộng cụ thể.
- [ ] Có đánh giá rủi ro riêng tư.
- [ ] Có đánh giá chi phí nếu dùng dịch vụ ngoài.
- [ ] Có tiêu chí rollback nếu triển khai lỗi.

## 2. Tra cứu xưng hô

- [ ] Có API chọn hai thành viên để tra cứu.
- [ ] Hệ thống tìm được đường quan hệ khi dữ liệu đủ.
- [ ] Hệ thống báo không đủ dữ liệu khi không xác định được.
- [ ] Kết quả hiển thị quan hệ dễ hiểu.
- [ ] Kết quả xưng hô được kiểm tra bằng bộ dữ liệu mẫu.
- [ ] Người thiếu quyền không tra cứu được dữ liệu bị hạn chế.

## 3. Xuất phả đồ PDF/ảnh

- [ ] Có giao diện chọn phạm vi export.
- [ ] Có thể export toàn họ nếu dữ liệu trong giới hạn cho phép.
- [ ] Có thể export theo chi/nhánh.
- [ ] File export tải về được.
- [ ] Layout export không mất node quan trọng.
- [ ] Cây lớn có cơ chế xử lý hoặc cảnh báo phù hợp.
- [ ] Người thiếu quyền không export được dữ liệu hạn chế.

## 4. QR Code

- [ ] Có thể tạo QR cho loại đối tượng đã chốt.
- [ ] QR dẫn tới đúng trang.
- [ ] QR tôn trọng quyền truy cập.
- [ ] Người không đủ quyền không xem được nội dung riêng tư sau khi quét QR.
- [ ] Có thể tải QR về.
- [ ] Có thể vô hiệu hóa QR nếu cần.

## 5. Đăng ký tham dự sự kiện

- [ ] Sự kiện có thể bật/tắt đăng ký.
- [ ] Thành viên có thể đăng ký tham dự.
- [ ] Thành viên có thể hủy đăng ký nếu còn thời hạn.
- [ ] Ban tổ chức xem được danh sách đăng ký.
- [ ] Hệ thống chống đăng ký trùng.
- [ ] Có trạng thái hết hạn đăng ký.
- [ ] Có thể xuất danh sách nếu tính năng được chốt.

## 6. Zalo/SMS

- [ ] Có cấu hình nhà cung cấp.
- [ ] Có consent nhận tin của thành viên.
- [ ] Tin nhắn test gửi thành công ở môi trường thử nghiệm.
- [ ] Có log gửi tin.
- [ ] Có chống gửi trùng.
- [ ] Có xử lý lỗi gửi.
- [ ] Có cách tắt kênh gửi khi phát sinh sự cố.

## 7. Quản lý quỹ dòng họ

- [ ] Có model quỹ.
- [ ] Có model giao dịch thu/chi.
- [ ] Có phân quyền quản lý quỹ.
- [ ] Có thể tạo khoản thu.
- [ ] Có thể tạo khoản chi.
- [ ] Có thể đính kèm chứng từ nếu được thiết kế.
- [ ] Có báo cáo thu chi.
- [ ] Có audit log cho thay đổi giao dịch.

## 8. Số hóa tư liệu nâng cao

- [ ] Media có metadata mở rộng.
- [ ] Tư liệu có thể gắn với thành viên.
- [ ] Tư liệu có thể gắn với sự kiện.
- [ ] Tư liệu có thể gắn với chi/nhánh.
- [ ] Quyền xem tư liệu hoạt động.
- [ ] Quy trình duyệt tư liệu hoạt động nếu được thiết kế.
- [ ] Tính năng OCR hoặc phục dựng ảnh chỉ bật khi đã có quyết định riêng.

## 9. Kiểm thử và build

- [ ] Tính năng mở rộng có test backend phù hợp.
- [ ] Tính năng mở rộng có test frontend phù hợp.
- [ ] Test phân quyền pass.
- [ ] Test riêng tư pass.
- [ ] Test dữ liệu lớn pass nếu liên quan phả đồ.
- [ ] Test tích hợp ngoài pass nếu có.
- [ ] `pnpm lint` pass.
- [ ] `pnpm build` pass.

## 10. Điều kiện nghiệm thu cuối

- [ ] Tính năng mở rộng được triển khai độc lập, không phá vỡ MVP.
- [ ] Người dùng có quyền sử dụng được luồng chính.
- [ ] Người thiếu quyền bị chặn đúng.
- [ ] Có tài liệu vận hành nếu có tích hợp ngoài.
- [ ] Có kết quả test/build trước khi bàn giao.

