# BÁO CÁO TIẾN ĐỘ THỰC HIỆN DỰ ÁN (TIEN_DO.md)

## 1. TỔNG QUAN CÁC GIAI ĐOẠN
- [x] **GĐ0: Kiểm toán & Kế hoạch** (Trích tài liệu, lập ma trận 29 UC, kiểm toán bản cũ, chép quy tắc bất biến)
- [x] **GĐ1: Nền móng** (Dọn dẹp code rác, thiết lập bảng màu tokens mới, cấu hình i18n, router, Auth Supabase)
- [ ] **GĐ2: CSDL & Logic Server** (Migrations Postgres, enum, RPC T1–T19, RLS, lazy expiry, seed data)
- [ ] **GĐ3: Thanh toán & Ví** (PaymentProvider Sandbox + VNPay, Edge Functions, hóa đơn cọc, Thỏa thuận dịch vụ)
- [ ] **GĐ4: Lát cắt dọc luồng chính** (Tìm kiếm, xem hồ sơ, đặt lịch, chấp nhận, cọc 30%, xác nhận)
- [ ] **GĐ5: Hoàn tất & Tiền** (Yêu cầu hoàn thành, xác nhận hoàn thành, trả 70% Online / Tiền mặt, rút tiền, review)
- [ ] **GĐ6: Hủy · Tranh chấp · Admin** (Modal hủy xem trước, xử lý tranh chấp, quản trị KYC/rút tiền/phí sàn)
- [ ] **GĐ7: Trang công khai & Media** (Landing page, video hero, ảnh Đà Nẵng, trang tĩnh pháp lý, CREDITS.md)
- [ ] **GĐ8: Hoàn thiện** (Kiểm toán sạch audit-clean, WCAG AA, Lighthouse, đa ngôn ngữ vi/en, Playwright E2E)
- [ ] **GĐ9: Triển khai & Báo cáo** (Deploy Cloud / Vercel, smoke test production, BAO_CAO_CUOI.md, tag v1.0.0)

---

## 2. CHI TIẾT TRẠNG THÁI HIỆN TẠI
- **Giai đoạn đang thực hiện**: GĐ1 (Hoàn thành) -> Sang ngay GĐ2.
- **Đã xong trong GĐ1**:
  - Cài đặt `@fontsource/be-vietnam-pro`, `i18next`, `react-i18next`, `zod`, `date-fns`.
  - Cấu hình bảng màu chuẩn tại `src/styles/tokens.css` và `src/styles/globals.css`.
  - Thiết lập module đa ngôn ngữ `src/i18n/index.ts` chuẩn câu thông báo.
  - Chuẩn hóa layout Public/Tourist/Guide/Admin với footer dòng ghi chú học phần.
  - Xóa bỏ nút đăng nhập nhanh / mock demo ở trang Login/Register, dùng Auth thật.
  - Bổ sung các trang tĩnh pháp lý chuẩn: Điều khoản, Riêng tư, Hủy hoàn, An toàn, FAQ.
  - Build và kiểm thử linter thành công 100%.
- **Việc kế tiếp (GĐ2)**:
  1. Kiểm tra toàn bộ schema PostgreSQL và migrations (`supabase/migrations/`).
  2. Xác nhận đầy đủ 19 RPC chuyển trạng thái (T1-T19) và lazy expiry.
  3. Kiểm tra bảo mật RLS và ẩn Fee_Rate với Tourist.
  4. Chạy bộ test CSDL PGlite/Vitest mục tiêu và hoàn tất Gate GĐ2.
