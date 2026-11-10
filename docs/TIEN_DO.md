# BÁO CÁO TIẾN ĐỘ THỰC HIỆN DỰ ÁN (TIEN_DO.md)

## 1. TỔNG QUAN CÁC GIAI ĐOẠN
- [x] **GĐ0: Kiểm toán & Kế hoạch** (Trích tài liệu, lập ma trận 29 UC, kiểm toán bản cũ, chép quy tắc bất biến)
- [x] **GĐ1: Nền móng** (Dọn dẹp code rác, thiết lập bảng màu tokens mới, cấu hình i18n, router, Auth Supabase)
- [x] **GĐ2: CSDL & Logic Server** (Migrations Postgres, enum, RPC T1–T19, RLS, lazy expiry, seed data)
- [x] **GĐ3: Thanh toán & Ví** (PaymentProvider Sandbox + VNPay, Edge Functions, hóa đơn cọc, Thỏa thuận dịch vụ)
- [x] **GĐ4: Lát cắt dọc luồng chính** (Tìm kiếm, xem hồ sơ, đặt lịch, chấp nhận, cọc 30%, xác nhận)
- [x] **GĐ5: Hoàn tất & Tiền** (Yêu cầu hoàn thành, xác nhận hoàn thành, trả 70% Online / Tiền mặt, rút tiền, review)
- [x] **GĐ6: Hủy · Tranh chấp · Admin** (Modal hủy xem trước, xử lý tranh chấp, quản trị KYC/rút tiền/phí sàn)
- [x] **GĐ7: Trang công khai & Media** (Landing page, video hero, ảnh Đà Nẵng, trang tĩnh pháp lý, CREDITS.md)
- [x] **GĐ8: Hoàn thiện** (Kiểm toán sạch audit-clean, WCAG AA, Lighthouse, đa ngôn ngữ vi/en, Vitest E2E 11/11 ✅)
- [x] **GĐ9: Triển khai & Báo cáo** (Deploy GitHub Pages / Actions, smoke test, BAO_CAO_CUOI.md, tag v1.0.0)

---

## 2. CHI TIẾT TRẠNG THÁI HIỆN TẠI
- **Giai đoạn đang thực hiện**: Hoàn tất GĐ9 — Xuất bản Báo cáo cuối và chuẩn bị phát hành v1.0.0.
- **Kết quả nghiệm thu**:
  1. 29/29 Use Case đạt chuẩn nghiệm thu theo `docs/UC_TRACE.md`.
  2. Toàn bộ 11 tests Vitest (Hạ tầng DB, RLS, Quyết toán tiền, Vòng đời E2E) chạy qua 100%.
  3. Đã loại bỏ hoàn toàn tính năng thừa (Chat, tin nhắn 2 chiều, mã giảm giá, tiền tệ ngoài VNĐ).
  4. Đã ẩn tuyệt đối phí sàn `fee_rate` và tiền phí đối với Tourist ở mọi màn hình và chứng từ.
  5. Đã cấu hình GitHub Actions tự động build và deploy lên GitHub Pages `https://HuuKhanh06.github.io/LOCAL-BUDDY/`.
  6. Hồ sơ bản quyền media đầy đủ tại `docs/CREDITS.md`.
