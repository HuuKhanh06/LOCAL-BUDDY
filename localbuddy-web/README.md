# LocalBuddy Đà Nẵng — Nền tảng Đặt lịch Hướng dẫn viên Địa phương theo Giờ

> **Đồ án môn học:** Hệ thống thương mại điện tử kết nối **Du khách (`Tourist`)**, **Hướng dẫn viên bản địa (`Local Guide`)** và **Quản trị viên (`Admin`)** tại TP. Đà Nẵng.
> **Công nghệ:** React 19 + TypeScript (Strict) + Vite + Tailwind CSS v4 + Supabase (PostgreSQL 15, Row Level Security, Edge Functions, pg_cron).

---

## 1. THÔNG TIN 3 TÀI KHOẢN MẪU KIỂM THỬ (1-CLICK DEMO)

Hệ thống tích hợp sẵn các tài khoản mẫu tại Đà Nẵng để Giảng viên và Hội đồng phản biện kiểm thử nhanh mà không cần tạo mới:

| Vai trò                     | Họ tên               | Email đăng nhập             | Mật khẩu | Chức năng nổi bật                                                                                                                                                     |
| :-------------------------- | :------------------- | :-------------------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Du khách (`Tourist`)**    | **Dương Đăng Huân**  | `huan.duong@gmail.com`      | `123456` | Tìm HDV, đặt lịch 4 tiếng Cầu Rồng - Sơn Trà, thanh toán cọc 30%, hủy đơn xem trước phạt $\Delta T$, tất toán 70% Online/Tiền mặt, đánh giá 2 chiều.                  |
| **HDV (`Local Guide`)**     | **Nguyễn Hữu Khanh** | `khanh.guide@localbuddy.vn` | `123456` | Đã xác minh KYC (`Verified`), đơn giá `250.000 ₫ / giờ`, quản lý ca rảnh (khóa an toàn), duyệt yêu cầu (khóa nguyên tử 15p), xác nhận nhận tiền mặt 70%, ví rút tiền. |
| **HDV Mới (`Pending KYC`)** | **Hoàng Minh Đức**   | `minhduc.kyc@gmail.com`     | `123456` | Hồ sơ mới nộp, bị khóa mở lịch theo quy tắc `BR-01` để kiểm thử luồng thẩm định KYC.                                                                                  |
| **Quản trị viên (`Admin`)** | **Lê Văn Hoàng**     | `admin@localbuddy.vn`       | `123456` | Duyệt/từ chối KYC có lý do, khóa/mở khóa tài khoản vi phạm, phán quyết tranh chấp (2 nhánh), duyệt rút tiền ngân hàng, đổi phí sàn 10%–15%, xuất CSV.                 |

> [!TIP]
> Bạn có thể bấm nút **"Vào ngay"** tại màn hình đăng nhập [`/dang-nhap`](http://localhost:5174/dang-nhap) hoặc dùng thanh chuyển vai trò nhanh ở đáy màn hình.

---

## 2. HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN TẠI LOCAL

### Yêu cầu môi trường

- Node.js $\ge 18.x$ (Khuyên dùng LTS v20.x hoặc v22.x)
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Safari)

### Các bước khởi chạy

```bash
# 1. Đi vào thư mục mã nguồn web
cd localbuddy-web

# 2. Cài đặt toàn bộ dependencies (nếu chưa cài)
npm install

# 3. Tạo tệp cấu hình biến môi trường (mẫu có sẵn không chứa khóa bí mật)
cp .env.example .env

# 4. Khởi chạy máy chủ phát triển Vite
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:5174/`**

---

## 3. CHẠY BỘ KIỂM THỬ TỰ ĐỘNG & KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN

Dự án tích hợp sẵn động cơ PostgreSQL thực (`@electric-sql/pglite` + `Vitest`) để kiểm thử độc lập 100% logic migration SQL, RLS, tính tiền cọc 30%, phạt hủy theo $\Delta T$ và luồng E2E trọn vẹn:

```bash
cd localbuddy-web

# Chạy toàn bộ 11 bài kiểm thử tự động
npm test -- --run

# Kiểm tra chất lượng biên dịch TypeScript Strict & Tối ưu hóa bundle production
npm run build

# Kiểm tra quy tắc code sạch qua Linter
npm run lint
```

**Kết quả kiểm thử tự động:**

- `✓ src/tests/supabase-server-rules.test.ts (8 tests)` — Kiểm thử 27 bảng CSDL, 100% bật RLS, cấm Client ghi tiền, Server RPC và chống đặt trùng lịch.
- `✓ src/tests/e2e-lifecycle.test.ts (3 tests)` — Kiểm thử E2E trọn vẹn 3 vai trò, lớp `PaymentProvider` Sandbox, chống thu tiền trùng (`Idempotency`), và định dạng tiền tệ VNĐ.
- **Tổng cộng: 11/11 tests PASSED (100%).**

---

## 4. HƯỚNG DẪN THAY THẾ CỔNG THANH TOÁN THỰC (VNPAY / MOMO)

Dự án áp dụng mẫu thiết kế **Adapter Pattern** thông qua giao diện [`IPaymentProvider`](src/services/paymentProvider.ts).

Mặc định, ứng dụng chạy trên `SandboxPaymentProvider` cho phép mô phỏng tức thì mọi tình huống thực tế (Thành công, Lỗi mạng cho phép thử lại, Hủy giữa chừng, Ngân hàng từ chối giải phóng lịch, Hết hạn 15 phút và Chống thanh toán trùng lặp).

### Các bước tích hợp Cổng VNPay / MoMo thật:

1. Tạo tệp mới `src/services/vnpayPaymentProvider.ts` triển khai giao diện `IPaymentProvider`:

   ```typescript
   import {
     IPaymentProvider,
     PaymentCheckoutRequest,
     PaymentCheckoutResult,
   } from "./paymentProvider";

   export class VNPayPaymentProvider implements IPaymentProvider {
     readonly mode = "PRODUCTION";
     readonly providerName = "VNPay Gateway";

     async processPayment(
       req: PaymentCheckoutRequest,
     ): Promise<PaymentCheckoutResult> {
       // 1. Gọi API Backend / Edge Function để tạo URL thanh toán VNPay có chữ ký HMAC-SHA512
       const response = await fetch("/api/create-vnpay-url", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           orderId: req.bookingId,
           amount: req.amount,
           orderDesc: `Thanh toan LocalBuddy Da Nang don ${req.bookingId}`,
         }),
       });
       const { paymentUrl } = await response.json();

       // 2. Chuyển hướng người dùng sang cổng thanh toán ngân hàng VNPay
       window.location.href = paymentUrl;

       return {
         ok: true,
         status: "SUCCESS",
         transactionRef: req.bookingId,
         gateway: "VNPAY",
         messageVi: "Đang chuyển hướng sang cổng VNPay...",
         processedAt: new Date().toISOString(),
       };
     }
     // ... triển khai các hàm session & khôi phục tab
   }
   ```

2. Trong `src/services/paymentProvider.ts`, chỉ cần thay đổi dòng xuất bản:
   ```typescript
   // Chuyển từ Sandbox sang Cổng thật khi deploy môi trường Production:
   export const paymentProvider: IPaymentProvider =
     import.meta.env.VITE_PAYMENT_MODE === "LIVE"
       ? new VNPayPaymentProvider()
       : new SandboxPaymentProvider();
   ```

---

## 5. HƯỚNG DẪN TRIỂN KHAI LÊN SUPABASE & VERCEL ĐỂ CÓ LINK CÔNG KHAI

### Bước 1: Khởi tạo Supabase Cloud

1. Đăng ký/Đăng nhập tại [https://supabase.com](https://supabase.com) $\rightarrow$ **New Project** đặt tên `localbuddy-danang` (Khu vực Singapore).
2. Vào **SQL Editor**, lần lượt chạy 4 tệp SQL có sẵn:
   - `supabase/migrations/20261108000001_init_schema.sql` (Khởi tạo 27 bảng CSDL)
   - `supabase/migrations/20261108000002_rls_policies.sql` (Bật RLS & phân quyền bảo mật)
   - `supabase/migrations/20261108000003_server_functions_and_cron.sql` (Hàm server & tự động hóa)
   - `supabase/seed.sql` (Dữ liệu mẫu Đà Nẵng)
3. Vào **Database → Extensions**, bật tiện ích mở rộng **`pg_cron`**.

### Bước 2: Deploy lên Vercel

1. Đẩy mã nguồn lên kho chứa GitHub.
2. Truy cập [https://vercel.com/new](https://vercel.com/new) $\rightarrow$ Chọn repository `localbuddy-web`.
3. Điền các thông số:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `localbuddy-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Khai báo 3 biến môi trường tại mục **Environment Variables**:
   - `VITE_SUPABASE_URL` = _(URL Project Supabase)_
   - `VITE_SUPABASE_ANON_KEY` = _(Anon Public Key)_
   - `VITE_DATA_MODE` = `hybrid`
5. Nhấn **Deploy**. Sau ~45 giây bạn sẽ nhận được liên kết công khai (Ví dụ: `https://localbuddy-danang.vercel.app`). Tệp `vercel.json` đã cấu hình sẵn SPA Rewrites để chuyển tiếp trang mượt mà.

---

## 6. DANH MỤC TÀI LIỆU HỖ TRỢ KIỂM ĐỊNH

- 📋 **[Kịch bản kiểm thử thủ công 29 Use Cases](file:///c:/Users/HP/OneDrive%20-%20dau.edu.vn/Desktop/WEB%20LOCAL%20BUDDY/docs/KICH_BAN_TEST.md)**: Hướng dẫn chi tiết từng bước kiểm tra từ đăng ký đến giải ngân.
- 📊 **[Bảng so sánh ngách bổ sung](file:///c:/Users/HP/OneDrive%20-%20dau.edu.vn/Desktop/WEB%20LOCAL%20BUDDY/docs/NGACH_BO_SUNG.md)**: Đối chiếu 20 ngách nghiệp vụ được bổ sung so với đặc tả gốc và nguồn tham chiếu Withlocals / ToursByLocals / ShowAround.
- 🎨 **[Trang trưng bày Design System](http://localhost:5174/design-system)**: Xem toàn bộ các thành phần giao diện (Buttons, Badges, Pickers, Modals, Cards...) ở mọi trạng thái tương tác.
