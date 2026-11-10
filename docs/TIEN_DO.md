# BÁO CÁO TIẾN ĐỘ THỰC HIỆN DỰ ÁN (TIEN_DO.md)

## 1. TỔNG QUAN CÁC GIAI ĐOẠN
- [x] **GĐ0: Kiểm toán & Kế hoạch** (Trích tài liệu, lập ma trận 29 UC, kiểm toán bản cũ, chép quy tắc bất biến)
- [ ] **GĐ1: Nền móng** (Dọn dẹp code rác, thiết lập bảng màu tokens mới, cấu hình i18n, router, Auth Supabase)
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
- **Giai đoạn đang thực hiện**: GĐ0 (Hoàn thành) -> Sang ngay GĐ1.
- **Đã xong trong GĐ0**:
  - Tạo `docs/QUYET_DINH_NGACH.md` với nguyên văn mục [2] và [3] ("QUY TẮC BẤT BIẾN").
  - Tạo `docs/KIEM_TOAN_BAN_CU.md` liệt kê 10 nhóm vi phạm và giải pháp.
  - Tạo `docs/UC_TRACE.md` đầy đủ 29 Use Case.
  - Tạo `docs/NGHIEP_VU_TRICH_XUAT.md` cô đọng nghiệp vụ 29 Use Case.
- **Việc kế tiếp (GĐ1)**:
  1. Cấu hình bảng màu chuẩn tại `src/styles/tokens.css` (#EB5B38, #272A2D, #E6E4DC, #347CCB) và cấu hình Tailwind.
  2. Bổ sung font Be Vietnam Pro.
  3. Cài đặt và cấu hình `react-i18next` với đầy đủ bộ thông báo chuẩn.
  4. Chuẩn hóa hệ thống Layout (Public, Tourist, Guide, Admin) và Route Guard RBAC.
  5. Cấu hình Supabase client + Auth (UC.01-04), loại bỏ hoàn toàn các nút đăng nhập nhanh hoặc mock trong client.
  6. Chạy typecheck và lint để verify GĐ1.
