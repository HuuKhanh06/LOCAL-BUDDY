# TRÍCH XUẤT NGHIỆP VỤ CHI TIẾT 29 USE CASE (NGHIEP_VU_TRICH_XUAT.md)

## NHÓM 1: TÀI KHOẢN & ĐỊNH DANH (UC.01 - UC.06)

### UC.01: Đăng ký tài khoản Tourist
- **Tác nhân**: Khách vãng lai (Guest).
- **Tiền điều kiện**: Chưa đăng nhập, email/SĐT chưa đăng ký.
- **Hậu điều kiện**: Tạo bản ghi trong `profiles` (role='tourist', status='Active'), gửi email xác nhận.
- **Luồng**: Nhập Họ tên, Email, SĐT, Mật khẩu -> Hệ thống kiểm tra trùng email/SĐT -> Tạo tài khoản -> Báo xác minh email.
- **Ngoại lệ / Thông báo**: "Số điện thoại/email đã được sử dụng.", "Thông tin đăng ký không hợp lệ."
- **Bảng**: `profiles`, `tourist`.

### UC.02: Đăng ký Guide & Nộp hồ sơ KYC
- **Tác nhân**: Khách muốn trở thành Guide.
- **Tiền điều kiện**: Email/SĐT chưa đăng ký.
- **Hậu điều kiện**: Tạo `profiles` (role='guide', status='Active'), `local_guide` (is_verified=false, kyc_status='Pending'), tạo `kyc_submission` kèm ảnh CCCD/thẻ SV.
- **Luồng**: Nhập thông tin + tải ảnh CCCD mặt trước/sau -> Lưu vào private bucket `kyc-documents` -> Chờ Admin thẩm định.
- **Ngoại lệ / Thông báo**: "Không thể tải giấy tờ. Vui lòng thử lại sau.", "Giá thuê phải từ 80.000 đến 500.000 VNĐ/giờ."
- **Bảng**: `profiles`, `local_guide`, `kyc_submission`, `kyc_file`.

### UC.03: Đăng nhập hệ thống (Tourist & Guide)
- **Tác nhân**: Tourist, Guide đã có tài khoản.
- **Tiền điều kiện**: Tài khoản không bị khóa (`status != 'Locked'`).
- **Hậu điều kiện**: Tạo phiên đăng nhập (JWT).
- **Luồng**: Nhập Email/SĐT + Mật khẩu qua Edge Function `login` -> Trả về session -> Điều hướng theo vai trò.
- **Ngoại lệ / Thông báo**: "Thông tin đăng nhập không đúng.", tài khoản bị khóa -> Chặn đăng nhập.
- **Bảng**: `profiles`.

### UC.04: Đăng nhập Quản trị viên (Admin)
- **Tác nhân**: Quản trị viên hệ thống.
- **Tiền điều kiện**: Tài khoản có role='admin'.
- **Hậu điều kiện**: Vào trang quản trị `/admin/*`.
- **Luồng**: Đăng nhập tại route riêng `/admin/login` -> Kiểm tra quyền Admin -> Cấp quyền vào dashboard.
- **Ngoại lệ**: Nếu tài khoản không phải Admin -> Báo không có quyền truy cập.
- **Bảng**: `profiles`, `admin`.

### UC.05: Thẩm định hồ sơ KYC
- **Tác nhân**: Admin.
- **Tiền điều kiện**: Có hồ sơ KYC trạng thái `Pending`.
- **Hậu điều kiện**: Cập nhật `kyc_submission` (Approved/Rejected), nếu Approved thì `local_guide.is_verified=true`, `kyc_status='Verified'`.
- **Luồng**: Admin xem ảnh CCCD bằng signed URL ngắn hạn -> Bấm Duyệt hoặc Từ chối kèm lý do -> Bắn notification cho Guide.
- **Bảng**: `kyc_submission`, `local_guide`, `notification`.

### UC.06: Quản lý tài khoản
- **Tác nhân**: Admin.
- **Tiền điều kiện**: Đã đăng nhập Admin.
- **Hậu điều kiện**: Khóa/Mở khóa tài khoản, hoặc thu hồi xác minh Guide (`is_verified=false`, ẩn hồ sơ ngay lập tức).
- **Luồng**: Chọn tài khoản -> Bấm Khóa + nhập lý do vi phạm -> Đổi `status='Locked'` -> Hủy phiên người dùng.
- **Bảng**: `profiles`, `local_guide`, `violation`.

---

## NHÓM 2: HƯỚNG DẪN VIÊN (UC.07, UC.08, UC.13, UC.16, UC.17, UC.21, UC.22)

### UC.07: Cập nhật hồ sơ & Giá thuê theo giờ
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Đã đăng nhập Guide.
- **Hậu điều kiện**: Cập nhật `bio`, `hourly_rate` (80.000 - 500.000 VNĐ), `chuyen_mon`, `khu_vuc`, `ngon_ngu`.
- **Ngoại lệ / Thông báo**: "Giá thuê phải từ 80.000 đến 500.000 VNĐ/giờ.", "Không thể cập nhật. Vui lòng thử lại sau."
- **Bảng**: `local_guide`, `guide_chuyen_mon`, `guide_khu_vuc`, `guide_ngon_ngu`.

### UC.08: Cấu hình lịch rảnh (Availability Slots)
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Guide Active.
- **Hậu điều kiện**: Tạo các ô 1 giờ chẵn trong khung 06:00 - 22:00 trạng thái `AVAILABLE`.
- **Ngoại lệ**: Không được xóa/sửa các ô đang `HOLD` hoặc `BUSY` ("Khung giờ đang được giữ chỗ hoặc đã có đơn.").
- **Bảng**: `availability_slot`.

### UC.13: Phản hồi Booking (Chấp nhận / Từ chối)
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Booking ở trạng thái `PENDING`, chưa quá 24h.
- **Hậu điều kiện**: 
  - Chấp nhận (T2): Chuyển `WAITING_PAYMENT` / `DEPOSIT_PENDING`, các ô giờ chuyển `HOLD` (khóa nguyên tử 15p), báo Tourist.
  - Từ chối (T3): Chuyển `CANCELLED(GUIDE_REJECTED)`, các ô giữ `AVAILABLE`.
- **Ngoại lệ / Thông báo**: Nếu có ô không còn AVAILABLE -> "Khung giờ không còn khả dụng.", chỉ còn nút từ chối.
- **Bảng**: `booking`, `availability_slot`, `notification`.

### UC.16: Theo dõi đơn & Ca đồng hành (Guide)
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Đã đăng nhập.
- **Hậu điều kiện**: Xem danh sách ca dẫn, phân loại theo trạng thái, xem chi tiết và thông tin liên hệ Tourist (chỉ từ CONFIRMED).
- **Bảng**: `booking`, `booking_slot`, `profiles`.

### UC.17: Gửi yêu cầu hoàn thành
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Booking `CONFIRMED` và thời gian hiện tại `now >= giờ kết thúc`.
- **Hậu điều kiện**: Ghi nhận thời điểm yêu cầu hoàn thành, mở cửa sổ 24h cho Tourist phản hồi.
- **Ngoại lệ / Thông báo**: Nếu bấm sớm -> "Chỉ có thể gửi yêu cầu sau khi khung giờ đồng hành kết thúc."
- **Bảng**: `booking`, `notification`.

### UC.21: Xác nhận đã nhận đủ 70% tiền mặt
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Booking `COMPLETED`, PaymentStatus `RECONCILIATION_PENDING` (Tourist đã chọn Tiền mặt).
- **Hậu điều kiện**: Booking giữ `COMPLETED`, PaymentStatus chuyển `PAID`. Ví Guide được cộng `(D - F)` VNĐ (Cọc 30% trừ Phí sàn 12%).
- **Bảng**: `booking`, `wallet`, `wallet_transaction`.

### UC.22: Xem ví & Yêu cầu rút tiền
- **Tác nhân**: Guide.
- **Tiền điều kiện**: Số dư khả dụng `>= 200.000 VNĐ`.
- **Hậu điều kiện**: Tạo `payout_request` trạng thái `Pending`, giảm số dư khả dụng (giữ tạm).
- **Ngoại lệ / Thông báo**: "Số dư tối thiểu để rút là 200.000 VNĐ.", số tiền vượt quá khả dụng -> Báo lỗi.
- **Bảng**: `wallet`, `wallet_transaction`, `payout_request`.

---

## NHÓM 3: DU KHÁCH (UC.09 - UC.12, UC.14, UC.15, UC.18, UC.20, UC.26)

### UC.09 & UC.10: Tìm kiếm & Lọc Guide
- **Tác nhân**: Khách vãng lai hoặc Tourist.
- **Tiền điều kiện**: Không bắt buộc đăng nhập (SEO).
- **Hậu điều kiện**: Danh sách Guide `Verified + Active` khớp bộ lọc khu vực, chuyên môn, ngôn ngữ, khoảng giá, ngày giờ rảnh.
- **Ngoại lệ / Thông báo**: Không có kết quả -> "Không tìm thấy Guide phù hợp." hoặc "Không có Guide thỏa điều kiện lọc."
- **Bảng**: `local_guide`, `profiles`, `availability_slot`.

### UC.11: Xem hồ sơ Guide
- **Tác nhân**: Khách vãng lai hoặc Tourist.
- **Hậu điều kiện**: Xem chi tiết bio, ảnh, giá/giờ, đánh giá, lịch rảnh. Tuyệt đối không lộ SĐT, CCCD.
- **Bảng**: `local_guide`, `profiles`, `review`, `availability_slot`.

### UC.12: Khởi tạo Booking
- **Tác nhân**: Tourist đã đăng nhập.
- **Tiền điều kiện**: Giờ bắt đầu `>= now + 26h`, các ô giờ `AVAILABLE`.
- **Hậu điều kiện**: Tạo `booking` trạng thái `PENDING / NOT_PAID`. Khung giờ VẪN GIỮ `AVAILABLE`. Chốt `hourly_rate`, `fee_rate` (12%), tính `G`, `D=30%*G`, `B=70%*G`. Hạn Guide 24h.
- **Bảng**: `booking`, `booking_slot`, `fee_config`, `notification`.

### UC.14: Thanh toán cọc 30%
- **Tác nhân**: Tourist.
- **Tiền điều kiện**: Booking `WAITING_PAYMENT`, trong hạn 15 phút.
- **Hậu điều kiện**:
  - Thành công: Booking `CONFIRMED`, PaymentStatus `DEPOSIT_PAID`, ô giờ `BUSY`, sinh Thỏa thuận dịch vụ & Hóa đơn cọc.
  - Thất bại: Booking `CANCELLED(DEPOSIT_FAILED)`, ô giờ về `AVAILABLE`.
  - Quá hạn: `CANCELLED(DEPOSIT_TIMEOUT)`, ô giờ về `AVAILABLE`.
- **Bảng**: `booking`, `payment_transaction`, `service_agreement`, `invoice`, `availability_slot`.

### UC.15: Theo dõi đơn & Thông báo (Tourist)
- **Tác nhân**: Tourist.
- **Hậu điều kiện**: Xem danh sách đơn và timeline trạng thái, thông tin liên hệ Guide (từ CONFIRMED).
- **Bảng**: `booking`, `notification`.

### UC.18: Phản hồi yêu cầu hoàn tất
- **Tác nhân**: Tourist.
- **Tiền điều kiện**: Booking `CONFIRMED` đã có yêu cầu hoàn thành từ Guide, trong vòng 24h.
- **Hậu điều kiện**:
  - Xác nhận: Booking chuyển `COMPLETED`. Mở bước thanh toán 70% còn lại.
  - Sau 24h không phản hồi: Tự động chuyển `COMPLETED` (T10).
- **Bảng**: `booking`, `notification`.

### UC.20: Thanh toán 70% Online & Quyết toán
- **Tác nhân**: Tourist.
- **Tiền điều kiện**: Booking `COMPLETED`, PaymentStatus `DEPOSIT_PAID`.
- **Hậu điều kiện**: Thanh toán qua cổng -> PaymentStatus `PAID`. Ví Guide được cộng ngay `(G - F)` VNĐ.
- **Bảng**: `booking`, `payment_transaction`, `wallet`, `wallet_transaction`.

### UC.26: Đánh giá Guide
- **Tác nhân**: Tourist.
- **Tiền điều kiện**: Booking `COMPLETED` và `PAID`, chưa đánh giá (đánh giá 1 lần duy nhất).
- **Hậu điều kiện**: Lưu `review` (sao 1-5, nhận xét), tính lại `avg_rating` cho Guide.
- **Bảng**: `review`, `local_guide`.

---

## NHÓM 4: CẢ HAI BÊN (UC.19, UC.24, UC.25)

### UC.19: Gửi khiếu nại
- **Tác nhân**: Tourist hoặc Guide.
- **Tiền điều kiện**: Booking `CONFIRMED` có yêu cầu hoàn thành (hoặc Guide không gửi sau 48h QĐ-07), chưa COMPLETED.
- **Hậu điều kiện**: Booking chuyển `DISPUTED`. Đóng băng giải ngân, chuyển hồ sơ cho Admin xử lý.
- **Ngoại lệ / Thông báo**: "Booking đã hoàn thành, không thể khiếu nại."
- **Bảng**: `complaint`, `complaint_file`, `booking`, `notification`.

### UC.24 & UC.25: Hủy Booking & Modal Xem trước hoàn/phạt
- **Tác nhân**: Tourist hoặc Guide.
- **Tiền điều kiện**: Chưa COMPLETED, không DISPUTED, trước giờ BẮT ĐẦU (QĐ-06).
- **Bắt buộc**: Mở modal xem trước qua RPC `preview_cancellation` (hiển thị ΔT, % phạt, số tiền phạt, số tiền hoàn).
- **Quy tắc phạt cọc Tourist**:
  - $\Delta T > 48h$: Phạt 0%, hoàn 100% cọc.
  - $24h \le \Delta T \le 48h$: Phạt 50% cọc, hoàn 50% cọc; ví Guide + (50% cọc - phí sàn).
  - $\Delta T < 24h$: Phạt 100% cọc, hoàn 0%; ví Guide + (100% cọc - phí sàn).
- **Guide hủy CONFIRMED**: Hoàn 100% cọc cho Tourist, Guide phạt vi phạm (`violation_count + 1`).
- **Hủy chưa cọc (PENDING / WAITING_PAYMENT)**: "Không có hoàn hay phạt cọc.", ô giờ về `AVAILABLE`.
- **Bảng**: `booking`, `cancellation_record`, `availability_slot`, `wallet`.

---

## NHÓM 5: QUẢN TRỊ VIÊN (UC.23, UC.27, UC.28, UC.29)

### UC.23: Duyệt lệnh rút tiền
- **Tác nhân**: Admin.
- **Tiền điều kiện**: Có `payout_request` trạng thái `Pending`.
- **Hậu điều kiện**: Admin kiểm tra -> Chuyển khoản thực tế ngoài ngân hàng -> Bấm "Đã chuyển" -> Trừ số dư ví, hoàn tất. Hoặc bấm Từ chối kèm lý do (nhả số dư khả dụng).
- **Bảng**: `payout_request`, `wallet`, `wallet_transaction`.

### UC.27: Xử lý tranh chấp (Dispute Resolution)
- **Tác nhân**: Admin.
- **Tiền điều kiện**: Booking `DISPUTED`.
- **Hậu điều kiện**:
  - Lỗi Guide: Hoàn 100% cọc cho Tourist, không thu phí sàn, ghi vi phạm Guide.
  - Lỗi Tourist: Admin nhập mức tịch thu cọc $X$ ($0 \le X \le D$). Phí sàn $= X \times \text{Fee\_Rate}$; ví Guide $+ (X - \text{phí})$; hoàn Tourist $D - X$; ghi vi phạm Tourist.
  - Luôn kết thúc trạng thái `CANCELLED(DISPUTE_RESULT)`. Tuyệt đối KHÔNG thu 70%.
- **Bảng**: `complaint`, `booking`, `wallet`, `payment_transaction`.

### UC.28: Báo cáo doanh thu & Thống kê
- **Tác nhân**: Admin.
- **Hậu điều kiện**: Thống kê số lượng đơn theo trạng thái, tổng GMV ($G$), doanh thu phí sàn ($F$), số lượng Guide hoạt động, biểu đồ thời gian, xuất file CSV.
- **Bảng**: `booking`, `payment_transaction`, `fee_config`.

### UC.29: Cấu hình phí sàn
- **Tác nhân**: Admin.
- **Tiền điều kiện**: Nhập tỷ lệ phí trong khoảng 10% – 15%.
- **Hậu điều kiện**: Tạo bản ghi `fee_config` mới có ngày hiệu lực. Không ảnh hưởng các booking đã tạo trước đó.
- **Ngoại lệ / Thông báo**: "Phí sàn phải nằm trong khoảng 10%–15%."
- **Bảng**: `fee_config`.
