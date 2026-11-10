# TỔNG HỢP THAM KHẢO UI/UX (THAM_KHAO_UI.md)

Tài liệu đối chiếu cấu trúc trải nghiệm người dùng từ 3 nền tảng hàng đầu (**Withlocals, ToursByLocals, ShowAround**), phục vụ chuẩn hóa giao diện thương mại LocalBuddy Đà Nẵng. Không sao chép logo/mã/chữ/ảnh; 100% tiếng Việt tự biên soạn.

---

## 1. Bảng đối chiếu trải nghiệm UI/UX giữa các nền tảng

| Thành phần mẫu | 3 trang tham chiếu giải quyết như thế nào | LocalBuddy áp dụng ở đâu & như thế nào |
| :--- | :--- | :--- |
| **Ô tìm kiếm trung tâm** | • Withlocals: Ô tìm kiếm nổi bật giữa Hero, chọn điểm đến + ngày.<br>• ToursByLocals: Bộ lọc ngày và ngôn ngữ trực quan.<br>• ShowAround: Chọn thành phố làm gốc, tìm theo số giờ. | **Trang chủ (`/`)**: Điểm đến cố định Đà Nẵng, bộ lọc ngày, giờ bắt đầu, số giờ dự kiến (1–8h) và ngôn ngữ. |
| **Thẻ Hướng dẫn viên (Guide Card)** | • Withlocals: Ảnh chân dung tròn, huy hiệu Verified, đơn giá theo giờ rõ ràng.<br>• ToursByLocals: Đánh giá sao, số review thật, huy hiệu ngôn ngữ.<br>• ShowAround: Giá/giờ, tóm tắt chuyên môn và khu vực. | **Trang danh sách (`/guides`)**: Ảnh chân dung, họ tên, huy hiệu KYC, khu vực Đà Nẵng, ngôn ngữ, đơn giá VNĐ/giờ, rating sao từ DB. |
| **Bộ lọc & Sắp xếp** | • Withlocals: Lọc theo ngôn ngữ, sở thích, khoảng giá.<br>• ToursByLocals: Lọc theo ngày rảnh và đánh giá tối thiểu.<br>• ShowAround: Lọc bán kính khu vực và hoạt động. | **Trang tìm kiếm (`/guides`)**: Lọc theo Ngôn ngữ, Quận/Huyện Đà Nẵng, Chuyên môn, Khoảng giá (80k–500k), Khung giờ rảnh, Điểm sao. Trạng thái rỗng có nút nới lọc. |
| **Hồ sơ chi tiết (Guide Profile)** | • Withlocals: Layout 2 cột, cột trái thông tin/đánh giá, cột phải panel đặt lịch sticky.<br>• ToursByLocals: Lưới lịch rảnh từng ngày, chính sách hủy minh bạch.<br>• ShowAround: Mobile thanh CTA dính đáy màn hình. | **Trang hồ sơ (`/guides/:slug`)**: 2 cột Desktop (trái: ảnh, bio, chuyên môn, lịch rảnh; phải: sticky booking widget tính $G, D (30\%), B (70\%)$). Mobile: sticky CTA dính đáy. |
| **Form gửi yêu cầu đặt lịch** | • Withlocals: Chọn ngày $\rightarrow$ chọn giờ rảnh $\rightarrow$ số khách $\rightarrow$ ghi chú $\rightarrow$ tạm tính tiền.<br>• ToursByLocals: Nhấn mạnh "Chưa thu tiền cho đến khi HDV đồng ý". | **Trang đặt lịch (`/dat-lich/:guideId`)**: Lưới giờ rảnh, địa điểm hẹn Đà Nẵng, số khách, ghi chú, thông điệp rõ ràng "Chưa tính phí cho đến khi Guide chấp nhận". |
| **Chi tiết đơn & Timeline** | • Withlocals: Timeline dọc từng bước, nút hành động duy nhất theo trạng thái.<br>• ToursByLocals: Đồng hồ đếm ngược hạn phản hồi thời gian thực. | **Chi tiết booking (`/don/:id`)**: Timeline sự kiện dọc, đồng hồ đếm ngược server_now (24h Guide, 15p cọc, 24h xác nhận), 1 CTA chính duy nhất. |
| **Modal hủy & Phạt cọc** | • Withlocals: Bảng phân bậc theo giờ trước khởi hành.<br>• ToursByLocals: Minh bạch số tiền phạt và số tiền thực hoàn. | **Modal hủy (`CancelPreviewModal`)**: Bắt buộc mở xem trước $\Delta T$, % phạt ($>48\text{h}: 0\%$, $24\text{–}48\text{h}: 50\%$, $<24\text{h}: 100\%$), số tiền hoàn/phạt trước khi bấm hủy. |
| **Khối tin cậy & Đánh giá thật** | • Withlocals: Đánh giá có ngày đi, chỉ hiển thị số thật từ hệ thống.<br>• ToursByLocals: Cam kết chất lượng và quy trình kiểm duyệt HDV. | **Trang chủ & Hồ sơ**: Khối tin cậy (KYC đã thẩm định, giá minh bạch, cọc 30%, hủy theo $\Delta T$). Đánh giá 100% trích xuất từ bảng `review` trong DB. |

---

## 2. Nguyên tắc thiết kế & Tối ưu giao diện cho LocalBuddy
1. **Thiết kế vì sự an tâm (Trust & Transparency)**:
   - Hiển thị rõ ràng quy tắc "Cọc 30% sau khi Guide chấp nhận, 70% thanh toán sau khi hoàn tất chuyến đi".
   - Ẩn hoàn toàn chi phí nền tảng (`fee_rate`) đối với Du khách, chỉ hiển thị tổng tiền $G$ và phân bổ $D, B$.
2. **Ngăn chặn lỗi thao tác (Error Prevention)**:
   - Khoá nút gửi/hủy khi đang xử lý (loading state).
   - Kiểm tra trùng khung giờ tự động; chặn gửi 2 đơn PENDING trùng giờ cùng một Guide (QĐ-05).
   - Modal xem trước mức hoàn/phạt cọc trước khi xác nhận hủy để Du khách luôn nắm rõ quyền lợi (UC.25).
3. **Responsive Mobile-first**:
   - Vùng chạm tối thiểu $44 \times 44\text{px}$.
   - Tối ưu hiển thị hoàn hảo ở viewport di động (360px–430px), tablet (768px) và desktop (1280px–1440px).
