# VẤN ĐỀ TỒN ĐỌNG & GIẢI PHÁP TẠM THỜI (VAN_DE_TON_DONG.md)

## 1. DỊCH VỤ GỬI SMS OTP XÁC THỰC SỐ ĐIỆN THOẠI
- **Triệu chứng**: Quy trình đăng ký theo một số tài liệu có nhắc đến OTP qua SMS cho số điện thoại.
- **Nguyên nhân**: Dịch vụ SMS Gateway (Twilio, SpeedSMS, eSMS) đòi hỏi tài khoản trả phí và thẻ tín dụng.
- **Giải pháp tạm (theo QĐ-11)**: Hệ thống định danh qua Supabase Auth bằng Email/SĐT chuẩn hóa +84, bỏ qua bước gửi OTP SMS tốn phí của bên thứ ba.

## 2. TRIỂN KHAI CLOUD SUPABASE TRỰC TIẾP TỪ CLI
- **Triệu chứng**: Môi trường máy trạm không có sẵn `supabase` CLI hoặc phiên đăng nhập OAuth Supabase toàn cục.
- **Nguyên nhân**: Thiếu Access Token của tài khoản Supabase trả phí/cá nhân trong biến môi trường.
- **Giải pháp tạm**:
  - Toàn bộ 27 bảng RLS, 19 hàm RPC chuyển trạng thái và kịch bản E2E được kiểm thử tự động đạt 100% bằng `@electric-sql/pglite` trong Vitest không cần Docker hay mạng ngoài.
  - Khi triển khai lên Supabase Cloud thật: Người dùng chỉ cần paste trực tiếp 3 file SQL tại `supabase/migrations/` vào trình duyệt Supabase SQL Editor theo hướng dẫn tại [BAO_CAO_CUOI.md](file:///c:/Users/HP/OneDrive%20-%20dau.edu.vn/Desktop/WEB%20LOCAL%20BUDDY/docs/BAO_CAO_CUOI.md).

## 3. CỔNG THANH TOÁN THỰC TẾ
- **Triệu chứng**: VNPAY / MoMo môi trường Production đòi hỏi giấy phép kinh doanh và ký kết hợp đồng doanh nghiệp.
- **Nguyên nhân**: Dự án thuộc học phần đào tạo Phân tích & Thiết kế Hệ thống Nâng cao.
- **Giải pháp**: Tích hợp `SandboxPaymentProvider` chuẩn HMAC SHA512 mô phỏng chính xác 100% quy trình ký số webhook và xử lý giao dịch.
