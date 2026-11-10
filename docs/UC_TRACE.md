# MA TRẬN TRUY VẾT 29 USE CASE (UC_TRACE.md)

| UC | Tên Use Case | Route | RPC / Edge Function | Bảng dữ liệu chính | Test ID | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UC.01** | Đăng ký tài khoản Tourist | `/register` | Supabase Auth + `handle_new_user` | `profiles`, `tourist` | `TEST-UC01-01` | ⏳ |
| **UC.02** | Đăng ký Guide & nộp KYC | `/register?role=guide`, `/guide/kyc` | `submit_kyc` | `profiles`, `local_guide`, `kyc_submission` | `TEST-UC02-01` | ⏳ |
| **UC.03** | Đăng nhập hệ thống | `/login` | `edge:login` / Supabase Auth | `profiles` | `TEST-UC03-01` | ⏳ |
| **UC.04** | Đăng nhập Quản trị viên | `/admin/login` | Supabase Auth + RBAC Guard | `profiles`, `admin` | `TEST-UC04-01` | ⏳ |
| **UC.05** | Thẩm định hồ sơ KYC | `/admin/kyc` | `admin_review_kyc` | `kyc_submission`, `local_guide`, `notification` | `TEST-UC05-01` | ⏳ |
| **UC.06** | Quản lý tài khoản | `/admin/accounts` | `admin_set_account_status`, `revoke_verification` | `profiles`, `local_guide` | `TEST-UC06-01` | ⏳ |
| **UC.07** | Cập nhật hồ sơ & giá/giờ | `/guide/profile` | `update_guide_profile` | `local_guide`, `guide_khu_vuc`, `guide_ngon_ngu` | `TEST-UC07-01` | ⏳ |
| **UC.08** | Cấu hình lịch rảnh | `/guide/availability` | `set_availability_slots` | `availability_slot` | `TEST-UC08-01` | ⏳ |
| **UC.09** | Tìm kiếm Guide | `/`, `/guides` | `search_guides` | `local_guide`, `profiles`, `availability_slot` | `TEST-UC09-01` | ⏳ |
| **UC.10** | Lọc kết quả tìm kiếm | `/guides` | `search_guides` | `local_guide`, `guide_chuyen_mon`, `guide_khu_vuc` | `TEST-UC10-01` | ⏳ |
| **UC.11** | Xem hồ sơ Guide | `/guides/:slug` | `get_guide_detail` | `local_guide`, `profiles`, `review`, `availability_slot` | `TEST-UC11-01` | ⏳ |
| **UC.12** | Khởi tạo Booking | `/guides/:slug/book` | `create_booking` (T1) | `booking`, `booking_slot`, `fee_config`, `notification` | `TEST-UC12-01` | ⏳ |
| **UC.13** | Phản hồi Booking | `/guide/requests` | `guide_respond` (T2/T3) | `booking`, `availability_slot`, `notification` | `TEST-UC13-01` | ⏳ |
| **UC.14** | Thanh toán cọc 30% | `/bookings/:id/deposit` | `edge:create-checkout`, `deposit_success` (T5/T6/T7) | `booking`, `payment_transaction`, `service_agreement` | `TEST-UC14-01` | ⏳ |
| **UC.15** | Theo dõi đơn & thông báo (Tourist) | `/my-bookings`, `/bookings/:id` | `get_tourist_bookings`, Realtime | `booking`, `notification` | `TEST-UC15-01` | ⏳ |
| **UC.16** | Theo dõi đơn & ca đồng hành (Guide) | `/guide/bookings`, `/guide/bookings/:id`| `get_guide_bookings`, Realtime | `booking`, `availability_slot`, `notification` | `TEST-UC16-01` | ⏳ |
| **UC.17** | Gửi yêu cầu hoàn thành | `/guide/bookings/:id` | `request_completion` (T8) | `booking`, `notification` | `TEST-UC17-01` | ⏳ |
| **UC.18** | Phản hồi yêu cầu hoàn tất | `/bookings/:id` | `tourist_confirm` (T9/T10) | `booking`, `notification` | `TEST-UC18-01` | ⏳ |
| **UC.19** | Gửi khiếu nại | `/bookings/:id/complaint` | `file_complaint` (T11) | `complaint`, `complaint_file`, `booking`, `notification` | `TEST-UC19-01` | ⏳ |
| **UC.20** | Thanh toán 70% & quyết toán Online | `/bookings/:id/balance` | `choose_balance_online` (T12/T13/T14) | `booking`, `payment_transaction`, `wallet`, `wallet_transaction` | `TEST-UC20-01` | ⏳ |
| **UC.21** | Xác nhận đã nhận đủ 70% tiền mặt | `/guide/bookings/:id` | `confirm_cash_received` (T15/T16) | `booking`, `wallet`, `wallet_transaction` | `TEST-UC21-01` | ⏳ |
| **UC.22** | Xem ví & yêu cầu rút tiền | `/guide/wallet` | `request_payout` | `wallet`, `wallet_transaction`, `payout_request` | `TEST-UC22-01` | ⏳ |
| **UC.23** | Duyệt lệnh rút tiền | `/admin/payouts` | `admin_approve_payout`, `admin_complete_payout` | `payout_request`, `wallet`, `wallet_transaction` | `TEST-UC23-01` | ⏳ |
| **UC.24** | Huỷ Booking | `/bookings/:id/cancel` | `cancel_booking` (T17) | `booking`, `cancellation_record`, `availability_slot` | `TEST-UC24-01` | ⏳ |
| **UC.25** | Xem trước khoản hoàn/phạt cọc | Modal Huỷ | `preview_cancellation` | `booking`, `cancellation_record` | `TEST-UC25-01` | ⏳ |
| **UC.26** | Đánh giá Guide | `/bookings/:id/review` | `submit_review` (T19) | `review`, `local_guide`, `booking` | `TEST-UC26-01` | ⏳ |
| **UC.27** | Xử lý tranh chấp | `/admin/disputes/:id` | `admin_resolve_dispute` (T18) | `complaint`, `booking`, `wallet`, `payment_transaction` | `TEST-UC27-01` | ⏳ |
| **UC.28** | Báo cáo doanh thu & thống kê | `/admin/reports` | `admin_get_reports` | `booking`, `payment_transaction`, `fee_config` | `TEST-UC28-01` | ⏳ |
| **UC.29** | Cấu hình phí sàn | `/admin/fee-config` | `admin_set_fee_rate` | `fee_config`, `profiles` | `TEST-UC29-01` | ⏳ |
