-- =============================================================================
-- SEED DATA: DỮ LIỆU MẪU THỰC TẾ TẠI ĐÀ NẴNG CHO LOCALBUDDY (supabase/seed.sql)
-- Tách biệt hoàn toàn khỏi code giao diện, có thể chạy nhiều lần (Idempotent)
-- =============================================================================

BEGIN;

-- Xóa dữ liệu cũ theo thứ tự phụ thuộc khóa ngoại để nạp mới sạch sẽ
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
-- 1. TÀI KHOẢN NGƯỜI DÙNG (3 DU KHÁCH, 6 HƯỚNG DẪN VIÊN ĐÀ NẴNG, 1 ADMIN)
-- =============================================================================

INSERT INTO public.tai_khoan (
    ma_tai_khoan, ho_ten, email, so_dien_thoai, mat_khau_hash, trang_thai, loai_tai_khoan, so_lan_vi_pham, anh_dai_dien
) VALUES
    -- Du khách (Tourist)
    (1, 'Dương Đăng Huân', 'huan.duong@gmail.com', '0905111222', '$2a$10$demoHashTourist1', 'Active', 'Tourist', 0, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80'),
    (2, 'Trần Minh Anh', 'minhanh.tran@gmail.com', '0905222333', '$2a$10$demoHashTourist2', 'Active', 'Tourist', 0, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80'),
    (3, 'Nguyễn Thảo Vy', 'thaovy.nguyen@gmail.com', '0905333444', '$2a$10$demoHashTourist3', 'Active', 'Tourist', 1, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&auto=format&fit=crop&q=80'),

    -- Hướng dẫn viên Đà Nẵng (LocalGuide)
    (4, 'Nguyễn Hữu Khanh', 'khanh.guide@localbuddy.vn', '0905444555', '$2a$10$demoHashGuide1', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'),
    (5, 'Trần Thị Mỹ Linh', 'mylinh.guide@localbuddy.vn', '0905555666', '$2a$10$demoHashGuide2', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'),
    (6, 'Lê Hoàng Nam', 'hoangnam.guide@localbuddy.vn', '0905666777', '$2a$10$demoHashGuide3', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'),
    (7, 'Phạm Minh Tuấn', 'minhtuan.guide@localbuddy.vn', '0905777888', '$2a$10$demoHashGuide4', 'Active', 'LocalGuide', 1, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80'),
    (8, 'Võ Thị Cẩm Tú', 'camtu.guide@localbuddy.vn', '0905888999', '$2a$10$demoHashGuide5', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
    (9, 'Đặng Quốc Bảo', 'quocbao.guide@localbuddy.vn', '0905999000', '$2a$10$demoHashGuide6', 'Active', 'LocalGuide', 0, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'),

    -- Quản trị viên (Admin)
    (10, 'Lê Văn Hoàng', 'hoang.admin@localbuddy.vn', '0905000999', '$2a$10$demoHashAdmin1', 'Active', 'Admin', 0, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80');

SELECT setval('public.tai_khoan_ma_tai_khoan_seq', 10, true);

INSERT INTO public.tourist (ma_tai_khoan, ngon_ngu_giao_dien, quoc_tich) VALUES
    (1, 'vi', 'Việt Nam'),
    (2, 'vi', 'Việt Nam'),
    (3, 'en', 'Việt Nam');

INSERT INTO public.local_guide (
    ma_tai_khoan, khau_hieu, gioi_thieu, anh_chan_dung, anh_bia, gia_theo_gio, so_nam_kinh_nghiem,
    trang_thai_xac_minh, avg_rating, tong_so_danh_gia, tong_chuyen_hoan_thanh,
    ty_le_phan_hoi, thoi_gian_phan_hoi, ngan_hang, so_tai_khoan_ngan_hang, chu_tai_khoan_ngan_hang
) VALUES
    (4, 'Thổ địa Sơn Trà & Cầu Rồng — Nhiếp ảnh gia đường phố Đà Nẵng',
     'Sinh ra và lớn lên bên bờ sông Hàn, mình có 6 năm đồng hành cùng du khách khám phá từng góc nhỏ bán đảo Sơn Trà, đỉnh Bàn Cờ, chùa Linh Ứng và các quán hải sản bản địa tươi ngon nhất.',
     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&auto=format&fit=crop&q=80',
     250000, 6, 'Verified', 4.90, 28, 142, 99, 'Thường phản hồi trong 10 phút',
     'Vietcombank – CN Đà Nẵng', '0041000389214', 'NGUYEN HUU KHANH'),

    (5, 'Chuyên gia Food Tour Chợ Cồn, Chợ Hàn & Ẩm thực đêm Đà Thành',
     'Cùng Mỹ Linh thưởng thức hơn 15 món đặc sản chuẩn vị người Đà Nẵng: mì Quảng ếch, bánh tráng cuốn thịt heo, ốc hút, chè xoa xoa hạt lựu tại những con hẻm chỉ người bản địa mới biết.',
     'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
     200000, 4, 'Verified', 4.85, 19, 96, 98, 'Thường phản hồi trong 15 phút',
     'Techcombank – CN Đà Nẵng', '1903456789101', 'TRAN THI MY LINH'),

    (6, 'Hướng dẫn viên Lịch sử Văn hóa Ngũ Hành Sơn, Bà Nà Hills & Hội An',
     'Tốt nghiệp chuyên ngành Văn hóa Du lịch Đại học Đà Nẵng, thông thạo Tiếng Anh và Tiếng Hàn. Chuyên thiết kế lịch trình theo giờ linh hoạt cho gia đình và nhóm bạn.',
     'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&auto=format&fit=crop&q=80',
     300000, 7, 'Verified', 4.95, 34, 185, 100, 'Thường phản hồi trong 10 phút',
     'MB Bank – CN Hải Châu', '0905666777888', 'LE HOANG NAM'),

    (7, 'Khám phá Biển Mỹ Khê, Lặn ngắm san hô Sơn Trà & Chèo SUP bình minh',
     'Đam mê thể thao biển và nhiếp ảnh flycam. Mình sẽ dẫn bạn đón bình minh đẹp nhất tại bãi biển Mỹ Khê - Mân Thái và thưởng thức bún chả cá sáng sớm.',
     'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
     180000, 3, 'Verified', 4.75, 14, 64, 95, 'Thường phản hồi trong 20 phút',
     'ACB – CN Đà Nẵng', '889911223344', 'PHAM MINH TUAN'),

    (8, 'Kể chuyện Di sản Phố cổ Hội An, Làng gốm Thanh Hà & Bảo tàng Chăm',
     'Người bạn đồng hành dịu dàng, am hiểu kiến trúc cổ và nghệ thuật thủ công truyền thống xứ Quảng. Hỗ trợ chụp ảnh áo dài cực đẹp tại Hội An và Đà Nẵng.',
     'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=80',
     220000, 5, 'Verified', 5.00, 22, 118, 99, 'Thường phản hồi trong 12 phút',
     'BIDV – CN Sông Hàn', '56110000998877', 'VO THI CAM TU'),

    (9, 'Hướng dẫn viên trẻ năng động — Khám phá Đà Nẵng về đêm',
     'Hồ sơ mới đăng ký, đang trong quá trình chờ Admin thẩm định giấy tờ KYC (BR-01).',
     'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
     'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200&auto=format&fit=crop&q=80',
     150000, 1, 'Pending', 0.00, 0, 0, 100, 'Thường phản hồi trong 15 phút',
     'VPBank – CN Đà Nẵng', '090599900011', 'DANG QUOC BAO');

INSERT INTO public.admin (ma_tai_khoan, quyen_han) VALUES
    (10, 'SUPER_ADMIN');

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

-- Liên kết N-N cho 6 HDV
INSERT INTO public.guide_chuyen_mon (ma_guide, ma_chuyen_mon) VALUES
    (4, 2), (4, 3), (4, 4),
    (5, 1), (5, 5),
    (6, 2), (6, 3),
    (7, 3), (7, 4),
    (8, 1), (8, 2), (8, 3),
    (9, 1), (9, 5);

INSERT INTO public.guide_ngon_ngu (ma_guide, ma_ngon_ngu) VALUES
    (4, 1), (4, 2),
    (5, 1), (5, 2), (5, 5),
    (6, 1), (6, 2), (6, 3),
    (7, 1), (7, 2),
    (8, 1), (8, 2), (8, 4),
    (9, 1), (9, 2);

INSERT INTO public.guide_khu_vuc (ma_guide, ma_khu_vuc) VALUES
    (4, 1), (4, 2), (4, 5),
    (5, 1), (5, 6), (5, 7),
    (6, 2), (6, 3), (6, 4), (6, 5),
    (7, 2), (7, 6),
    (8, 1), (8, 3), (8, 5),
    (9, 1), (9, 7);

-- =============================================================================
-- 3. HỒ SƠ KYC, CẤU HÌNH PHÍ SÀN & BẢNG CHÍNH SÁCH HỦY (BR-01, BR-06, BR-13)
-- =============================================================================

INSERT INTO public.kyc_submission (
    ma_kyc, ma_guide, ma_admin, so_cccd, loai_giay_to, tep_giay_to,
    ngan_hang, so_tai_khoan_ngan_hang, chu_tai_khoan_ngan_hang, trang_thai, ngay_gui, ngay_tham_dinh, ghi_chu_tham_dinh
) VALUES
    (1, 4, 10, '048096001284', 'CCCD gắn chip & Thẻ HDV Nội địa', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 'Vietcombank – CN Đà Nẵng', '0041000389214', 'NGUYEN HUU KHANH', 'Approved', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', 'Giấy tờ hợp lệ, ảnh rõ nét.'),
    (2, 5, 10, '048198004512', 'CCCD gắn chip & Chứng chỉ IELTS 7.0', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 'Techcombank – CN Đà Nẵng', '1903456789101', 'TRAN THI MY LINH', 'Approved', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 'Đã xác thực thông tin cư trú tại Hải Châu, Đà Nẵng.'),
    (3, 6, 10, '048094008821', 'CCCD gắn chip & Thẻ HDV Quốc tế', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 'MB Bank – CN Hải Châu', '0905666777888', 'LE HOANG NAM', 'Approved', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 'Đủ điều kiện dẫn khách quốc tế.'),
    (4, 9, NULL, '048201009934', 'CCCD gắn chip & Thẻ Sinh viên Du lịch', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', 'VPBank – CN Đà Nẵng', '090599900011', 'DANG QUOC BAO', 'Pending', NOW() - INTERVAL '2 hours', NULL, NULL);

SELECT setval('public.kyc_submission_ma_kyc_seq', 4, true);

INSERT INTO public.fee_config (ma_cau_hinh, ma_admin, fee_rate, ghi_chu, ngay_hieu_luc) VALUES
    (1, 10, 0.1000, 'Mức phí khởi điểm giai đoạn ra mắt tại Đà Nẵng (10%)', NOW() - INTERVAL '60 days'),
    (2, 10, 0.1200, 'Mức phí dịch vụ tiêu chuẩn hiện hành (12% - nằm trong khung 10%-15% BR-13)', NOW() - INTERVAL '15 days');

SELECT setval('public.fee_config_ma_cau_hinh_seq', 2, true);

INSERT INTO public.cancellation_policy (
    ma_chinh_sach, ten_muc_huy, delta_t_toi_thieu_gio, delta_t_toi_da_gio, ty_le_phat_coc, ty_le_hoan_coc, mo_ta
) VALUES
    (1, 'Hủy sớm (Trước > 48 giờ)', 48.01, NULL, 0.0000, 1.0000, 'Miễn phí hủy: Hoàn lại 100% tiền đặt cọc 30% cho Du khách.'),
    (2, 'Hủy cận ngày (Từ 24 giờ đến 48 giờ)', 24.00, 48.00, 0.5000, 0.5000, 'Phạt 50% tiền cọc, hoàn lại 50% tiền cọc cho Du khách.'),
    (3, 'Hủy gấp (Dưới 24 giờ)', 0.00, 23.99, 1.0000, 0.0000, 'Phạt 100% tiền cọc (Không hoàn cọc). Bồi thường cho HDV sau khi khấu trừ phí sàn.');

SELECT setval('public.cancellation_policy_ma_chinh_sach_seq', 3, true);

-- =============================================================================
-- 4. LỊCH RẢNH KHUNG GIỜ (AVAILABILITY_SLOT) & ĐƠN ĐẶT LỊCH MẪU (BOOKING)
-- =============================================================================

INSERT INTO public.availability_slot (
    ma_khung_gio, ma_guide, bat_dau, ket_thuc, trang_thai, hold_expires_at, held_by_booking_id
) VALUES
    -- Các khung giờ trống (Available) của HDV Nguyễn Hữu Khanh (guide 4)
    (1, 4, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours', 'Available', NULL, NULL),
    (2, 4, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours', 'Hold', NOW() + INTERVAL '14 minutes', 2),
    (3, 4, NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 4 hours', 'Busy', NULL, 3),
    (4, 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '4 hours', 'Busy', NULL, 4),
    -- Khung giờ của HDV Trần Thị Mỹ Linh (guide 5)
    (5, 5, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '3 hours', 'Busy', NULL, 5),
    (6, 5, NOW() + INTERVAL '30 hours', NOW() + INTERVAL '33 hours', 'Available', NULL, NULL),
    -- Khung giờ của HDV Lê Hoàng Nam (guide 6)
    (7, 6, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 5 hours', 'Available', NULL, NULL),
    -- Khung giờ của HDV Võ Thị Cẩm Tú (guide 8)
    (8, 8, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours', 'Available', NULL, NULL);

SELECT setval('public.availability_slot_ma_khung_gio_seq', 8, true);

-- 5 Đơn đặt lịch đại diện các trạng thái chuẩn
INSERT INTO public.booking (
    ma_booking, ma_hien_thi, ma_tourist, ma_guide, ma_khung_gio,
    thoi_gian_bat_dau, thoi_gian_ket_thuc, dia_diem_hen, so_luong_khach, ghi_chu_yeu_cau,
    gia_theo_gio_chot, fee_rate_chot, tong_tien, tien_coc_30, tien_con_lai_70, phuong_thuc_70,
    ngay_tao, pending_expires_at, thoi_diem_chap_nhan, hold_expires_at, thoi_diem_xac_nhan_coc,
    thoi_diem_gui_yeu_cau_hoan_thanh, completion_auto_confirm_at, thoi_diem_hoan_thanh,
    booking_status, payment_status
) VALUES
    -- BK-1001: Đang chờ HDV phản hồi (Pending + Unpaid)
    (1, 'BK-1001', 1, 4, 1,
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours',
     'Đầu Cầu Rồng (bờ Đông, quận Sơn Trà, Đà Nẵng)', 2,
     'Mong muốn chụp ảnh bình minh Sơn Trà và thưởng thức cà phê trứng.',
     250000, 0.1200, 1000000, 300000, 700000, NULL,
     NOW() - INTERVAL '1 hour', NOW() + INTERVAL '23 hours', NULL, NULL, NULL, NULL, NULL, NULL,
     'Pending', 'Unpaid'),

    -- BK-1002: HDV đã chấp nhận, đang giữ chỗ 15 phút chờ khách đặt cọc 30% (WaitingPayment + WaitingDeposit)
    (2, 'BK-1002', 1, 4, 2,
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours',
     'Chùa Linh Ứng Bãi Bụt, Bán đảo Sơn Trà', 3,
     'Tham quan Chùa Linh Ứng, Đỉnh Bàn Cờ và ăn hải sản chiều.',
     250000, 0.1200, 1000000, 300000, 700000, NULL,
     NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '23 hours', NOW() - INTERVAL '1 minute', NOW() + INTERVAL '14 minutes', NULL, NULL, NULL, NULL,
     'WaitingPayment', 'WaitingDeposit'),

    -- BK-1003: Đã đặt cọc 30%, chuẩn bị khởi hành (Confirmed + Deposited)
    (3, 'BK-1003', 1, 4, 3,
     NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 4 hours',
     'Cổng chính Chợ Hàn, 119 Trần Phú, Hải Châu, Đà Nẵng', 2,
     'Dạo phố cổ Hội An và chụp ảnh đèn lồng buổi tối.',
     250000, 0.1200, 1000000, 300000, 700000, NULL,
     NOW() - INTERVAL '1 day', NOW(), NOW() - INTERVAL '23 hours', NULL, NOW() - INTERVAL '23 hours', NULL, NULL, NULL,
     'Confirmed', 'Deposited'),

    -- BK-1004: Đã hoàn thành chuyến đi, chờ tất toán 70% (Completed + WaitingFinal)
    (4, 'BK-1004', 1, 4, 4,
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '4 hours',
     'Danh thắng Ngũ Hành Sơn (Cổng thang máy số 1 Huyền Trân Công Chúa)', 2,
     'Tham quan động Huyền Không và làng đá Non Nước.',
     250000, 0.1200, 1000000, 300000, 700000, NULL,
     NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
     'Completed', 'WaitingFinal'),

    -- BK-1005: Đã hoàn thành & thanh toán đủ 100% Online (Completed + Paid)
    (5, 'BK-1005', 1, 5, 5,
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '3 hours',
     'Cổng chính Chợ Cồn, 290 Hùng Vương, Hải Châu, Đà Nẵng', 2,
     'Food tour ẩm thực chiều Chợ Cồn: bánh bèo, ốc hút, kem bơ cô Vân.',
     200000, 0.1200, 600000, 180000, 420000, 'Online',
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days',
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days',
     'Completed', 'Paid');

SELECT setval('public.booking_ma_booking_seq', 5, true);

-- =============================================================================
-- 5. THỎA THUẬN DỊCH VỤ, GIAO DỊCH THANH TOÁN, VÍ HDV & ĐÁNH GIÁ
-- =============================================================================

INSERT INTO public.service_agreement (
    ma_booking, pham_vi_dich_vu, dia_diem, gia_theo_gio_chot, tong_gia_tri_chot,
    tien_coc_chot, tien_con_lai_chot, phuong_thuc_thanh_toan, chinh_sach_huy
) VALUES
    (3, 'Dạo phố cổ Hội An và chụp ảnh đèn lồng buổi tối.', 'Cổng chính Chợ Hàn, 119 Trần Phú, Hải Châu, Đà Nẵng', 250000, 1000000, 300000, 700000, 'Online', 'Hủy >48h: hoàn 100% cọc; 24h-48h: phạt 50% cọc; <24h: phạt 100% cọc.'),
    (4, 'Tham quan động Huyền Không và làng đá Non Nước.', 'Danh thắng Ngũ Hành Sơn', 250000, 1000000, 300000, 700000, 'Online', 'Hủy >48h: hoàn 100% cọc; 24h-48h: phạt 50% cọc; <24h: phạt 100% cọc.'),
    (5, 'Food tour ẩm thực chiều Chợ Cồn.', 'Cổng chính Chợ Cồn, 290 Hùng Vương, Đà Nẵng', 200000, 600000, 180000, 420000, 'Online', 'Hủy >48h: hoàn 100% cọc; 24h-48h: phạt 50% cọc; <24h: phạt 100% cọc.');

INSERT INTO public.payment_transaction (
    ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong
) VALUES
    (3, 'Deposit', 'Online', 'VNPAY', 300000, 'Success', 'VNP-DEP-1003'),
    (4, 'Deposit', 'Online', 'VNPAY', 300000, 'Success', 'VNP-DEP-1004'),
    (5, 'Deposit', 'Online', 'MOMO', 180000, 'Success', 'MOMO-DEP-1005'),
    (5, 'FinalPayment', 'Online', 'VNPAY', 420000, 'Success', 'VNP-FIN-1005');

-- Ví của 6 HDV
INSERT INTO public.wallet (ma_vi, ma_guide, so_du, so_du_kha_dung, so_du_cho_rut, tong_da_rut) VALUES
    (1, 4, 1850000, 1350000, 500000, 4200000),
    (2, 5, 528000, 528000, 0, 2100000),
    (3, 6, 920000, 920000, 0, 5400000),
    (4, 7, 340000, 340000, 0, 1200000),
    (5, 8, 780000, 780000, 0, 3100000),
    (6, 9, 0, 0, 0, 0);

SELECT setval('public.wallet_ma_vi_seq', 6, true);

INSERT INTO public.wallet_transaction (
    ma_vi, ma_booking, loai_but_toan, so_tien, phi_san, so_du_sau_but_toan, cong_thuc_minh_hoa, mo_ta
) VALUES
    (2, 5, 'CreditOnlineSettlement', 528000, 72000, 528000, 'G (600.000 ₫) - Phí sàn 12% (72.000 ₫)', 'Quyết toán đơn BK-1005 (Khách trả 70% cuối qua cổng Online)');

INSERT INTO public.payout_request (
    ma_rut_tien, ma_vi, ma_admin, so_tien, ngan_hang, so_tai_khoan_nhan, chu_tai_khoan_nhan, trang_thai, ngay_yeu_cau
) VALUES
    (1, 1, NULL, 500000, 'Vietcombank – CN Đà Nẵng', '0041000389214', 'NGUYEN HUU KHANH', 'Pending', NOW() - INTERVAL '3 hours');

SELECT setval('public.payout_request_ma_rut_tien_seq', 1, true);

INSERT INTO public.review (ma_booking, ma_tourist, ma_guide, so_sao, nhan_xet) VALUES
    (5, 1, 5, 5, 'Bạn Mỹ Linh cực kỳ nhiệt tình, dẫn đi ăn mỳ Quảng ếch và kem bơ Chợ Cồn siêu ngon, giá cả minh bạch!');

INSERT INTO public.notification (ma_tai_khoan, tieu_de, noi_dung, loai_thong_bao, ma_booking, da_doc) VALUES
    (1, 'Đơn BK-1002 đã được HDV Nguyễn Hữu Khanh chấp nhận', 'Khung giờ đang được giữ chỗ 15 phút. Vui lòng thanh toán cọc 30% (300.000 ₫) để xác nhận lịch trình.', 'PAYMENT', 2, false),
    (4, 'Yêu cầu đặt lịch mới BK-1001', 'Du khách Dương Đăng Huân vừa gửi yêu cầu đặt lịch 4 giờ tại Cầu Rồng & Sơn Trà.', 'BOOKING', 1, false);

INSERT INTO public.message (ma_booking, ma_nguoi_gui, ma_nguoi_nhan, noi_dung, da_doc) VALUES
    (3, 1, 4, 'Chào anh Khanh, đoàn mình có 2 người, hẹn anh ở cổng chính Chợ Hàn lúc 15h nhé!', true),
    (3, 4, 1, 'Chào bạn Huân, mình đã nhận lịch đơn BK-1003. Mình sẽ chuẩn bị sẵn nón lá và máy ảnh hỗ trợ chụp hình cho 2 bạn nhé!', false);

COMMIT;
