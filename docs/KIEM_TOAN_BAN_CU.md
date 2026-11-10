# KIỂM TOÁN BẢN CŨ & KẾ HOẠCH SỬA ĐỔI

1. **Thu cọc trước khi Guide chấp nhận**: Client gọi thanh toán cọc lúc tạo đơn -> Sửa: UC.12 tạo đơn PENDING giữ AVAILABLE; chỉ sau khi Guide chấp nhận (T2) mới chuyển WAITING_PAYMENT và mở 15p cọc.
2. **Khóa khung giờ ngay khi gửi yêu cầu**: Ô đổi sang HOLD/BUSY lúc tạo PENDING -> Sửa: Khung giờ giữ AVAILABLE ở PENDING, chỉ chuyển HOLD khi Guide bấm Chấp nhận.
3. **Tự hoàn tiền khi Guide từ chối/quá hạn**: Client gọi logic refund ở PENDING -> Sửa: Đơn PENDING chưa cọc nên CANCELLED(GUIDE_REJECTED / GUIDE_TIMEOUT) không phát sinh hoàn tiền.
4. **Cọc thất bại cho thử lại**: Client cho bấm thanh toán lại cùng đơn -> Sửa: Cọc thất bại chuyển CANCELLED(DEPOSIT_FAILED), nhả ô giờ về AVAILABLE, không cho thử lại trên đơn cũ.
5. **Thu 70% cùng lúc cọc hoặc trước COMPLETED**: Form gom thanh toán toàn bộ -> Sửa: Chỉ mở bước chọn trả 70% Online/Tiền mặt sau khi đơn chuyển sang COMPLETED.
6. **Đánh giá hai chiều & Chat ngoài 29 UC**: Có màn chat và đánh giá Guide->Tourist -> Sửa: Loại bỏ toàn bộ code chat và review ngược; chỉ giữ review 1 chiều Tourist->Guide sau COMPLETED+PAID.
7. **Dữ liệu mock trong client & đổi trạng thái tùy tiện**: Lưu state giả trong localStorage, không RPC -> Sửa: Chuyển 100% logic sang RPC Postgres với RLS, khóa nguyên tử và lazy expiry.
8. **Thiếu timer, ví, thỏa thuận dịch vụ & hóa đơn cọc**: Thiếu process_timeouts, thiếu trang in BR-10 -> Sửa: Bổ sung pg_cron/lazy expiry, bảng wallet/wallet_transaction, trang in thỏa thuận/hóa đơn.
9. **Bảng màu sai nhận diện**: Sử dụng màu cũ, hex rải rác -> Sửa: Đổi sang 4 màu chuẩn (#EB5B38, #272A2D, #E6E4DC, #347CCB) qua CSS tokens, dọn sạch hex rải rác.
10. **Lộ Fee_Rate phía Tourist**: Tỷ lệ phí sàn xuất hiện ở UI của khách -> Sửa: Ẩn hoàn toàn cột/trường fee_rate khỏi mọi view, RPC, hóa đơn và giao diện Tourist.
