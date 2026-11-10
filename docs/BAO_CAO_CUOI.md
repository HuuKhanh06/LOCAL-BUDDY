# BÁO CÁO TỔNG KẾT DỰ ÁN LOCALBUDDY ĐÀ NẴNG (BAO_CAO_CUOI.md)

## 1. TỔNG QUAN HỆ THỐNG
- **Dự án**: Nền tảng đặt Hướng dẫn viên du lịch bản địa theo giờ tại Đà Nẵng (LocalBuddy).
- **Phạm vi**: Hoàn chỉnh 29/29 Use Case (UC.01 – UC.29), 3 vai trò (Tourist, Local Guide, Quản trị viên Admin).
- **Hạ tầng & Công nghệ**: React 19, TypeScript, Tailwind CSS, Radix UI, PostgreSQL (Supabase RLS & RPC), PGlite, Vitest, GitHub Actions & GitHub Pages.
- **Quy tắc tiền tệ**: Đồng bộ 100% bằng bigint VNĐ, làm tròn số nguyên, cọc 30% (D = round(0.3 * G)), còn lại 70% (B = G - D).
- **Bảo mật nghiệp vụ**: Tuyệt đối không để lộ phí sàn `fee_rate` hay số tiền phí cho Du khách trên bất kỳ giao diện, API, chứng từ thỏa thuận hay thông báo nào.

---

## 2. KẾT QUẢ TRIỂN KHAI & MA TRẬN 29 USE CASE
- **Tài khoản (UC.01 - UC.06)**: Đăng ký Tourist / Guide, nộp KYC CCCD & thẻ HDV, Đăng nhập hệ thống, Đăng nhập Admin, Thẩm định KYC, Khóa/mở tài khoản.
- **Quản lý Hướng dẫn viên (UC.07, UC.08, UC.13, UC.16, UC.17, UC.21, UC.22)**: Cập nhật hồ sơ & đơn giá (80k - 500k/h), cấu hình khung giờ rảnh, nhận/từ chối đơn (khóa giữ chỗ HOLD 15 phút), theo dõi ca đồng hành, yêu cầu hoàn thành, xác nhận đã nhận 70% tiền mặt, yêu cầu rút tiền ví.
- **Hành trình Du khách (UC.09 - UC.12, UC.14, UC.15, UC.18, UC.20, UC.26)**: Tìm kiếm & lọc HDV theo khu vực Đà Nẵng, xem chi tiết & đánh giá, khởi tạo booking, thanh toán cọc 30% (Sandbox / VNPay), theo dõi đơn, xác nhận hoàn tất, thanh toán 70% Online hoặc Tiền mặt, đánh giá 1 lần duy nhất.
- **Hủy đơn & Xử lý sự cố (UC.19, UC.24, UC.25, UC.27)**: Gửi khiếu nại tranh chấp, hủy booking có xem trước mức phạt/hoàn theo 3 bậc thời gian ΔT (>48h: hoàn 100%; 24h-48h: phạt 50%; <24h: phạt 100%; HDV hủy: hoàn khách 100%). Admin phân xử tranh chấp công bằng.
- **Quản trị & Phí sàn (UC.23, UC.28, UC.29)**: Duyệt lệnh rút tiền (tối thiểu 200.000 VNĐ), cấu hình phí sàn linh hoạt (10% - 15%), thống kê doanh thu và báo cáo tài chính.

---

## 3. KẾT QUẢ KIỂM THỬ (11/11 TESTS PASSED)
- `src/tests/supabase-server-rules.test.ts`: 8/8 tests passed (Kiểm tra 27 bảng RLS, phân quyền 3 vai trò, công thức tiền, hủy phạt cọc 3 bậc, khóa chống trùng slot concurrency, vòng đời ví HDV, thanh toán tiền mặt +(D-F), cron expire 15m).
- `src/tests/e2e-lifecycle.test.ts`: 3/3 tests passed (Vòng đời hoàn chỉnh từ đăng ký -> KYC -> duyệt -> đặt lịch -> cọc 30% -> hoàn tất -> trả 70% -> review 5 sao -> rút tiền -> giải ngân).

---

## 4. HƯỚNG DẪN TRUY CẬP TRỰC TIẾP QUA GITHUB PAGES
Hệ thống đã được thiết lập quy trình tự động hóa CI/CD thông qua **GitHub Actions** (`.github/workflows/deploy.yml`):
1. **Mã nguồn đã kết nối**: `https://github.com/HuuKhanh06/LOCAL-BUDDY.git`.
2. **Kích hoạt GitHub Pages**:
   - Vào tab **Settings** trên GitHub repository `LOCAL-BUDDY`.
   - Chọn mục **Pages** ở thanh menu bên trái.
   - Tại mục **Build and deployment > Source**, chọn **GitHub Actions**.
3. **Đường dẫn ứng dụng trực tuyến**:
   - Khi workflow build hoàn tất, người dùng truy cập trực tiếp tại:
     👉 `https://huukhanh06.github.io/LOCAL-BUDDY/`
   - Hoàn toàn không cần tải mã nguồn về máy, hoạt động ổn định trên cả máy tính và điện thoại.

---

## 5. DỮ LIỆU ĐĂNG NHẬP MẪU THEO YÊU CẦU
- **Tài khoản Hướng dẫn viên**: Email `nguyenhuukhanh.guide@gmail.com` | Mật khẩu `Guide@123456`
- **Tài khoản Quản trị viên (Admin)**: Email `admin.localbuddy@gmail.com` | Mật khẩu `Admin@123456`
- Du khách mới có thể bấm **Đăng ký** trực tiếp trên trang web để trải nghiệm ngay.

---

## 6. HƯỚNG DẪN CHẠY LOCAL & TỔNG HỢP HỒ SƠ
- **Chạy local (3 lệnh)**:
  1. `cd localbuddy-web`
  2. `npm install`
  3. `npm run dev` (hoặc `npm run test` để chạy toàn bộ 11 tests)
- **Hồ sơ thiết kế & quyết định nghiệp vụ**:
  - `docs/QUYET_DINH_NGACH.md`: Quy tắc bất biến mục [2][3] và 17 quyết định ngách (QĐ-01 đến QĐ-17).
  - `docs/VAN_DE_TON_DONG.md`: Ghi nhận rào cản bên ngoài (SMS trả phí, sandbox payment).
  - `docs/UC_TRACE.md`: Ma trận truy vết đầy đủ 29/29 Use Case (đạt 100% ✅).
  - `docs/CREDITS.md`: Bản quyền media Mixkit / Wikimedia / Unsplash.

