# NGHIÊN CỨU CHỨC NĂNG WEBSITE GIA PHẢ DÒNG HỌ

**Tên tài liệu:** Nghiên cứu chức năng ban đầu cho website gia phả dòng họ  
**Ngày tổng hợp:** 28/05/2026  
**Mục tiêu:** Làm cơ sở để thiết kế chức năng, màn hình, dữ liệu và phân quyền cho website gia phả khi tech stack đã được lựa chọn sẵn.

---

## 1. Bối cảnh và mục tiêu xây dựng

Website được định hướng phục vụ một dòng họ/gia tộc, với ba nhu cầu trọng tâm:

1. **Lưu giữ và tra cứu gia phả số**
   - Quản lý các đời trong dòng họ.
   - Quản lý chi, phái, nhánh hoặc gia đình con.
   - Hiển thị phả đồ trực quan.
   - Tra cứu hồ sơ tổ tiên và thành viên.

2. **Duy trì hoạt động truyền thống của dòng họ**
   - Lưu ngày giỗ của người đã khuất.
   - Quản lý giỗ tổ, họp họ và các sự kiện lớn.
   - Nhắc lịch cho con cháu, đặc biệt là những người ở xa.
   - Hỗ trợ ngày âm lịch, phù hợp thực tế giỗ lễ tại Việt Nam.

3. **Tạo không gian thông tin chung**
   - Trưởng họ hoặc ban chấp hành đăng thông báo.
   - Đăng tin hoạt động, tin vui, tin buồn, quy ước, tư liệu.
   - Lưu giữ ảnh, tài liệu và lịch sử dòng họ.
   - Phân quyền theo vai trò và theo chi.

### Định hướng sản phẩm

Website nên được xây dựng theo mô hình:

> **Cổng thông tin dòng họ + Cây gia phả số + Lịch giỗ/sự kiện + Kho tư liệu truyền thống.**

Hệ thống không chỉ là một cây phả hệ, mà còn là nơi kết nối các thế hệ, tổ chức hoạt động và lưu giữ di sản số của dòng họ.

---

## 2. Khảo sát website và nền tảng tham khảo

### 2.1. Gia Phả Đại Việt Online

**Địa chỉ tham khảo:** [giaphadaiviet.vn](https://giaphadaiviet.vn/)

Nền tảng này tập trung vào việc tạo, quản lý và lưu trữ gia phả trực tuyến. Phần hướng dẫn sử dụng thể hiện các chức năng đáng chú ý:

- Tạo cây gia phả và thêm/sửa/xóa thành viên.
- Ghi nhận quan hệ con cái, bố mẹ, vợ/chồng và nhiều hôn phối.
- Thiết lập phả đồ công khai hoặc riêng tư bằng mã bảo mật.
- Xem quan hệ xưng hô giữa hai thành viên.
- Đăng ký nhận email thông báo sự kiện.
- Tải mã QR thông tin thành viên.
- Tùy chỉnh website, tạo phả ký và lựa chọn cách hiển thị đường nối trên phả đồ.
- Xuất phả đồ để chia sẻ hoặc in ấn.
- Lưu trữ ảnh, video và tài liệu; gắn tư liệu vào hồ sơ thành viên.

**Điểm nên áp dụng:**

- Phả đồ trực quan là chức năng trung tâm.
- Phải có quyền riêng tư đối với cây gia phả.
- Hồ sơ thành viên có thể đi kèm ảnh, tư liệu và tiểu sử.
- Lịch sự kiện và email nhắc lịch là chức năng thiết thực.
- Xuất phả đồ hoặc QR nên đặt ở giai đoạn phát triển sau.

### 2.2. Cổng thông tin Dòng họ Trần - Hải Phúc

**Địa chỉ tham khảo:** [hotran.org.vn](https://hotran.org.vn/)

Đây là ví dụ rõ về một **website cổng thông tin dòng họ**, tổ chức nội dung theo hướng cộng đồng và truyền thống. Website có các nhóm thông tin như:

- Phả ký.
- Phả đồ toàn dòng họ và phả đồ theo từng chi.
- Quy ước dòng họ.
- Hoạt động dòng họ.
- Thông báo mới.
- Thông tin giỗ tổ, nhà thờ tổ và các lễ truyền thống.
- Nội dung liên quan đến quỹ, khuyến học và di sản của dòng họ.

**Điểm nên áp dụng:**

- Website cần có phần giới thiệu, lịch sử, từ đường/nhà thờ họ, quy ước và ban chấp hành.
- Phả đồ nên hỗ trợ xem toàn họ và lọc theo chi.
- Thông báo và hoạt động dòng họ nên là các chuyên mục độc lập.
- Sự kiện giỗ tổ nên có bài viết, ảnh tư liệu và thông tin tổ chức đi kèm.

### 2.3. GIAPHA.ORG

**Địa chỉ tham khảo:** [giapha.org](https://giapha.org/)

GIAPHA.ORG cho thấy nhu cầu số hóa gia phả gắn với thông tin lịch Việt Nam, đặc biệt là hiển thị các mốc âm lịch trong gia phả.

**Điểm nên áp dụng:**

- Hỗ trợ ngày âm lịch là yêu cầu quan trọng cho nghiệp vụ giỗ lễ.
- Nên thiết kế hệ thống có thể tra cứu ngày giỗ theo thời gian.
- Có thể mở rộng về sau với tra cứu quan hệ hoặc vai vế/xưng hô.

### 2.4. Ứng dụng Gia phả Việt

**Địa chỉ tham khảo:** [Google Play - Gia phả Việt](https://play.google.com/store/apps/details?hl=vi&id=com.caonguyen.GiaPhaViet)

Ứng dụng mô tả các tính năng:

- Tra cứu cây gia phả.
- Tự động tổng hợp ngày giỗ, lễ và sinh nhật.
- Thông báo ngày giỗ cho thành viên ở xa.
- Đăng ngày vui như đám cưới, thôi nôi, nhà mới.
- Ghi chép ngày giỗ và địa điểm an táng của ông cha.

**Điểm nên áp dụng:**

- Tự động sinh lịch giỗ từ hồ sơ người đã khuất.
- Hỗ trợ thông báo sự kiện dòng họ.
- Hồ sơ người đã khuất nên có nơi an táng.
- Tin vui và tin buồn là nhóm nội dung phù hợp với cộng đồng dòng họ.

### 2.5. MyHeritage

**Địa chỉ tham khảo:** [MyHeritage - Family Events Calendar](https://education.myheritage.com/article/how-to-keep-track-of-family-events-with-myheritage/)

MyHeritage tự động đưa các ngày sinh hoặc ngày kỷ niệm trong hồ sơ cây gia đình vào lịch sự kiện, hiển thị các sự kiện sắp tới trên trang chủ gia đình và hỗ trợ thông báo lịch.

**Điểm nên áp dụng:**

- Widget “Sự kiện sắp tới” trên trang chủ thành viên.
- Tự động lấy dữ liệu lịch từ hồ sơ cá nhân.
- Cho phép thêm sự kiện thủ công ngoài sự kiện tự động.
- Cho phép người dùng quản lý lựa chọn nhận nhắc lịch.

### 2.6. FamilySearch

**Địa chỉ tham khảo:** [FamilySearch - Discovery](https://www.familysearch.org/en/discovery/)

FamilySearch chú trọng việc kể lại lịch sử gia đình thông qua:

- Hồ sơ tổ tiên.
- Câu chuyện, hình ảnh và tài liệu.
- Lịch tổ tiên.
- Tra cứu nơi an táng.
- Hồ sơ cá nhân thể hiện cha mẹ, anh chị em, vợ/chồng và con cái.

**Điểm nên áp dụng:**

- Hồ sơ người đã khuất không chỉ có thông tin quan hệ mà còn có tiểu sử và tư liệu.
- Thư viện ảnh/tài liệu nên gắn trực tiếp vào thành viên.
- Thông tin nơi an táng có giá trị lưu giữ lâu dài.

---

## 3. Kết luận rút ra từ khảo sát

Các nền tảng tham khảo cho thấy một website gia phả hiệu quả thường có bốn lớp chức năng:

| Lớp chức năng | Nội dung chính |
|---|---|
| Phả hệ | Cây gia phả, hồ sơ thành viên, chi/nhánh, quan hệ gia đình |
| Truyền thống | Thủy tổ, phả ký, nhà thờ họ, quy ước, ngày giỗ |
| Cộng đồng | Thông báo, bài viết, hoạt động, sự kiện, tin vui/tin buồn |
| Quản trị và bảo vệ dữ liệu | Phân quyền, kiểm duyệt, riêng tư, nhật ký thay đổi |

### Phạm vi phù hợp cho phiên bản đầu

Phiên bản đầu tiên nên tập trung vào sáu phân hệ:

1. Trang giới thiệu và cổng thông tin dòng họ.
2. Cây gia phả và quản lý chi/nhánh.
3. Hồ sơ thành viên.
4. Lịch giỗ và sự kiện dòng họ.
5. Thông báo, bài viết và thư viện hình ảnh.
6. Tài khoản, phân quyền và kiểm duyệt dữ liệu.

---

# 4. Phân hệ chức năng đề xuất

## 4.1. Trang chủ công khai

Trang chủ là nơi giới thiệu dòng họ và cung cấp thông tin nổi bật cho con cháu hoặc khách truy cập.

### Nội dung nên hiển thị

- Tên dòng họ, logo hoặc biểu tượng gia tộc.
- Banner, ảnh nhà thờ họ hoặc từ đường.
- Giới thiệu ngắn về nguồn gốc dòng họ.
- Thông báo nổi bật của trưởng họ hoặc ban chấp hành.
- Sự kiện lớn sắp diễn ra:
  - Giỗ tổ.
  - Họp họ.
  - Gặp mặt đầu xuân.
  - Khuyến học, mừng thọ.
  - Tu bổ từ đường.
- Bài viết và hoạt động mới nhất.
- Thư viện ảnh nổi bật.
- Vị trí nhà thờ họ hoặc từ đường.
- Thông tin liên hệ ban đại diện dòng họ.
- Nút truy cập cây gia phả và lịch giỗ.

### Quy tắc hiển thị

- Người chưa đăng nhập chỉ xem nội dung được công khai.
- Thông tin nhạy cảm của người đang sống không hiển thị công khai.
- Cây gia phả có thể đặt ở chế độ:
  - Công khai giới hạn.
  - Chỉ thành viên đăng nhập.
  - Chỉ người được cấp quyền.

---

## 4.2. Giới thiệu dòng họ và tư liệu lịch sử

Phân hệ này lưu giữ nội dung nền tảng về nguồn gốc và truyền thống dòng họ.

### Các trang con đề xuất

| Trang | Nội dung |
|---|---|
| Lịch sử dòng họ | Nguồn gốc, di cư, quá trình hình thành các chi |
| Thủy tổ | Hồ sơ người khởi tổ hoặc tổ tiên xác định sớm nhất |
| Phả ký | Ghi chép tổng hợp về các đời và dấu mốc lớn |
| Từ đường / Nhà thờ họ | Địa chỉ, bản đồ, lịch sử xây dựng, ảnh tư liệu |
| Quy ước dòng họ | Quy chế họp họ, giỗ tổ, đóng góp, khuyến học |
| Ban chấp hành | Trưởng họ, ban liên lạc, ban phả, nhiệm kỳ |
| Danh nhân / Người tiêu biểu | Người có đóng góp hoặc thành tích nổi bật |
| Tài liệu truyền thống | Văn bản, sắc phong, phả cũ, biên bản hoặc tư liệu scan |

---

## 4.3. Quản lý cây gia phả và chi dòng tộc

Đây là phân hệ lõi của website.

### 4.3.1. Cấu trúc phân cấp

Hệ thống nên hỗ trợ cấu trúc mềm, không ép mọi dòng họ phải dùng cùng một cách gọi:

```text
Dòng họ
└── Chi họ / Chi chính
    └── Phái hoặc nhánh
        └── Gia đình
            └── Thành viên
```

Ví dụ:

```text
Dòng họ Nguyễn Văn
├── Chi Cả
│   ├── Nhánh ông Nguyễn Văn A
│   └── Nhánh ông Nguyễn Văn B
├── Chi Hai
└── Chi Ba
```

### Yêu cầu thiết kế

- Cho phép tạo nhiều tầng nhánh.
- Cho phép đặt tên tầng theo thực tế: Chi, Phái, Ngành, Nhánh.
- Mỗi nhánh có thể gắn người đại diện.
- Có thể giới hạn quyền quản lý theo chi hoặc nhánh.

### 4.3.2. Chức năng cây gia phả

| Chức năng | Mô tả |
|---|---|
| Xem toàn bộ phả đồ | Hiển thị toàn dòng họ từ thủy tổ |
| Xem theo chi | Chỉ hiển thị thành viên thuộc một chi hoặc nhánh |
| Xem theo đời | Lọc thành viên theo đời thứ |
| Xem nhánh của một người | Hiển thị tổ tiên và hậu duệ liên quan |
| Thu phóng và kéo sơ đồ | Phù hợp cây lớn, nhiều thành viên |
| Tìm kiếm thành viên | Theo tên, đời, chi, địa phương hoặc tên thường gọi |
| Xem hồ sơ nhanh | Click vào node để xem thông tin cơ bản |
| Xem quan hệ | Cha, mẹ, vợ/chồng, con, anh chị em |
| Tra cứu vai vế/xưng hô | Tính năng mở rộng khi dữ liệu đã ổn định |
| Xuất phả đồ PDF/ảnh | Tính năng giai đoạn sau phục vụ in ấn |

### 4.3.3. Quan hệ cần hỗ trợ

- Cha ruột.
- Mẹ ruột.
- Vợ/chồng.
- Con ruột.
- Con nuôi, nếu dòng họ có ghi nhận.
- Nhiều cuộc hôn phối.
- Dâu/rể.
- Thành viên thuộc dòng họ chính.

### Quy tắc nghiệp vụ cần chốt

- Một người chỉ có một hồ sơ duy nhất trong hệ thống.
- Phải phân biệt người trong dòng họ chính với dâu/rể.
- Một người có thể có nhiều hôn phối nhưng quan hệ phải rõ ràng.
- Con cần gắn với ít nhất một phụ huynh.
- Mỗi thành viên có thể được gán vào chi/nhánh; về sau có thể tự suy ra từ tổ tiên.
- Xóa thành viên quan trọng phải qua kiểm duyệt; ưu tiên trạng thái ẩn/lưu trữ thay vì xóa cứng.

---

## 4.4. Hồ sơ thành viên

Mỗi người trong gia phả có một hồ sơ riêng.

### 4.4.1. Dữ liệu cơ bản

| Nhóm dữ liệu | Trường thông tin |
|---|---|
| Nhận diện | Họ tên, tên thường gọi, giới tính, ảnh đại diện |
| Phả hệ | Đời thứ, chi/nhánh, cha, mẹ, vợ/chồng, con |
| Sinh sống | Ngày sinh, quê quán, nơi sinh sống |
| Người đã khuất | Ngày mất, ngày giỗ, nơi an táng, ảnh phần mộ |
| Tư liệu | Tiểu sử, công đức, nghề nghiệp, thành tích, ghi chú |
| Tệp đính kèm | Ảnh, tài liệu scan, video, bản ghi âm, câu chuyện gia đình |
| Quyền riêng tư | Công khai, thành viên xem, quản trị xem, ẩn |

### 4.4.2. Phân biệt người đang sống và người đã khuất

#### Đối với người đang sống

- Không công khai ngày sinh đầy đủ, số điện thoại, địa chỉ và thông tin nhạy cảm.
- Chỉ thành viên được cấp quyền mới xem thông tin chi tiết.
- Cho phép cá nhân yêu cầu sửa, ẩn hoặc cập nhật thông tin của mình.
- Ảnh, tiểu sử và thông tin nghề nghiệp chỉ công bố theo quy định của dòng họ và sự đồng ý cần thiết.

#### Đối với người đã khuất

Tùy theo quy ước dòng họ, hồ sơ có thể công khai hơn:

- Tiểu sử.
- Ngày sinh, ngày mất.
- Ngày giỗ.
- Nơi an táng.
- Hình ảnh, tư liệu.
- Bài viết tưởng niệm.
- Quan hệ với các đời con cháu.

---

## 4.5. Lịch giỗ và sự kiện dòng họ

Đây là tính năng đặc thù và quan trọng đối với website gia phả Việt Nam.

### 4.5.1. Hai nguồn tạo sự kiện

#### A. Sự kiện tự động từ hồ sơ thành viên

Hệ thống tự sinh sự kiện khi hồ sơ có dữ liệu phù hợp:

- Ngày giỗ của người đã khuất.
- Ngày sinh thành viên, nếu được phép công bố.
- Ngày mất hoặc ngày tưởng niệm.
- Ngày cưới/kỷ niệm, nếu dòng họ sử dụng.

#### B. Sự kiện do ban chấp hành tạo

- Giỗ tổ.
- Họp họ.
- Lễ đầu xuân.
- Mừng thọ.
- Lễ khuyến học, trao thưởng.
- Tu bổ nhà thờ họ.
- Cưới hỏi, tin vui.
- Tang lễ, thông báo chia buồn.
- Các sự kiện riêng của từng chi.

### 4.5.2. Yêu cầu về lịch âm

Ngày giỗ tại Việt Nam thường được tổ chức theo âm lịch. Vì vậy, hệ thống cần lưu và hiển thị chính xác ngày giỗ âm.

| Trường dữ liệu | Ý nghĩa |
|---|---|
| Loại lịch | Âm lịch hoặc dương lịch |
| Ngày/tháng giỗ | Ngày tổ chức lặp lại hằng năm |
| Tháng nhuận | Xác định giỗ có thuộc tháng nhuận hay không |
| Ngày dương quy đổi trong năm | Dùng để hiển thị và gửi nhắc |
| Phạm vi thông báo | Toàn họ, theo chi hoặc nhóm được chọn |
| Mốc nhắc lịch | Trước 7 ngày, trước 1 ngày, đúng ngày |

Ví dụ:

```text
Cụ Nguyễn Văn A
Ngày mất: 12/08/1985 dương lịch
Ngày giỗ hằng năm: 27/06 âm lịch
Thông báo trước: 7 ngày và 1 ngày
Đối tượng nhận: Chi Cả
```

### 4.5.3. Trang lịch sự kiện

#### Chế độ xem

- Danh sách sự kiện sắp tới.
- Lịch theo tháng.
- Lịch theo năm.
- Lịch riêng của một chi.
- Trang chi tiết từng sự kiện.

#### Bộ lọc

- Ngày giỗ.
- Giỗ tổ.
- Họp họ.
- Tin vui.
- Tin buồn.
- Hoạt động khuyến học.
- Sự kiện theo chi/nhánh.

### 4.5.4. Hiển thị sự kiện trên trang chủ

Ví dụ:

```text
Sự kiện sắp tới
- 27/06 âm lịch: Giỗ cụ Nguyễn Văn A - Chi Cả
- 15/08 âm lịch: Giỗ Tổ toàn họ
- 10/06/2026: Họp Ban chấp hành dòng họ
```

### 4.5.5. Cơ chế nhắc lịch cho phiên bản đầu

Nên hỗ trợ:

- Thông báo trong website.
- Email nhắc lịch.
- Cài đặt nhận nhắc của từng tài khoản:
  - Tất cả sự kiện dòng họ.
  - Chỉ sự kiện thuộc chi của mình.
  - Chỉ giỗ tổ và sự kiện lớn.
  - Tắt một loại thông báo.
- Mốc gửi:
  - Trước 7 ngày.
  - Trước 1 ngày.
  - Trong ngày diễn ra.

Các kênh như Zalo hoặc SMS nên đưa vào giai đoạn sau vì phát sinh chi phí và tích hợp bên ngoài.

---

## 4.6. Thông báo, bài viết và hoạt động dòng họ

Phân hệ này tạo không gian chung do trưởng họ hoặc ban chấp hành quản lý.

### 4.6.1. Nhóm nội dung

| Nhóm | Ví dụ |
|---|---|
| Thông báo chính thức | Mời họp họ, thông báo giỗ tổ, quyên góp tu bổ từ đường |
| Hoạt động dòng họ | Gặp mặt, lễ đầu xuân, trao thưởng khuyến học |
| Tin vui | Cưới hỏi, mừng thọ, thành tích học tập |
| Tin buồn | Cáo phó, tang lễ, thông báo chia buồn |
| Tư liệu truyền thống | Phả ký, chuyện dòng họ, phong tục, di tích |
| Văn bản | Quy ước, danh sách ban chấp hành, biên bản họp |

### 4.6.2. Chức năng bài viết

- Tạo bài viết.
- Chỉnh sửa bài viết.
- Lưu nháp.
- Đăng bài.
- Hạ bài.
- Ghim bài quan trọng.
- Tải ảnh đại diện.
- Đính kèm ảnh hoặc tài liệu.
- Chọn chuyên mục.
- Chọn phạm vi hiển thị:
  - Công khai.
  - Toàn bộ thành viên đăng nhập.
  - Một chi/nhánh cụ thể.
  - Ban chấp hành.
- Liên kết bài viết với sự kiện.

### 4.6.3. Liên kết bài viết với sự kiện

Ví dụ quy trình:

```text
Ban chấp hành tạo sự kiện “Giỗ tổ năm 2026”
→ Tạo bài viết “Thông báo chương trình giỗ tổ”
→ Gắn bài viết vào sự kiện
→ Thành viên xem lịch có thể mở thông báo chi tiết
→ Sau sự kiện, album ảnh và báo cáo hoạt động được bổ sung vào cùng sự kiện
```

---

## 4.7. Thư viện ảnh và tư liệu

### Chức năng ban đầu

- Tạo album ảnh.
- Tải ảnh lên album.
- Chọn ảnh đại diện album.
- Gắn album vào bài viết hoặc sự kiện.
- Gắn ảnh/tài liệu vào hồ sơ người đã khuất.
- Tải lên tài liệu scan hoặc văn bản lưu giữ truyền thống.
- Thiết lập quyền xem.

### Phân loại gợi ý

- Nhà thờ họ / từ đường.
- Giỗ tổ.
- Họp họ.
- Ảnh xưa.
- Tư liệu gia phả.
- Ảnh từng chi.
- Khuyến học.
- Mừng thọ.
- Văn bản và quy ước.

### Quyền xem

- Công khai.
- Thành viên dòng họ.
- Theo chi/nhánh.
- Chỉ ban chấp hành hoặc quản trị.

---

## 4.8. Tài khoản, phân quyền và kiểm duyệt

Gia phả là dữ liệu truyền đời nên không nên cho phép tất cả thành viên sửa trực tiếp dữ liệu chính thức.

### 4.8.1. Vai trò đề xuất

| Vai trò | Quyền chính |
|---|---|
| Khách truy cập | Xem trang công khai và thông báo công khai |
| Thành viên dòng họ | Xem nội dung nội bộ, phả đồ theo quyền, nhận lịch nhắc |
| Đại diện chi | Đề xuất hoặc cập nhật dữ liệu thuộc chi mình |
| Biên tập viên | Soạn bài, quản lý album và tạo sự kiện thường |
| Ban phả / Ban chấp hành | Duyệt dữ liệu thành viên, quản lý sự kiện lớn và thông báo |
| Trưởng họ / Quản trị tối cao | Toàn quyền cấu hình, phân quyền và duyệt thay đổi quan trọng |

### 4.8.2. Luồng chỉnh sửa dữ liệu gia phả

```text
Thành viên hoặc đại diện chi gửi đề xuất sửa thông tin
        ↓
Ban phả hoặc ban chấp hành kiểm tra
        ↓
Duyệt hoặc từ chối kèm lý do
        ↓
Cập nhật vào cây gia phả chính thức
        ↓
Lưu lịch sử thay đổi
```

### Vì sao cần kiểm duyệt?

- Tránh sai vai vế.
- Tránh tạo trùng thành viên.
- Tránh gắn nhầm cha mẹ hoặc chi họ.
- Tránh xóa nhầm dữ liệu tổ tiên.
- Giải quyết tranh luận bằng lịch sử chỉnh sửa rõ ràng.

---

# 5. Cấu trúc menu website đề xuất

## 5.1. Menu công khai

```text
Trang chủ

Giới thiệu
 ├── Lịch sử dòng họ
 ├── Thủy tổ
 ├── Phả ký
 ├── Từ đường / Nhà thờ họ
 ├── Quy ước dòng họ
 └── Ban chấp hành

Gia phả
 ├── Phả đồ toàn dòng họ
 ├── Phả đồ theo chi
 ├── Tra cứu thành viên
 └── Các đời trong dòng họ

Lịch dòng họ
 ├── Lịch giỗ
 ├── Giỗ tổ
 └── Sự kiện sắp tới

Tin tức
 ├── Thông báo
 ├── Hoạt động dòng họ
 ├── Tin vui
 └── Tin buồn

Thư viện
 ├── Hình ảnh
 └── Tài liệu

Liên hệ
Đăng nhập
```

## 5.2. Menu quản trị

```text
Tổng quan

Quản lý gia phả
 ├── Thành viên
 ├── Chi / nhánh
 ├── Quan hệ gia đình
 ├── Đề xuất chỉnh sửa
 └── Nhật ký thay đổi

Quản lý lịch
 ├── Ngày giỗ
 ├── Giỗ tổ
 ├── Sự kiện
 └── Cấu hình nhắc lịch

Quản lý nội dung
 ├── Bài viết
 ├── Chuyên mục
 ├── Thư viện ảnh
 └── Tài liệu

Quản lý người dùng
 ├── Tài khoản
 ├── Vai trò
 └── Phân quyền theo chi

Cấu hình website
 ├── Thông tin dòng họ
 ├── Logo / banner
 ├── Nhà thờ họ / bản đồ
 └── Cấu hình riêng tư
```

---

# 6. Danh sách màn hình cần có trong phiên bản đầu

## 6.1. Khu vực người dùng

| Màn hình | Mục tiêu |
|---|---|
| Trang chủ | Xem giới thiệu, thông báo, sự kiện nổi bật |
| Giới thiệu dòng họ | Xem lịch sử, thủy tổ, từ đường và quy ước |
| Danh sách chi họ | Xem cấu trúc các chi/nhánh |
| Cây gia phả | Tra cứu trực quan phả hệ |
| Hồ sơ thành viên | Xem thông tin và quan hệ của từng người |
| Lịch giỗ | Theo dõi ngày giỗ theo tháng/năm |
| Chi tiết sự kiện | Xem thời gian, địa điểm, nội dung và tài liệu liên quan |
| Danh sách bài viết | Xem thông báo và hoạt động |
| Chi tiết bài viết | Đọc nội dung, xem ảnh và tệp đính kèm |
| Thư viện ảnh | Xem album dòng họ |
| Đăng nhập / hồ sơ cá nhân | Nhận thông báo và quản lý quyền riêng tư |

## 6.2. Khu vực quản trị

| Màn hình | Mục tiêu |
|---|---|
| Dashboard | Thống kê thành viên, chi, giỗ sắp tới, bài viết mới |
| Danh sách thành viên | Thêm, sửa, tìm kiếm và xem hồ sơ |
| Trình dựng quan hệ | Gắn cha mẹ, vợ/chồng, con |
| Quản lý chi/nhánh | Xây dựng cấu trúc dòng tộc |
| Danh sách ngày giỗ | Kiểm soát lịch giỗ tự động |
| Tạo/sửa sự kiện | Tạo giỗ tổ, họp họ và hoạt động |
| Quản lý bài viết | Soạn và xuất bản thông báo |
| Quản lý album/tài liệu | Tải lên và phân loại tư liệu |
| Duyệt đề xuất | Kiểm duyệt dữ liệu do thành viên gửi |
| Phân quyền | Cấp vai trò và giới hạn theo chi |
| Nhật ký thao tác | Theo dõi lịch sử thay đổi |

---

# 7. Dữ liệu nghiệp vụ chính cần thiết kế

Phần dưới đây là mô hình khái niệm ban đầu; tên bảng và trường có thể điều chỉnh theo tech stack hiện tại.

## 7.1. Dòng họ

```text
Clan
- id
- name
- description
- history
- logo_url
- banner_url
- ancestral_house_name
- ancestral_house_address
- map_url
- contact_information
- created_at
- updated_at
```

## 7.2. Chi / nhánh

```text
Branch
- id
- clan_id
- parent_branch_id
- name
- type                 // Chi, Phái, Ngành, Nhánh...
- description
- representative_person_id
- display_order
- status
- created_at
- updated_at
```

## 7.3. Thành viên

```text
Person
- id
- clan_id
- branch_id
- full_name
- common_name
- gender
- avatar_url
- generation_number    // Đời thứ
- birth_date
- birth_calendar_type  // solar/lunar
- death_date
- death_calendar_type  // solar/lunar
- life_status          // living/deceased
- biography
- hometown
- current_location
- burial_place
- burial_map_url
- privacy_level
- created_at
- updated_at
```

## 7.4. Quan hệ gia đình

```text
Relationship
- id
- person_1_id
- person_2_id
- relationship_type    // father, mother, spouse, adopted_child...
- is_clan_member       // phân biệt người trong họ và dâu/rể
- start_date
- end_date
- note
- created_at
- updated_at
```

## 7.5. Ngày giỗ

```text
DeathAnniversary
- id
- person_id
- lunar_day
- lunar_month
- is_leap_month
- recurrence_type      // yearly
- notification_scope   // toàn họ / theo chi / nhóm
- notify_before_days
- ceremony_note
- active
- created_at
- updated_at
```

## 7.6. Sự kiện

```text
Event
- id
- clan_id
- branch_id
- title
- event_type           // giỗ tổ, họp họ, tin vui, tin buồn...
- description
- calendar_type        // solar/lunar
- lunar_day
- lunar_month
- is_leap_month
- start_datetime
- end_datetime
- location
- map_url
- visibility_scope
- created_by
- status               // draft/published/completed/cancelled
- created_at
- updated_at
```

## 7.7. Bài viết và thông báo

```text
Post
- id
- clan_id
- branch_id
- title
- slug
- content
- category             // thông báo, hoạt động, tư liệu, tin vui, tin buồn
- thumbnail_url
- related_event_id
- visibility_scope
- is_pinned
- status               // draft/published/hidden
- author_id
- published_at
- created_at
- updated_at
```

## 7.8. Album và tư liệu

```text
Album
- id
- clan_id
- branch_id
- title
- description
- cover_image_url
- related_event_id
- visibility_scope
- created_by
- created_at
- updated_at

Media
- id
- album_id
- person_id
- file_type            // image/video/document/audio
- file_url
- caption
- uploaded_by
- created_at
```

## 7.9. Tài khoản và vai trò

```text
User
- id
- person_id
- email
- password_hash / external_auth_id
- status
- created_at
- updated_at

Role
- id
- name                 // member, branch_representative, editor, council, admin
- description

UserRole
- user_id
- role_id
- branch_id            // dùng khi quyền giới hạn theo chi
```

## 7.10. Đề xuất thay đổi và nhật ký

```text
ChangeRequest
- id
- requested_by
- entity_type
- entity_id
- request_type         // create/update/delete
- proposed_data
- reason
- status               // pending/approved/rejected
- reviewed_by
- reviewed_at
- review_note
- created_at

AuditLog
- id
- actor_id
- entity_type
- entity_id
- action
- before_data
- after_data
- reason
- created_at
```

---

# 8. Tính năng MVP bắt buộc và tính năng giai đoạn sau

## 8.1. Phiên bản đầu tiên: bắt buộc có

| Nhóm | Tính năng |
|---|---|
| Giới thiệu | Lịch sử dòng họ, thủy tổ, nhà thờ họ, ban chấp hành |
| Cấu trúc dòng tộc | Tạo chi/nhánh linh hoạt |
| Gia phả | Tạo thành viên, gắn cha mẹ, vợ/chồng, con |
| Hiển thị | Phả đồ toàn họ và theo chi |
| Tra cứu | Tìm thành viên theo tên, đời, chi |
| Người đã khuất | Ngày mất, ngày giỗ âm lịch, nơi an táng |
| Lịch | Danh sách giỗ/sự kiện, xem theo tháng, thông báo trên web/email |
| Nội dung | Đăng thông báo, bài viết, sự kiện, ảnh |
| Quyền hạn | Trưởng họ, ban chấp hành, đại diện chi, thành viên |
| Kiểm duyệt | Đề xuất và duyệt thay đổi dữ liệu gia phả |
| An toàn | Ẩn thông tin nhạy cảm người đang sống, lưu nhật ký thao tác |

## 8.2. Giai đoạn tiếp theo

| Tính năng | Lý do để sau |
|---|---|
| Tra cứu cách xưng hô giữa hai người | Cần cây gia phả chính xác và đủ dữ liệu |
| Xuất phả đồ PDF khổ lớn | Phụ thuộc yêu cầu in ấn và thư viện render |
| QR Code cho hồ sơ hoặc mộ phần | Hữu ích nhưng chưa phải nghiệp vụ lõi |
| Quản lý quỹ dòng họ | Cần quy trình tài chính, minh bạch và phân quyền riêng |
| Đăng ký tham dự sự kiện | Chỉ cần khi có nhu cầu tổ chức thường xuyên |
| Zalo/SMS nhắc lịch | Phát sinh chi phí và tích hợp ngoài |
| Bản đồ nơi sinh sống con cháu | Có rủi ro riêng tư, cần cơ chế đồng ý rõ ràng |
| AI kể chuyện gia phả / phục dựng ảnh | Không bắt buộc để hệ thống vận hành ban đầu |

---

# 9. Quyền riêng tư và an toàn dữ liệu

Website gia phả lưu dữ liệu gia đình, trong đó có thông tin của người đang sống. Vì vậy, quyền riêng tư cần được thiết kế ngay từ đầu.

## 9.1. Nguyên tắc đối với người đang sống

- Không công khai số điện thoại, địa chỉ hoặc ngày sinh đầy đủ.
- Không công khai hồ sơ chi tiết ngoài phạm vi được phép.
- Cho phép cá nhân yêu cầu cập nhật hoặc ẩn thông tin của mình.
- Chỉ cấp quyền xem theo vai trò và nhu cầu thực tế.
- Không hiển thị bản đồ vị trí sinh sống công khai.

## 9.2. Nguyên tắc đối với người đã khuất

- Có thể hiển thị tiểu sử, ngày mất, ngày giỗ, nơi an táng và tư liệu nếu được dòng họ chấp thuận.
- Ảnh phần mộ, tư liệu hoặc câu chuyện cần có cơ chế kiểm duyệt.
- Thông tin giỗ nên có phạm vi thông báo rõ ràng: toàn họ hoặc theo chi.

## 9.3. Nguyên tắc quản trị

- Mọi thay đổi dữ liệu phả hệ phải lưu lịch sử.
- Có sao lưu dữ liệu định kỳ.
- Không xóa cứng hồ sơ quan trọng nếu không thực sự cần thiết.
- Có quyền phân tách dữ liệu công khai và nội bộ.
- Có quy trình duyệt nội dung và duyệt thay đổi gia phả.

## 9.4. Lưu ý pháp lý

Tại Việt Nam, **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** được ban hành ngày 26/06/2025 và có hiệu lực từ ngày **01/01/2026**. Khi xây dựng hệ thống, cần rà soát các yêu cầu pháp lý áp dụng đối với thu thập, lưu trữ, công bố, chỉnh sửa và bảo vệ dữ liệu cá nhân của thành viên còn sống.

Nguồn chính thức: [Văn bản Chính phủ - Luật số 91/2025/QH15](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3)

---

# 10. Luồng sử dụng chính

## 10.1. Ban chấp hành dựng cây gia phả ban đầu

```text
Tạo thông tin dòng họ
→ Tạo thủy tổ
→ Tạo các đời con cháu
→ Tạo chi/nhánh
→ Gắn thành viên vào chi
→ Nhập người đã khuất và ngày giỗ
→ Duyệt dữ liệu
→ Công bố cây gia phả cho thành viên xem
```

## 10.2. Thành viên tra cứu tổ tiên

```text
Đăng nhập
→ Mở phả đồ
→ Chọn chi của mình
→ Tìm tên người thân
→ Xem hồ sơ, quan hệ, tiểu sử và tư liệu
```

## 10.3. Nhắc ngày giỗ

```text
Quản trị nhập ngày giỗ âm lịch của người đã khuất
→ Hệ thống quy đổi ngày tương ứng trong năm
→ Đưa sự kiện vào lịch
→ Gửi thông báo trước 7 ngày và 1 ngày
→ Thành viên xem chi tiết thời gian, địa điểm và ghi chú
```

## 10.4. Ban chấp hành đăng thông báo họp họ

```text
Tạo sự kiện họp họ
→ Nhập thời gian, địa điểm và nội dung
→ Chọn đối tượng nhận thông báo
→ Đăng bài thông báo liên kết với sự kiện
→ Thành viên nhận nhắc và xem trên trang chủ
```

## 10.5. Đại diện chi bổ sung dữ liệu

```text
Đại diện chi gửi thêm thành viên hoặc đề xuất sửa hồ sơ
→ Ban phả kiểm tra
→ Duyệt hoặc từ chối
→ Cây gia phả cập nhật nếu được duyệt
→ Lịch sử thay đổi được lưu lại
```

---

# 11. Bố cục trang chủ đề xuất

```text
[Header]
Logo dòng họ | Trang chủ | Gia phả | Lịch giỗ | Tin tức | Thư viện | Đăng nhập

[Banner]
Tên dòng họ
Thông điệp: Uống nước nhớ nguồn - Kết nối các thế hệ

[Khối giới thiệu ngắn]
Nguồn gốc dòng họ + ảnh nhà thờ họ

[Khối thông báo nổi bật]
- Thông báo giỗ tổ
- Thông báo họp họ
- Thông báo quan trọng từ ban chấp hành

[Khối sự kiện sắp tới]
- Ngày giỗ gần nhất
- Lễ họp họ
- Sự kiện của từng chi

[Khối phả đồ]
Nút: Xem cây gia phả
Nút: Tra cứu thành viên
Nút: Xem theo chi

[Khối hoạt động dòng họ]
Bài viết và hình ảnh mới nhất

[Khối thư viện ảnh]
Ảnh nhà thờ họ, lễ giỗ tổ, gặp mặt

[Footer]
Địa chỉ nhà thờ họ | Trưởng họ | Ban chấp hành | Liên hệ
```

---

# 12. Thứ tự ưu tiên triển khai

## Giai đoạn 1: Dữ liệu lõi và cây gia phả

- Cấu hình thông tin dòng họ.
- Tạo chi/nhánh.
- Tạo hồ sơ thành viên.
- Gắn quan hệ gia đình.
- Hiển thị phả đồ toàn họ và theo chi.
- Tra cứu thành viên.
- Thiết lập quyền xem cơ bản.

## Giai đoạn 2: Người đã khuất và lịch giỗ

- Bổ sung ngày mất, ngày giỗ âm lịch và nơi an táng.
- Tạo lịch giỗ tự động.
- Quản lý giỗ tổ và sự kiện.
- Hiển thị sự kiện sắp tới.
- Gửi thông báo trong website và email.

## Giai đoạn 3: Cổng thông tin dòng họ

- Bài viết.
- Thông báo.
- Hoạt động.
- Tin vui, tin buồn.
- Album ảnh và tài liệu.
- Liên kết bài viết với sự kiện.

## Giai đoạn 4: Quản trị nâng cao

- Quy trình duyệt dữ liệu.
- Phân quyền theo chi.
- Nhật ký thao tác.
- Cài đặt quyền riêng tư.
- Sao lưu và khôi phục dữ liệu.

## Giai đoạn 5: Tính năng mở rộng

- Tra cứu xưng hô.
- PDF/ảnh phả đồ phục vụ in.
- QR Code.
- Quản lý quỹ.
- Đăng ký tham dự sự kiện.
- Thông báo Zalo/SMS.
- Các tính năng số hóa tư liệu nâng cao.

---

# 13. Định nghĩa phạm vi website phiên bản đầu

> **Website gia phả dòng họ là hệ thống lưu trữ cây phả hệ theo chi/nhánh, quản lý hồ sơ thành viên và ngày giỗ người đã khuất, đồng thời cung cấp không gian thông báo, sự kiện và tư liệu chung do trưởng họ hoặc ban chấp hành quản lý.**

### Trọng tâm triển khai

1. Xây dựng cây gia phả và cấu trúc chi/nhánh.
2. Nhập hồ sơ thành viên, đặc biệt là người đã khuất và ngày giỗ âm lịch.
3. Xây dựng lịch giỗ/sự kiện và cơ chế nhắc lịch.
4. Bổ sung cổng thông tin: bài viết, thông báo, hoạt động và thư viện ảnh.
5. Hoàn thiện phân quyền, kiểm duyệt và bảo vệ dữ liệu người đang sống.

### Kết quả mong muốn của MVP

- Có thể tạo và xem cây gia phả theo chi.
- Có thể nhập và tra cứu hồ sơ thành viên.
- Có thể quản lý ngày giỗ âm lịch và xem lịch giỗ sắp tới.
- Ban chấp hành có thể đăng thông báo và sự kiện.
- Thành viên có thể đăng nhập để xem nội dung nội bộ và nhận nhắc lịch.
- Dữ liệu quan trọng được kiểm duyệt và lưu vết thay đổi.

---

# 14. Nguồn tham khảo

## Nền tảng và website gia phả

1. Gia Phả Đại Việt Online: <https://giaphadaiviet.vn/>
2. Hướng dẫn nhanh - Gia Phả Đại Việt Online: <https://giaphadaiviet.vn/huong-dan-nhanh/>
3. Dòng họ Trần - Hải Phúc: <https://hotran.org.vn/>
4. Thông báo mới - Dòng họ Trần - Hải Phúc: <https://hotran.org.vn/category/thong-bao-moi>
5. Hoạt động dòng họ - Dòng họ Trần - Hải Phúc: <https://hotran.org.vn/category/hoat-dong-cua-dong-ho>
6. GIAPHA.ORG - Gia phả kỹ thuật số: <https://giapha.org/>
7. Gia phả Việt - Google Play: <https://play.google.com/store/apps/details?hl=vi&id=com.caonguyen.GiaPhaViet>
8. MyHeritage - How To Keep Track Of Family Events: <https://education.myheritage.com/article/how-to-keep-track-of-family-events-with-myheritage/>
9. FamilySearch - Family History Activities: <https://www.familysearch.org/en/discovery/>
10. FamilySearch - Person page in Family Tree: <https://www.familysearch.org/en/help/helpcenter/article/what-is-included-on-the-person-page-in-family-tree>

## Nguồn pháp lý

11. Luật số 91/2025/QH15 của Quốc hội - Luật Bảo vệ dữ liệu cá nhân:  
<https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroupid=3>

---

## Ghi chú sử dụng tài liệu

Tài liệu này là bản nghiên cứu và định hướng chức năng ban đầu. Bước tiếp theo khi bắt đầu phát triển là chuyển các nội dung trên thành:

- Đặc tả nghiệp vụ chi tiết.
- Danh sách route/màn hình.
- Database schema thực tế.
- Danh sách API.
- Ma trận phân quyền.
- Kế hoạch triển khai theo sprint.
