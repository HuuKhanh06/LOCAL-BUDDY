# KỊCH BẢN KIỂM THỬ THỦ CÔNG TOÀN DIỆN 29 USE CASES (`KICH_BAN_TEST.md`)
### Nền tảng Đặt lịch Hướng dẫn viên Địa phương theo Giờ — LocalBuddy Đà Nẵng

Tài liệu này cung cấp **kịch bản kiểm thử chi tiết từng bước (Step-by-step Test Scenarios)** dành cho Giảng viên, Hội đồng phản biện và Người đánh giá để kiểm tra 100% các Use Case (UC.01 → UC.29), các quy tắc nghiệp vụ cốt lõi (BR-01 → BR-13), cơ chế khóa nguyên tử (`Atomic Hold 15m`) và lớp thanh toán giả lập `PaymentProvider` Sandbox.

---

## 0. THÔNG TIN 3 TÀI KHOẢN MẪU KIỂM THỬ (1-CLICK DEMO)

| Vai trò | Họ tên | Email đăng nhập | Mật khẩu | Đặc điểm tài khoản |
| :--- | :--- | :--- | :--- | :--- |
| **Du khách (`Tourist`)** | **Dương Đăng Huân** | `huan.duong@gmail.com` | `123456` | Có 5 đơn đặt lịch ở các trạng thái khác nhau (`Pending`, `WaitingPayment`, `Confirmed`, `Completed`, `Cancelled`). |
| **HDV (`Local Guide`)** | **Nguyễn Hữu Khanh** | `khanh.guide@localbuddy.vn` | `123456` | Đã xác minh KYC Sở Du lịch Đà Nẵng (`Verified`), đơn giá `250.000 ₫ / giờ`, số dư ví `1.240.000 ₫`. |
| **HDV Mới (`Pending KYC`)** | **Hoàng Minh Đức** | `minhduc.kyc@gmail.com` | `123456` | Hồ sơ mới đăng ký, chưa duyệt KYC để kiểm thử quy tắc khóa lịch `BR-01`. |
| **Quản trị viên (`Admin`)** | **Lê Văn Hoàng** | `admin@localbuddy.vn` | `123456` | Quyền Quản trị viên tối cao: duyệt KYC, xử lý tranh chấp, duyệt rút tiền, đổi phí sàn 10%–15%. |

> [!TIP]
> Trên trang `/dang-nhap` hoặc thanh điều hướng, bạn có thể bấm nút **"Vào ngay"** tại từng thẻ để đăng nhập 1 chạm mà không cần nhập thủ công.

---

## PHẦN I: KỊCH BẢN KIỂM THỬ LUỒNG NGƯỜI DÙNG CỐT LÕI (E2E LIFECYCLE)

### Kịch bản 1: Luồng đặt lịch hoàn chỉnh từ A đến Z (Từ Tìm kiếm đến Nhận tiền Ví)

* **Mục tiêu:** Kiểm tra trọn vẹn vòng đời: Du khách tìm HDV $\rightarrow$ Đặt lịch $\rightarrow$ HDV duyệt $\rightarrow$ Khóa `HOLD 15p` $\rightarrow$ Đặt cọc 30% $\rightarrow$ Đi tour $\rightarrow$ HDV báo hoàn thành $\rightarrow$ Khách xác nhận $\rightarrow$ Tất toán 70% $\rightarrow$ Đánh giá 2 chiều $\rightarrow$ HDV rút tiền.
* **Thời gian thực hiện ước tính:** 5 – 7 phút.

| Bước | Người thực hiện & Thao tác | Dữ liệu kiểm thử | Kết quả kỳ vọng (Passed Criteria) |
| :---: | :--- | :--- | :--- |
| **1** | Mở trình duyệt, truy cập `http://localhost:5174/` | Nhấp thanh tìm kiếm Hero hoặc menu "Tìm Hướng dẫn viên" | Hiển thị Trang chủ Withlocals, thanh tìm kiếm 4 tiêu chí (Khu vực Đà Nẵng, Ngày, Giờ, Số người) và danh sách HDV Đà Nẵng. |
| **2** | Vào trang `/guides`, lọc HDV theo khu vực "Bán đảo Sơn Trà" và chọn ngày có lịch trống | Chọn HDV **Nguyễn Hữu Khanh** | URL tự động đồng bộ `?area=Bán+đảo+Sơn+Trà`. Hiển thị thẻ HDV đơn giá chuẩn `250.000 ₫ / giờ`. |
| **3** | Xem hồ sơ chi tiết `/guides/u-guide-1` | Xem huy hiệu KYC, số liệu uy tín, chính sách hủy $\Delta T$ và widget đặt lịch | Widget bên phải hiển thị danh sách khung giờ trống (`AVAILABLE`). Có thanh Sticky "Đặt lịch" cố định trên Mobile. |
| **4** | Chọn 1 khung giờ trống (ví dụ: `08:00 – 12:00`, 4 giờ) $\rightarrow$ Bấm "Tiếp tục đặt" | Chuyển sang form `/dat-lich/u-guide-1` | Tóm tắt tài chính tự động tính: $G = 1.000.000\text{ ₫}$, Cọc 30% $D = 300.000\text{ ₫}$, Còn lại 70% $B = 700.000\text{ ₫}$. |
| **5** | Điền Điểm hẹn: "Đầu Cầu Rồng, Đà Nẵng", Ghi chú: "Ngắm Voọc Sơn Trà", bấm **"Gửi yêu cầu đặt lịch"** | Du khách: Dương Đăng Huân | Đơn tạo thành công với trạng thái `PENDING` (chưa trừ tiền). Slot lịch vẫn mở `AVAILABLE` chờ HDV duyệt (`BR-04`). |
| **6** | Chuyển sang tài khoản HDV **Nguyễn Hữu Khanh** $\rightarrow$ Vào `/guide/don-den` | Xem đơn mới đến | Thấy yêu cầu mới từ Dương Đăng Huân kèm đồng hồ đếm ngược 24 giờ phản hồi (`BR-03`). |
| **7** | HDV bấm **"Chấp nhận yêu cầu"** (`UC.13`) | Đơn chuyển sang `WAITING_PAYMENT` | **Cơ chế Khóa nguyên tử kích hoạt:** Khung giờ lập tức chuyển từ `AVAILABLE` sang `HOLD` 15 phút. Nếu có đơn khác cùng giờ bấm chấp nhận sẽ bị báo lỗi xung đột (`SLOT_CONFLICT`). |
| **8** | Chuyển lại tài khoản Du khách $\rightarrow$ Vào `/don/{id}` | Bấm **"Thanh toán tiền cọc 30%"** | Chuyển đến `/don/{id}/dat-coc`. Đồng hồ đếm ngược 15 phút hiển thị. Chọn cổng thanh toán (VNPay / MoMo) $\rightarrow$ Bấm **"Xác nhận thanh toán cọc"**. |
| **9** | Kiểm tra màn hình chi tiết đơn `/don/{id}` sau khi cọc | Trạng thái: `CONFIRMED` + `DEPOSITED` | Hiển thị **Thỏa thuận dịch vụ điện tử (`SERVICE_AGREEMENT` - BR-10)** và **Nhật ký truy vết đơn (`BOOKING_LOG` - BR-11)**. Khung giờ trên lịch chuyển sang `BUSY`. |
| **10** | Chuyển sang tài khoản HDV $\rightarrow$ Vào `/guide/don-va-ca` $\rightarrow$ Bấm **"Yêu cầu xác nhận hoàn thành tour"** (`UC.17`) | Sau khi kết thúc chuyến đi | Đơn mở cửa sổ đếm ngược 24 giờ (`BR-08`) chờ khách xác nhận hoặc khiếu nại. Có nút "Tua hết 24h" để test nhanh. |
| **11** | Chuyển sang tài khoản Du khách $\rightarrow$ Bấm **"Xác nhận hoàn thành"** (`UC.18`) $\rightarrow$ Bấm **"Tất toán 70% còn lại"** (`UC.20`) | Chọn thanh toán `ONLINE` hoặc `CASH` | Nếu chọn Online: thanh toán $700.000\text{ ₫}$ qua Sandbox $\rightarrow$ Đơn chuyển sang `COMPLETED` + `PAID`. Ví HDV được cộng $+ (G - F) = +(1.000.000 - 120.000) = +880.000\text{ ₫}$. |
| **12** | Du khách gửi **Đánh giá 5 sao** (`UC.26`) | "HDV dẫn tour rất nhiệt tình, am hiểu Đà Nẵng!" | Đánh giá hiển thị ngay trên hồ sơ HDV, điểm `avgRating` tự động tính lại. |
| **13** | HDV vào `/guide/don-va-ca` bấm **"Đánh giá hai chiều & Phản hồi khách"** | Chấm khách 5 sao + lời cảm ơn | Hoàn tất chu trình đánh giá 2 chiều. Khách mở lại chi tiết đơn sẽ thấy phản hồi của HDV. |
| **14** | HDV vào `/guide/vi` $\rightarrow$ Bấm **"Rút tiền về tài khoản ngân hàng"** (`UC.22`) | Nhập số tiền: $500.000\text{ ₫}$ ($\ge 200.000\text{ ₫}$) | Lệnh rút `WD-xxxx` tạo thành công ở trạng thái `PENDING`. Số dư ví khả dụng bị trừ tạm thời. |
| **15** | Chuyển sang tài khoản **Admin** $\rightarrow$ Vào `/admin/rut-tien` $\rightarrow$ Bấm **"Phê duyệt & Đã chuyển khoản"** (`UC.23`) | Nhập mã UNC: `UNC-VCB-8899` | Lệnh rút đổi sang `COMPLETED`. HDV nhận thông báo tiền đã về tài khoản ngân hàng. |

---

## PHẦN II: KỊCH BẢN KIỂM THỬ TỪNG NHÓM USE CASE & NGÁCH NGOẠI LỆ

### Kịch bản 2: Kiểm thử Xác thực Auth, Phân quyền RBAC & Trang lỗi 403 / 404 (UC.01 – UC.04, UC.06)

1. **Đăng ký tài khoản mới (`UC.01`):**
   - Vào `/dang-ky`, chọn vai trò "Hướng dẫn viên địa phương".
   - Nhập thông tin, hệ thống tự động kiểm tra định dạng email và mật khẩu tối thiểu 6 ký tự.
   - Bấm "Tạo tài khoản" $\rightarrow$ Hiển thị thông báo xác minh email và chuyển hướng đăng nhập.
2. **Quên mật khẩu (`UC.03`):**
   - Vào `/quen-mat-khau`, nhập `huan.duong@gmail.com` $\rightarrow$ Gửi liên kết đặt lại mật khẩu $\rightarrow$ Hiển thị hướng dẫn kiểm tra hòm thư.
3. **Đổi mật khẩu trong hồ sơ cá nhân (`UC.04`):**
   - Vào `/ho-so-ca-nhan`, kéo xuống mục **"Đổi mật khẩu tài khoản"**, nhập mật khẩu hiện tại và mật khẩu mới $\rightarrow$ Lưu thành công.
4. **Kiểm tra Trang 403 Forbidden:**
   - Đang đăng nhập tài khoản Du khách `huan.duong@gmail.com`, gõ trực tiếp URL quản trị: `http://localhost:5174/admin/kyc`.
   - **Kết quả:** Hệ thống chặn lại và hiển thị màn hình **Trang 403 — Từ chối truy cập (RBAC)** kèm nút *"Chuyển nhanh sang Quản trị viên (Admin)"*.
5. **Kiểm tra Trang 404 Not Found:**
   - Gõ đường dẫn không tồn tại: `http://localhost:5174/duong-dan-khong-ton-tai`.
   - **Kết quả:** Hiển thị **Trang 404 — Lạc đường rồi!** với phong cách Đà Nẵng và nút quay về Trang chủ.
6. **Kiểm tra Khóa tài khoản vi phạm (`UC.06`):**
   - Đăng nhập Admin $\rightarrow$ Vào `/admin/tai-khoan` $\rightarrow$ Bấm **"Khóa tài khoản"** đối với một user $\rightarrow$ Đăng nhập bằng user đó $\rightarrow$ Bị chặn hoàn toàn với màn hình cảnh báo tài khoản bị tạm khóa.

---

### Kịch bản 3: Kiểm thử Đặt cọc 30%, Hủy đơn & Hoàn phạt cọc theo $\Delta T$ (BR-05, BR-06, BR-07, UC.14, UC.24, UC.25)

1. **Kiểm thử 3 bậc phạt cọc theo khoảng cách thời gian $\Delta T$ (`BR-06`):**
   - Vào đơn đặt lịch đã đặt cọc (`CONFIRMED` + `DEPOSITED`), bấm nút **"Hủy đơn đặt lịch"** (`UC.24`).
   - Modal hủy đơn hiển thị **Bảng xem trước tiền phạt và tiền hoàn**:
     - Bấm thử mốc **$\Delta T = 72\text{h}$ ($>48\text{h}$):** Phạt $0\%$, Du khách được hoàn **$100\%$** tiền cọc ($300.000\text{ ₫}$).
     - Bấm thử mốc **$\Delta T = 36\text{h}$ ($24\text{–}48\text{h}$):** Phạt $50\%$ ($150.000\text{ ₫}$), Du khách được hoàn **$50\%$** cọc ($150.000\text{ ₫}$). HDV nhận bồi thường $+132.000\text{ ₫}$ (sau khi trừ phí sàn 12%).
     - Bấm thử mốc **$\Delta T = 12\text{h}$ ($<24\text{h}$):** Phạt **$100\%$** cọc ($300.000\text{ ₫}$), Du khách nhận $0\text{ ₫}$.
   - Chọn lý do hủy bắt buộc (ràng buộc `CANCELLATION_RECORD.lyDo NOT NULL`) $\rightarrow$ Bấm xác nhận hủy $\rightarrow$ Tiền bồi thường lập tức được cộng vào ví HDV và ghi nhận nhật ký giao dịch.
2. **Kiểm thử HDV hủy đơn sát giờ (`UC.25`):**
   - HDV vào `/guide/don-va-ca`, chọn đơn đã xác nhận và bấm **"Hủy nhận dẫn khách"**.
   - Modal cảnh báo chế tài hiển thị: Du khách được hoàn **$100\%$** cọc, HDV nhận $0\text{ ₫}$ và bị hệ thống tự động cộng **$+1$ lần vi phạm (`soLanViPham`)**.
3. **Kiểm thử Hết hạn giữ chỗ 15 phút (`BR-05`):**
   - Tại trang thanh toán cọc `/don/{id}/dat-coc`, bấm nút **"⚡ Mô phỏng hết 15 phút giữ chỗ ngay"**.
   - **Kết quả:** Đơn tự động hủy chuyển sang `CANCELLED`, khung giờ lập tức nhả từ `HOLD` về `AVAILABLE` cho du khách khác đặt.

---

### Kịch bản 4: Kiểm thử Lớp Thanh toán `PaymentProvider` Sandbox & Các ngách mạng

1. **Khôi phục phiên khi đóng tab giữa chừng:**
   - Đang ở trang `/don/{id}/dat-coc`, bấm nút **"Giả lập Hủy giữa chừng / Đóng tab"** hoặc tải lại trang.
   - **Kết quả:** Hệ thống khôi phục phiên an toàn, hiển thị banner: *"Phát hiện phiên thanh toán trước đó bị gián đoạn. Chưa có khoản tiền nào bị trừ — khung giờ vẫn đang được bảo lưu..."*.
2. **Chống thanh toán trùng lặp (`Idempotency Key`):**
   - Sau khi thanh toán cọc thành công, cố tình mở lại đường dẫn thanh toán hoặc bấm thanh toán lại.
   - **Kết quả:** Hệ thống chặn lại với thông báo: *"Khoản thanh toán này đã được ghi nhận trước đó... Hệ thống đã tự động chặn trừ tiền trùng lặp!"*.
3. **Mô phỏng ngân hàng từ chối giao dịch:**
   - Bấm nút **"Giả lập Ngân hàng từ chối GD"** $\rightarrow$ Đơn hủy và giải phóng khung giờ theo đúng `UC.14` Ngoại lệ 1.

---

### Kịch bản 5: Kiểm thử Thẩm định KYC & Quản lý Lịch rảnh HDV (BR-01, UC.09, UC.10, UC.11)

1. **Chặn mở lịch khi chưa duyệt KYC (`BR-01`):**
   - Đăng nhập HDV mới **Hoàng Minh Đức** (`minhduc.kyc@gmail.com`) $\rightarrow$ Vào `/guide/lich-ranh`.
   - **Kết quả:** Nút thêm lịch bị vô hiệu hóa kèm banner cảnh báo vàng: *"Tài khoản của bạn chưa hoàn tất xác minh KYC (BR-01)..."*.
2. **Nộp hồ sơ KYC (`UC.09`):**
   - Vào `/guide/kyc`, nhập số CCCD, ngân hàng nhận tiền, tải ảnh giấy tờ $\rightarrow$ Gửi thẩm định.
3. **Admin phê duyệt KYC (`UC.10`):**
   - Đăng nhập Admin $\rightarrow$ Vào `/admin/kyc` $\rightarrow$ Xem hồ sơ, bấm **"Phê duyệt hồ sơ"** kèm ghi chú $\rightarrow$ HDV lập tức có huy hiệu Đã xác minh (`Verified`) và được mở lịch nhận khách.
4. **Sửa / Xóa khung giờ rảnh (`UC.11`):**
   - HDV vào `/guide/lich-ranh`:
     - Khung giờ đang trống (`AVAILABLE`): Có nút **"Sửa giờ"**, **"Tạm đóng"**, **"Xóa"**.
     - Khung giờ đang có khách giữ chỗ (`HOLD`) hoặc đã đặt lịch (`BUSY`): Khóa hoàn toàn nút sửa/xóa để bảo vệ tính toàn vẹn dữ liệu.

---

### Kịch bản 6: Kiểm thử Khiếu nại, No-Show & Phán quyết Tranh chấp Admin (UC.19, UC.27, BR-12)

1. **Báo HDV vắng mặt (No-Show) hoặc vi phạm lịch trình:**
   - Trong cửa sổ 24 giờ sau chuyến đi (hoặc khi HDV không đến điểm hẹn), Du khách bấm **"Gửi khiếu nại sự cố"** hoặc **"Báo HDV vắng mặt (No-show)"** (`UC.19`).
   - Tải tệp bằng chứng ảnh/biên bản lên Supabase Storage (`complaint-evidences`) $\rightarrow$ Đơn chuyển sang `DISPUTED`.
2. **Admin phân xử tranh chấp (`UC.27`):**
   - Đăng nhập Admin $\rightarrow$ Vào `/admin/tranh-chap`:
     - **Nhánh 1: Lỗi do HDV (`GUIDE_FAULT`):** Hoàn lại $100\%$ cọc cho khách, sàn không thu phí ($0\text{ ₫}$), cộng $+1$ vi phạm cho HDV.
     - **Nhánh 2: Lỗi do Du khách (`TOURIST_FAULT`):** Tịch thu cọc, trừ phí sàn $12\%$, cộng phần còn lại vào ví bồi thường cho HDV, cộng $+1$ vi phạm cho Du khách.

---

### Kịch bản 7: Kiểm thử Cấu hình Phí sàn 10%–15% & Xuất Báo cáo CSV (UC.28, UC.29, BR-13)

1. **Điều chỉnh phí sàn (`UC.29`):**
   - Admin vào `/admin/phi-san`.
   - Chọn mức phí từ $10\%$ đến $15\%$ (ví dụ $14\%$), nhập lý do $\rightarrow$ Bấm lưu.
   - Kiểm tra **Bảo toàn snapshot:** Đơn cũ vẫn giữ nguyên tỷ lệ phí lúc đặt lịch, chỉ đơn tạo mới sau đó mới áp dụng tỷ lệ $14\%$.
   - Bảng **Nhật ký truy vết (Audit Log)** ghi nhận sự kiện thay đổi tức thì.
2. **Báo cáo doanh thu & Xuất tệp CSV (`UC.28`):**
   - Admin vào `/admin/bao-cao`, lọc theo ngày hoặc trạng thái $\rightarrow$ Bấm **"Xuất báo cáo đối soát CSV"** $\rightarrow$ Tệp CSV tải xuống máy đầy đủ các cột đối soát tài chính theo chuẩn UTF-8 BOM tiếng Việt.

---

## BẢNG TỔNG HỢP TRẠNG THÁI KIỂM THỬ (TEST VERIFICATION MATRIX)

| STT | Hạng mục kiểm thử | Công cụ kiểm tra | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Hạ tầng CSDL 27 bảng, 100% bật RLS & Cấm Client ghi tiền | `npm test` (`supabase-server-rules.test.ts`) | **PASSED (8/8)** |
| 2 | E2E Vòng đời 3 vai trò & Khóa nguyên tử chống trùng lịch | `npm test` (`e2e-lifecycle.test.ts`) | **PASSED (3/3)** |
| 3 | Lớp cổng thanh toán `PaymentProvider` Sandbox & Chống thu trùng | Vitest + Browser Sandbox | **PASSED** |
| 4 | Kiểm tra biên dịch TypeScript Strict & Vite Production Build | `npm run build` | **PASSED (0 errors)** |
| 5 | Kiểm tra cú pháp & Quy tắc React linter | `npm run lint` (`oxlint`) | **PASSED (0 errors)** |
| 6 | Kiểm tra giao diện Responsive (Mobile 390px, Tablet, Desktop) | Trình duyệt DevTools | **PASSED** |
