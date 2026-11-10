# QUYẾT ĐỊNH NGÁCH & QUY TẮC BẤT BIẾN

## PHẦN 1: QUY TẮC BẤT BIẾN (CHÉP NGUYÊN VĂN TỪ MỤC [2] VÀ [3])

### [2] NGHIỆP VỤ BẤT BIẾN (đã đối chiếu đặc tả)
TIỀN (bigint VNĐ, không số thực; chỉ VNĐ):
- Rate Guide 80.000–500.000 VNĐ/giờ (kiểm khi lưu hồ sơ). G = rate × số giờ. D = round(30%·G). B = G − D.
- Phí sàn F = round(G × Fee_Rate). Fee_Rate 10–15% do Admin cấu hình, CHỐT vào booking lúc tạo (cùng rate/giờ); đổi sau không ảnh hưởng đơn cũ.
- F là khoản trừ vào thu nhập Guide; KHÔNG xuất hiện ở bất kỳ màn hình/API/thông báo/hoá đơn nào của Tourist (Tourist chỉ thấy tổng, cọc, còn lại, hoàn/phạt). Guide thấy phí ở ví. Có test.
TRẠNG THÁI:
- BookingStatus: PENDING, WAITING_PAYMENT, CONFIRMED, DISPUTED, COMPLETED, CANCELLED + cancel_reason ∈ {GUIDE_REJECTED, GUIDE_TIMEOUT, DEPOSIT_TIMEOUT, DEPOSIT_FAILED, USER_CANCELLED, DISPUTE_RESULT}.
- PaymentStatus: NOT_PAID, DEPOSIT_PENDING, DEPOSIT_PAID, BALANCE_PENDING, PAID, REFUND_PENDING, REFUNDED, RECONCILIATION_PENDING. PAID không thay BookingStatus=COMPLETED.
- Khung giờ: AVAILABLE, HOLD, BUSY.
- Nhãn hiển thị (UC.15): Chờ duyệt, Chờ cọc, Đã cọc, Đã chốt, Tranh chấp, Hoàn thành, Đã thanh toán đủ, Đã hủy (kèm lý do).

BẢNG CHUYỂN TRẠNG THÁI (mỗi dòng = 1 RPC/timer/webhook, có ≥ 1 test CSDL; mọi RPC áp "lazy expiry" trước khi xử lý):
 T1  create_booking [Tourist]: Guide Verified+Active; mọi ô giờ trong [start,end) đang AVAILABLE; start ≥ now+26h; end>start; có địa điểm hẹn, Booking Notes, số khách>0 → PENDING / NOT_PAID. Khung GIỮ AVAILABLE (chưa khoá). Chốt G, D, fee_rate, rate. Hạn Guide = +24h. Báo Guide.
 T2  guide_respond(accept) [Guide]: PENDING, chưa quá hạn, mọi ô còn AVAILABLE → WAITING_PAYMENT / DEPOSIT_PENDING; ô AVAILABLE→HOLD (khoá nguyên tử); hạn cọc = +15 phút; báo Tourist. Ô không còn AVAILABLE → lỗi SLOT_UNAVAILABLE ("Khung giờ không còn khả dụng."), Guide chỉ còn từ chối.
 T3  guide_respond(reject) → CANCELLED(GUIDE_REJECTED); không hoàn (chưa có cọc).
 T4  timer Guide: PENDING quá 24h → CANCELLED(GUIDE_TIMEOUT); không hoàn.
 T5  deposit_success [webhook]: WAITING_PAYMENT, trong hạn cọc, đúng số D → CONFIRMED / DEPOSIT_PAID; ô HOLD→BUSY; ghi payment_transaction, hoá đơn cọc, Thoả thuận dịch vụ (BR-10); báo hai bên.
 T6  deposit_fail [webhook]: WAITING_PAYMENT → CANCELLED(DEPOSIT_FAILED); ô →AVAILABLE; báo hai bên.
 T7  timer cọc: WAITING_PAYMENT quá 15 phút → CANCELLED(DEPOSIT_TIMEOUT); ô →AVAILABLE. Tiền về muộn → QĐ-13 (tự hoàn 100%).
 T8  request_completion [Guide]: CONFIRMED và now ≥ giờ kết thúc → giữ CONFIRMED, ghi thời điểm yêu cầu; hạn Tourist = +24h; báo Tourist. Gửi sớm → "Chỉ có thể gửi yêu cầu sau khi khung giờ đồng hành kết thúc."
 T9  tourist_confirm [Tourist]: CONFIRMED có yêu cầu, chưa quá hạn → COMPLETED (Payment giữ DEPOSIT_PAID); báo Guide; mở bước trả 70%.
 T10 timer Tourist: có yêu cầu, quá 24h, chưa khiếu nại → COMPLETED (tự động); báo hai bên. Mở lại sau hạn thì thấy đã COMPLETED, không xác nhận/khiếu nại thêm.
 T11 file_complaint [Tourist|Guide]: CONFIRMED có yêu cầu hoàn thành (hoặc QĐ-07), chưa COMPLETED, booking chưa có khiếu nại; lý do + mô tả bắt buộc, bằng chứng đính kèm → DISPUTED; tạm dừng giải ngân; báo Admin + bên kia. Đã COMPLETED → "Booking đã hoàn thành, không thể khiếu nại."
 T12 choose_balance(Online) [Tourist]: COMPLETED & DEPOSIT_PAID → BALANCE_PENDING; tạo checkout cho B.
 T13 balance_success [webhook] → PAID (Booking giữ COMPLETED); ví Guide + (G − F); lưu phí.
 T14 balance_fail / cổng không xác nhận → RECONCILIATION_PENDING; chưa cộng ví; báo Tourist.
 T15 choose_balance(Cash) [Tourist] → RECONCILIATION_PENDING (chờ Guide); báo Guide.
 T16 confirm_cash_received [Guide] (nút "Đã nhận đủ 70%", chỉ bật khi COMPLETED + Tourist đã chọn Tiền mặt) → PAID; ví Guide + (D − F). Chưa bấm → giữ chờ đối soát, chưa cộng ví.
 T17 cancel_booking [Tourist|Guide] → CANCELLED(USER_CANCELLED); ô →AVAILABLE; tiền theo mục HUỶ.
 T18 resolve_dispute [Admin]: DISPUTED → CANCELLED(DISPUTE_RESULT); tiền theo mục TRANH CHẤP; KHÔNG thu 70%.
 T19 submit_review [Tourist]: COMPLETED & PAID, chưa có review; sao 1–5 bắt buộc, nhận xét tuỳ chọn → tính lại avg_rating lên hồ sơ công khai.
Lỗi RPC có mã tên (SLOT_UNAVAILABLE, EXPIRED, INVALID_STATE, FORBIDDEN, VALIDATION…); UI ánh xạ sang câu chuẩn ở [8].

HUỶ (UC.24/25) — điều kiện: chưa COMPLETED, không DISPUTED, chưa huỷ; chặn sau giờ BẮT ĐẦU (QĐ-06). BẮT BUỘC mở modal xem trước (ΔT, % phạt, tiền cọc bị phạt, tiền thực nhận lại) qua RPC preview_cancellation; client KHÔNG tự tính phạt; đóng modal → không đổi gì.
 • Đã cọc, Tourist huỷ: ΔT = giờ bắt đầu − giờ huỷ. ΔT > 48h → phạt 0% (hoàn 100% cọc). 24h ≤ ΔT ≤ 48h → phạt 50% (Tourist nhận 50%, Guide 50%). ΔT < 24h → phạt 100% (Guide nhận 100%). Phí sàn trên tiền phạt = phạt × Fee_Rate; ví Guide + (phạt − phí), ghi ngay khi xử lý xong. Phần hoàn đi qua cổng (REFUND_PENDING → REFUNDED). Lưu cancellation_record (bên huỷ, lý do, %, giờ còn lại, tiền phạt, tiền hoàn).
 • Guide huỷ booking CONFIRMED: modal "hoàn 100% cọc cho Tourist" + cảnh báo ghi nhận vi phạm. Hoàn 100%; Guide không nhận phạt, không cộng ví; violation_count +1.
 • Chưa cọc (PENDING hoặc WAITING_PAYMENT; cả hai bên đều huỷ được): modal "Không có hoàn hay phạt cọc."; chỉ huỷ đơn; ô đang HOLD (nếu có) về AVAILABLE.
TRANH CHẤP (UC.27) — Admin xem khiếu nại, bằng chứng, Thoả thuận dịch vụ, nhật ký, thanh toán:
 • Lỗi Guide: hoàn 100% cọc cho Tourist, không trừ phí sàn trên khoản hoàn, ghi vi phạm Guide.
 • Lỗi Tourist: Admin nhập khoản cọc tịch thu X (0..D). Phí = X × Fee_Rate; ví Guide + (X − phí); phần D − X hoàn Tourist; ghi vi phạm Tourist.
 • Luôn kết thúc CANCELLED(DISPUTE_RESULT). Hoàn/chuyển tiền lỗi → "chờ đối soát", giữ phán quyết, báo Admin xử lý lại. Chưa quyết định → vẫn DISPUTED.
VÍ & RÚT TIỀN (UC.22/23): ví hiển thị theo từng đơn (tổng tiền đơn, phí sàn, tiền phạt cọc nhận được, thực nhận). Yêu cầu rút: số tiền ≥ 200.000 VÀ ≤ khả dụng (khả dụng = số dư ví − tổng lệnh đang chờ/đã duyệt chưa chuyển) + thông tin ngân hàng → Payout Request chờ duyệt. Admin Phê duyệt → chuyển khoản thủ công → bấm "Đã chuyển" → trừ ví, hoàn tất; hoặc Từ chối + lý do (không trừ ví). Chưa "Đã chuyển" → giữ nguyên số dư.
KYC / TÀI KHOẢN (UC.02/05/06): Guide đăng ký → is_verified=False, nộp CCCD hoặc Thẻ SV. Chỉ hiện công khai và tìm thấy khi is_verified=True VÀ tài khoản Active. Admin Duyệt/Từ chối (báo Guide); khoá/kích hoạt tài khoản (có lý do); thu hồi xác minh (hồ sơ ẩn ngay). Guide chưa xác minh vẫn đăng nhập được; tài khoản bị khoá không đăng nhập được.
CHUNG: timer tự kích hoạt đúng hạn (NFR 3.4). Lưu UTC, hiển thị giờ Việt Nam. RBAC 3 phân hệ, Admin vào /admin/login riêng (tài khoản không phải Admin → báo không có quyền). Song ngữ Việt/Anh đổi linh hoạt. Mọi chuyển trạng thái CHỈ qua RPC server; client không UPDATE trực tiếp booking, payment, wallet, slot.

### [3] KHOẢNG TRỐNG — MẶC ĐỊNH (đặc tả nói khác thì theo đặc tả; để trong system_config)
 QĐ-01 Khách chưa đăng nhập vẫn xem tìm kiếm/lọc/hồ sơ (SEO); "Đặt lịch" yêu cầu đăng nhập Tourist.
 QĐ-02 Lịch theo ô 1 giờ chẵn trong 06:00–22:00. Booking = 1–8 giờ liên tiếp, Start/End tròn giờ; lưu booking_slot (bảng nối), cột khung giờ đầu tiên giữ để khớp ERD.
 QĐ-03 Giờ bắt đầu ≥ now + 26 giờ (đủ 24h Guide + 15 phút cọc + đệm).
 QĐ-04 Chấp nhận một đơn KHÔNG tự huỷ các PENDING khác cùng khung: ở hộp Guide hiện "Khung giờ đã có đơn khác — chỉ có thể từ chối"; hết 24h tự huỷ theo timer.
 QĐ-05 Chặn cùng một Tourist gửi 2 PENDING trùng khung với cùng Guide.
 QĐ-06 Sau giờ BẮT ĐẦU dịch vụ không cho huỷ (chỉ còn yêu cầu hoàn thành/khiếu nại).
 QĐ-07 Guide không gửi yêu cầu hoàn thành sau 48h kể từ giờ kết thúc → Tourist được khiếu nại (coi điều kiện tiên quyết đã thoả); Admin xử lý theo UC.27.
 QĐ-08 PaymentStatus: DEPOSIT_PENDING = phiên cọc đang mở; BALANCE_PENDING = đang trả B Online ở cổng; RECONCILIATION_PENDING = thiếu xác nhận từ cổng/Guide; huỷ chưa cọc giữ NOT_PAID; huỷ phạt 100% giữ DEPOSIT_PAID.
 QĐ-09 Đặc tả không có hạn trả 70%: nhắc bằng thông báo sau 24h và 72h; Admin có hàng đợi "chờ đối soát / chưa trả 70%"; provider.queryTransaction để tra lại giao dịch; Admin xác nhận thủ công kèm ghi chú; không tự huỷ/phạt.
 QĐ-10 Thông tin liên hệ hai bên chỉ hiện từ CONFIRMED (trong Thoả thuận dịch vụ).
 QĐ-11 Đăng ký thu email (định danh Auth, xác minh email) + SĐT (duy nhất, chuẩn hoá +84, KHÔNG OTP vì cần nhà cung cấp SMS trả phí). Đăng nhập bằng email hoặc SĐT qua Edge Function login: lỗi chung "Thông tin đăng nhập không đúng.", chống dò tài khoản, giới hạn tần suất.
 QĐ-12 Gắn cờ vi phạm Guide khi ≥ 3 lần huỷ CONFIRMED trong 90 ngày để Admin xem; không tự khoá.
 QĐ-13 Cọc thành công đến SAU 15 phút: booking giữ CANCELLED, tự tạo hoàn 100% và báo Tourist.
 QĐ-14 Fee_Rate mặc định 12%; fee_config có ngày hiệu lực, tạo booking lấy cấu hình hiệu lực mới nhất.
 QĐ-15 Ảnh KYC: bucket riêng tư, chỉ chủ hồ sơ + Admin đọc, signed URL ngắn hạn, mã hoá lưu trữ (mặc định Supabase), ghi nhật ký truy cập; khách chỉ thấy cờ xác minh.
 QĐ-16 Seed danh mục: khu vực (Hải Châu, Sơn Trà, Ngũ Hành Sơn, Liên Chiểu, Thanh Khê, Cẩm Lệ, Hòa Vang); chuyên môn (ẩm thực, lịch sử–văn hoá, check-in/chụp ảnh, biển–thiên nhiên, về đêm, mua sắm, gia đình); ngôn ngữ (vi, en, ja, ko, zh, fr).
 QĐ-17 PWA: manifest + icon để cài lên màn hình chính iOS/Android; không cần service worker.
