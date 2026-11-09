# CÂU HỎI MỞ & MÂU THUẪN GIỮA TÀI LIỆU MÔN HỌC VÀ CODE HIỆN TẠI (`CAU_HOI_MO.md`)

Tài liệu này liệt kê **7 điểm mâu thuẫn hoặc chưa rõ ràng** giữa bộ tài liệu môn học gốc (`01_Bao_cao_yeu_cau_DA_DOI_CHIEU`, `02/03/04_Dac_ta_UC_Nhom_A/B/C_DA_DOI_CHIEU`, `THIẾT KẾ CSDL`) so với file `docs/spec.md` cũ và code hiện tại trong `localbuddy-web/src`.

Theo quy tắc làm việc, tôi **không tự ý đoán** mà ghi rõ nguồn đối chiếu và đề xuất phương án chuẩn để bạn chốt trước khi bước vào giai đoạn viết code.

---

## Câu hỏi 1: Thời điểm mở quyền Gửi khiếu nại (`UC.19`) và Yêu cầu xác nhận hoàn thành (`UC.17` / `UC.18`)

- **Trong tài liệu gốc (`01_Bao_cao_yeu_cau` mục `FR 5.1–5.2`, `BR-08`, `BR-12`, `UC.17`, `UC.18`, `UC.19`):**
  1. Khi tour kết thúc, HDV bấm **"Yêu cầu xác nhận hoàn thành"** (`UC.17`) $\rightarrow$ đơn vẫn ở trạng thái chờ khách xác nhận (chưa sang `COMPLETED` ngay), hệ thống mở đếm ngược **24 giờ**.
  2. Trong cửa sổ 24 giờ này, Du khách có thể bấm **"Xác nhận hoàn thành"** (`UC.18`) để chuyển đơn sang `COMPLETED` (hoặc sau 24 giờ hệ thống tự chuyển `COMPLETED` nếu không có khiếu nại).
  3. **Quy tắc `BR-12` & `UC.19` quy định rõ:** Cả Du khách và HDV chỉ được gửi khiếu nại **sau khi HDV đã gửi yêu cầu hoàn thành (`UC.17`) và TRƯỚC KHI đơn chuyển sang `COMPLETED`**. Một khi đơn đã `COMPLETED`, hệ thống **khóa quyền khiếu nại**.
- **Trong code hiện tại (`BookingContext.tsx`, `actions.ts`) và `docs/spec.md` cũ:**
  - Khi HDV bấm "Hoàn thành", code chuyển thẳng `bookingStatus = 'COMPLETED'` ngay lập tức (bỏ qua `UC.18` và cửa sổ 24 giờ), rồi lại cho bấm nút "Khiếu nại" khi đơn đang ở `COMPLETED` (trái ngược trực tiếp với `BR-12` và `UC.19`).
- **Đề xuất chốt:**
  - Tuân thủ **100% tài liệu gốc (`UC.17` $\rightarrow$ `UC.18` / `UC.19`)**: Khi HDV bấm "Yêu cầu xác nhận hoàn thành", đơn giữ `bookingStatus = 'CONFIRMED'` kèm cờ `completionRequestedAt` (đếm ngược 24h). Trong thời gian này, Du khách hiện nút **"Xác nhận hoàn thành"** (`UC.18`) và cả 2 phía hiện nút **"Gửi khiếu nại"** (`UC.19`). Khi đã sang `COMPLETED`, khóa nút Khiếu nại. (Có nút "Giả lập trôi qua 24h" ở thanh công cụ demo để test nhanh).

---

## Câu hỏi 2: Thời điểm khóa lịch `HOLD` nguyên tử (`BR-04`, `UC.12`, `UC.13`)

- **Trong tài liệu gốc (`BR-04`, `UC.12`, `UC.13`, Phụ lục chuẩn hóa mục 5):**
  - Khi Du khách gửi yêu cầu đặt lịch (`UC.12` - `PENDING`), khung giờ trên lịch của HDV **vẫn là `AVAILABLE`** (cho phép nhiều khách gửi yêu cầu vào cùng khung giờ).
  - Khung giờ chỉ chuyển sang **`HOLD` (nguyên tử)** tại thời điểm **HDV bấm "Chấp nhận"** (`UC.13` $\rightarrow$ đơn sang `WAITING_PAYMENT`, mở đếm ngược 15 phút). Nếu lúc HDV bấm chấp nhận mà slot đã bị `HOLD`/`BUSY` bởi đơn khác thì chặn và báo lỗi.
- **Trong code hiện tại (`BookingContext.tsx` hàm `createBooking`):**
  - Đang gán `HOLD` ngay từ lúc khách vừa tạo đơn `PENDING`.
- **Đề xuất chốt:**
  - Sửa lại đúng chuẩn **`BR-04` & `UC.13`** (và cũng đúng chuẩn Withlocals): Tạo đơn `PENDING` chưa khóa slot; khi HDV bấm **"Chấp nhận"** (`UC.13`) mới khóa nguyên tử `AVAILABLE` $\rightarrow$ `HOLD` trong 15 phút chờ khách đặt cọc 30%.

---

## Câu hỏi 3: Trường "Địa điểm hẹn" (`diaDiemHen`) và "Ghi chú yêu cầu" (`ghiChuYeuCau`) khi Đặt lịch (`UC.12`)

- **Sự khác biệt giữa các tài liệu:**
  - `01_Bao_cao_yeu_cau` (`FR 4.1`) và `UC.12`: Ghi "Du khách bắt buộc nhập Địa điểm hẹn và Ghi chú yêu cầu (Booking Notes)".
  - `THIẾT KẾ CSDL` (Bảng `BOOKING`): Quy định `diaDiemHen NVARCHAR(255) NOT NULL` (bắt buộc), còn `ghiChuYeuCau NVARCHAR(1000) NULL` (tùy chọn).
  - `docs/spec.md` cũ (Q8): Lại cho cả 2 trường là không bắt buộc (optional).
- **Đề xuất chốt:**
  - Phương án A (Theo `FR 4.1` & `UC.12`): Bắt buộc nhập cả **Địa điểm hẹn** và **Ghi chú yêu cầu / Lịch trình mong muốn** (có gợi ý chọn nhanh các điểm đón phổ biến tại Đà Nẵng như Cầu Rồng, Sân bay Đà Nẵng, Chợ Hàn... để người dùng thao tác nhanh).
  - Phương án B (Theo `THIẾT KẾ CSDL`): Bắt buộc **Địa điểm hẹn**, còn **Ghi chú yêu cầu** là tùy chọn.

---

## Câu hỏi 4: Xử lý khi Thanh toán cọc 30% thất bại trên cổng thanh toán (`FR 4.5`, `UC.14`)

- **Sự khác biệt:**
  - `01_Bao_cao_yeu_cau` (`FR 4.5`) và `UC.14` (Ngoại lệ 1): Ghi nếu giao dịch thanh toán cọc 30% thất bại, hệ thống chuyển ngay `BookingStatus = CANCELLED`, `PaymentStatus = NOT_PAID` và nhả lịch `HOLD` $\rightarrow$ `AVAILABLE`.
  - Thông lệ thương mại (Withlocals) và `docs/spec.md` cũ (Q3): Nếu thẻ lỗi/cổng thanh toán báo lỗi nhưng vẫn còn trong thời hạn **15 phút giữ chỗ (`HOLD`)**, khách được bấm **"Thử thanh toán lại"**; chỉ khi hết 15 phút hoặc khách bấm "Hủy thanh toán" mới hủy đơn và nhả slot.
- **Đề xuất chốt:**
  - Phương án A (Bám sát từng chữ `UC.14` Ngoại lệ 1): Hễ cổng thanh toán trả về `FAILED` là chuyển `CANCELLED` và nhả lịch `AVAILABLE` ngay lập tức.
  - Phương án B (Kết hợp thực tế thương mại): Trong màn hình Cổng thanh toán VNPay/MoMo giả lập có 3 nút: **"Thanh toán thành công"**, **"Thử lại (lỗi mạng tạm thời - vẫn giữ 15p)"**, và **"Thanh toán thất bại / Từ chối giao dịch (Hủy đơn & nhả lịch theo UC.14)"**.

---

## Câu hỏi 5: Phán quyết tranh chấp của Admin (`BR-12`, `UC.27`)

- **Trong tài liệu gốc (`BR-12`, `UC.27`):**
  - Admin có **2 hướng phán quyết rõ ràng**:
    1. **Lỗi thuộc về HDV:** Hoàn **100% tiền cọc (30%)** cho Du khách (`REFUND_PENDING` $\rightarrow$ `REFUNDED`), sàn **không thu phí hoa hồng**, cộng `+1` vào `soLanViPham` của HDV.
    2. **Lỗi thuộc về Du khách:** Tịch thu tiền cọc (hoặc xử lý theo quyết định Admin), sàn khấu trừ phí nền tảng $\text{Platform\_Fee} = \text{Forfeited\_Deposit} \times \text{Fee\_Rate}$, phần còn lại cộng vào ví HDV (`AVAILABLE_BALANCE`), cộng `+1` vào `soLanViPham` của Du khách.
  - Cả 2 trường hợp đều kết thúc ở `BookingStatus = CANCELLED` (lý do: tranh chấp) và không thu tiếp 70% còn lại.
- **Trong `docs/spec.md` cũ (Q2) và code hiện tại:**
  - Gộp thành 1 nút duy nhất "Hoàn cọc cho khách" và bỏ mất nhánh xử lý "Lỗi thuộc về Du khách".
- **Đề xuất chốt:**
  - Làm đầy đủ **cả 2 lựa chọn phán quyết của Admin** ("Xác định lỗi do HDV — Hoàn 100% cọc cho khách" và "Xác định lỗi do Du khách — Tịch thu cọc & quyết toán cho HDV sau khi trừ phí sàn") kèm ô nhập biên bản phán quyết (`ketQuaXuLy`) đúng chuẩn `BR-12` & `UC.27`.

---

## Câu hỏi 6: Nhập lý do khi Hủy đơn (`UC.24`, `UC.25`, Bảng `CANCELLATION_RECORD`)

- **Sự khác biệt:**
  - `THIẾT KẾ CSDL` (Bảng `CANCELLATION_RECORD`): Trường `lyDo NVARCHAR(1000) NOT NULL` (bắt buộc nhập lý do hủy).
  - `docs/spec.md` cũ (Q10): Bỏ ô nhập lý do hủy để modal ngắn gọn.
- **Đề xuất chốt:**
  - Trong Modal xác nhận hủy đơn (cho cả Du khách `UC.24` và HDV `UC.25`), hiển thị bảng tính tiền phạt/hoàn theo $\Delta T$ VÀ có **chọn nhanh lý do hủy + ô nhập chi tiết (`lyDo` bắt buộc)** để lưu vào `CANCELLATION_RECORD` đúng chuẩn CSDL.

---

## Câu hỏi 7: Ngưỡng vi phạm (`soLanViPham`) khi HDV hủy đơn đã xác nhận (`BR-06`, `UC.06`, `UC.25`)

- **Trong tài liệu gốc (`BR-06`, `UC.25`, `THIẾT KẾ CSDL`):**
  - Khi HDV hủy một đơn đã `CONFIRMED`, khách được hoàn 100% cọc, HDV nhận 0đ và hệ thống ghi nhận vi phạm (`soLanViPham` tăng thêm 1). Tài liệu không quy định con số tự động khóa tài khoản mà giao quyền khóa tài khoản cho Admin ở `UC.06`.
- **Đề xuất chốt:**
  - Mỗi lần HDV hủy đơn `CONFIRMED` (`UC.25`) hoặc bị xử thua tranh chấp (`UC.27`), hệ thống tự động tăng `soLanViPham + 1` và hiển thị huy hiệu cảnh báo đỏ (ví dụ: `"Cảnh báo: 2 lần vi phạm"`) trên trang Quản lý người dùng của Admin (`UC.06`) để Admin xem xét bấm Khóa tài khoản.
