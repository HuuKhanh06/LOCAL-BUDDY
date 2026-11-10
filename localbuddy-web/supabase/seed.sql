-- =============================================================================
-- SEED DATA: DỮ LIỆU SẢN XUẤT CHUẨN HÓA LOCALBUDDY ĐÀ NẴNG (supabase/seed.sql)
-- Đúng 2 tài khoản cốt lõi: 1 Hướng dẫn viên (Dương Đăng Huân) & 1 Quản trị viên (Lê Văn Hoàng)
-- Mọi Du khách tự đăng ký tài khoản mới trên giao diện (UC.01).
-- Toàn bộ đơn hàng, khiếu nại, tin nhắn, đánh giá khởi tạo bằng con số 0.
-- =============================================================================

BEGIN;

-- Xóa sạch dữ liệu cũ theo thứ tự phụ thuộc khóa ngoại
TRUNCATE TABLE
    public.message,
    public.notification,
    public.complaint,
    public.review,
    public.payout_request,
    public.wallet_transaction,
    public.wallet,
    public.payment_transaction,
    public.booking_log,
    public.cancellation_record,
    public.service_agreement,
    public.booking,
    public.availability_slot,
    public.cancellation_policy,
    public.fee_config,
    public.kyc_file,
    public.kyc_submission,
    public.guide_khu_vuc,
    public.guide_ngon_ngu,
    public.guide_chuyen_mon,
    public.khu_vuc,
    public.ngon_ngu,
    public.chuyen_mon,
    public.admin,
    public.local_guide,
    public.tourist,
    public.tai_khoan
RESTART IDENTITY CASCADE;

-- =============================================================================
-- 1. TÀI KHOẢN NGƯỜI DÙNG (1 HƯỚNG DẪN VIÊN & 1 QUẢN TRỊ VIÊN)
-- =============================================================================

INSERT INTO public.tai_khoan (
    ma_tai_khoan, ho_ten, email, so_dien_thoai, mat_khau_hash, trang_thai, loai_tai_khoan, so_lan_vi_pham, anh_dai_dien
) VALUES
    -- Hướng dẫn viên bản địa (LocalGuide)
    (1, 'Dương Đăng Huân', 'duongdanghuan.guide@gmail.com', '0905111222', '$2a$10$demoHashGuideHuan', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'),

    -- Quản trị viên (Admin)
    (2, 'Lê Văn Hoàng', 'le3245279@gmail.com', '0905000111', '$2a$10$demoHashAdminHoang', 'Active', 'Admin', 0, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80');

SELECT setval('public.tai_khoan_ma_tai_khoan_seq', 2, true);

-- Hồ sơ Hướng dẫn viên (LocalGuide)
INSERT INTO public.local_guide (
    ma_tai_khoan, khau_hieu, gioi_thieu, anh_chan_dung, anh_bia, gia_theo_gio, so_nam_kinh_nghiem,
    trang_thai_xac_minh, avg_rating, tong_so_danh_gia, tong_chuyen_hoan_thanh,
    ty_le_phan_hoi, thoi_gian_phan_hoi, ngan_hang, so_tai_khoan_ngan_hang, chu_tai_khoan_ngan_hang
) VALUES
    (1, 'Thổ địa Đà Nẵng — Nhiếp ảnh Cầu Rồng, ẩm thực Chợ Cồn & Bán đảo Sơn Trà',
     'Sinh ra và lớn lên tại Đà Nẵng, mình có hơn 5 năm đồng hành cùng du khách khám phá từng góc nhỏ bán đảo Sơn Trà, đỉnh Bàn Cờ, chùa Linh Ứng và các quán hải sản bản địa tươi ngon nhất.',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&auto=format&fit=crop&q=80',
     250000, 5, 'Verified', 5.00, 0, 0, 100, 'Thường phản hồi trong 10 phút',
     'Vietcombank – CN Đà Nẵng', '0041000889988', 'DUONG DANG HUAN');

-- Hồ sơ Quản trị viên
INSERT INTO public.admin (ma_tai_khoan, quyen_han) VALUES
    (2, 'SUPER_ADMIN');

-- =============================================================================
-- 2. DANH MỤC CHUYÊN MÔN, NGÔN NGỮ, KHU VỰC ĐÀ NẴNG & BẢNG LIÊN KẾT N-N
-- =============================================================================

INSERT INTO public.chuyen_mon (ma_chuyen_mon, ten_chuyen_mon, mo_ta) VALUES
    (1, 'Ẩm thực bản địa & Chợ truyền thống', 'Food tour Chợ Cồn, Chợ Hàn, hải sản đêm và quán ăn gia truyền'),
    (2, 'Lịch sử, Văn hóa & Tâm linh', 'Thuyết minh chuyên sâu Chùa Linh Ứng, Ngũ Hành Sơn, Bảo tàng Chăm, Hội An'),
    (3, 'Nhiếp ảnh & Check-in nghệ thuật', 'Chụp ảnh chân dung, góc máy ẩn tại Cầu Vàng, Sơn Trà, biển Mỹ Khê'),
    (4, 'Thiên nhiên, Trekking & Thể thao biển', 'Đỉnh Bàn Cờ, cây đa ngàn năm, chèo SUP Mân Thái, lặn ngắm san hô'),
    (5, 'Khám phá Đà Nẵng về đêm', 'Du thuyền sông Hàn, Cầu Rồng phun lửa, phố đêm An Thượng');

SELECT setval('public.chuyen_mon_ma_chuyen_mon_seq', 5, true);

INSERT INTO public.ngon_ngu (ma_ngon_ngu, ten_ngon_ngu, ma_ngon_ngu_iso) VALUES
    (1, 'Tiếng Việt', 'vi'),
    (2, 'Tiếng Anh', 'en'),
    (3, 'Tiếng Hàn', 'ko'),
    (4, 'Tiếng Nhật', 'ja'),
    (5, 'Tiếng Trung', 'zh'),
    (6, 'Tiếng Pháp', 'fr');

SELECT setval('public.ngon_ngu_ma_ngon_ngu_seq', 6, true);

INSERT INTO public.khu_vuc (ma_khu_vuc, ten_khu_vuc, mo_ta, anh_khu_vuc) VALUES
    (1, 'Cầu Rồng & Sông Hàn', 'Trung tâm quận Hải Châu, Cầu Tình Yêu, Cá Chép Hóa Rồng, Chợ Hàn', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80'),
    (2, 'Bán đảo Sơn Trà', 'Chùa Linh Ứng Bãi Bụt, Đỉnh Bàn Cờ, Mũi Nghê, Bãi Đá Obama', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=80'),
    (3, 'Ngũ Hành Sơn', 'Làng đá mỹ nghệ Non Nước, Động Huyền Không, Động Âm Phủ', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80'),
    (4, 'Bà Nà Hills', 'Cầu Vàng, Làng Pháp, Khu du lịch Sun World Bà Nà Hills', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&auto=format&fit=crop&q=80'),
    (5, 'Phố cổ Hội An', 'Chùa Cầu, sông Hoài, rừng dừa Bảy Mẫu, làng gốm Thanh Hà', 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800&auto=format&fit=crop&q=80'),
    (6, 'Biển Mỹ Khê & An Thượng', 'Bãi biển Mỹ Khê, bãi tắm Phạm Văn Đồng, làng chài Mân Thái', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'),
    (7, 'Chợ Cồn & Chợ Hàn', 'Thiên đường ẩm thực đường phố và đặc sản miền Trung', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80');

SELECT setval('public.khu_vuc_ma_khu_vuc_seq', 7, true);

-- Liên kết N-N cho HDV Dương Đăng Huân (ma_tai_khoan = 1)
INSERT INTO public.guide_chuyen_mon (ma_guide, ma_chuyen_mon) VALUES
    (1, 1), (1, 2), (1, 3);

INSERT INTO public.guide_ngon_ngu (ma_guide, ma_ngon_ngu) VALUES
    (1, 1), (1, 2);

INSERT INTO public.guide_khu_vuc (ma_guide, ma_khu_vuc) VALUES
    (1, 1), (1, 2), (1, 6), (1, 7);

-- =============================================================================
-- 3. HỒ SƠ KYC, CẤU HÌNH PHÍ SÀN & CHÍNH SÁCH HỦY (BR-01, BR-06, BR-13)
-- =============================================================================

INSERT INTO public.kyc_submission (
    ma_kyc, ma_guide, ma_admin, so_cccd, loai_giay_to, tep_giay_to,
    ngan_hang, so_tai_khoan_ngan_hang, chu_tai_khoan_ngan_hang, trang_thai, ngay_gui, ngay_tham_dinh, ghi_chu_tham_dinh
) VALUES
    (1, 1, 2, '048095006789', 'CCCD gắn chip & Thẻ HDV Quốc tế', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 'Vietcombank – CN Đà Nẵng', '0041000889988', 'DUONG DANG HUAN', 'Approved', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'Hồ sơ đã xác minh hợp lệ thẻ HDV Sở Du lịch Đà Nẵng.');

SELECT setval('public.kyc_submission_ma_kyc_seq', 1, true);

INSERT INTO public.fee_config (ma_cau_hinh, ma_admin, fee_rate, ghi_chu, ngay_hieu_luc) VALUES
    (1, 2, 0.1000, 'Mức phí khởi điểm giai đoạn ra mắt tại Đà Nẵng (10%)', NOW() - INTERVAL '60 days'),
    (2, 2, 0.1200, 'Mức phí dịch vụ tiêu chuẩn hiện hành (12% - khung 10%-15% BR-13)', NOW() - INTERVAL '15 days');

SELECT setval('public.fee_config_ma_cau_hinh_seq', 2, true);

INSERT INTO public.cancellation_policy (
    ma_chinh_sach, ten_muc_huy, delta_t_toi_thieu_gio, delta_t_toi_da_gio, ty_le_phat_coc, ty_le_hoan_coc, mo_ta
) VALUES
    (1, 'Hủy sớm (Trước > 48 giờ)', 48.01, NULL, 0.0000, 1.0000, 'Miễn phí hủy: Hoàn lại 100% tiền đặt cọc 30% cho Du khách.'),
    (2, 'Hủy cận ngày (Từ 24 giờ đến 48 giờ)', 24.00, 48.00, 0.5000, 0.5000, 'Phạt 50% tiền cọc, hoàn lại 50% tiền cọc cho Du khách.'),
    (3, 'Hủy gấp (Dưới 24 giờ)', 0.00, 23.99, 1.0000, 0.0000, 'Phạt 100% tiền cọc (Không hoàn cọc). Bồi thường cho HDV sau khi khấu trừ phí sàn.');

SELECT setval('public.cancellation_policy_ma_chinh_sach_seq', 3, true);

-- =============================================================================
-- 4. VÍ HƯỚNG DẪN VIÊN & CÁC CA RẢNH MẪU (SẴN SÀNG NHẬN ĐƠN MỚI THỰC TẾ)
-- =============================================================================

-- Ví ban đầu sạch sẽ (Số dư = 0 ₫)
INSERT INTO public.wallet (ma_vi, ma_guide, so_du, so_du_kha_dung, so_du_cho_rut, tong_da_rut) VALUES
    (1, 1, 0, 0, 0, 0);

SELECT setval('public.wallet_ma_vi_seq', 1, true);

-- Khung giờ đón khách sẵn sàng của HDV Dương Đăng Huân
INSERT INTO public.availability_slot (
    ma_khung_gio, ma_guide, bat_dau, ket_thuc, trang_thai, hold_expires_at, held_by_booking_id
) VALUES
    (1, 1, NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'Available', NULL, NULL),
    (2, 1, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '18 hours', 'Available', NULL, NULL),
    (3, 1, NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '12 hours', 'Available', NULL, NULL),
    (4, 1, NOW() + INTERVAL '2 days' + INTERVAL '14 hours', NOW() + INTERVAL '2 days' + INTERVAL '18 hours', 'Available', NULL, NULL),
    (5, 1, NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', 'Available', NULL, NULL);

SELECT setval('public.availability_slot_ma_khung_gio_seq', 5, true);

COMMIT;
