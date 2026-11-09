-- =============================================================================
-- MIGRATION 03: SERVER RPC FUNCTIONS (SECURITY DEFINER) & TỰ ĐỘNG HÓA (PG_CRON)
-- Nguyên tắc:
--   1. KHÔNG TIN CLIENT: Mọi số tiền (G, cọc 30%, còn lại 70%, phí sàn F, hoàn/phạt theo ΔT)
--      đều được tính toán lại 100% trong hàm PostgreSQL trên Server.
--   2. CHỐNG ĐẶT TRÙNG KHUNG GIỜ (RACE CONDITION): Dùng Transaction + Row-Level Lock
--      (SELECT ... FOR UPDATE) trên bảng availability_slot và booking.
--   3. TỰ ĐỘNG HÓA: Job nhả khung giờ khi hết hạn giữ chỗ 15 phút, job hủy đơn quá hạn
--      24 giờ HDV chưa xác nhận, và job tự xác nhận hoàn thành sau 24 giờ (pg_cron).
-- =============================================================================

-- =============================================================================
-- 1. HÀM TÍNH TOÁN TIỀN CHUẨN TRÊN SERVER (CỌC 30%, CÒN LẠI 70%, PHÍ SÀN F)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_get_active_fee_rate()
RETURNS NUMERIC(5, 4)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT fee_rate
         FROM public.fee_config
         WHERE ngay_hieu_luc <= NOW()
         ORDER BY ngay_hieu_luc DESC, ma_cau_hinh DESC
         LIMIT 1),
        0.1200
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_calc_booking_financials(
    p_gia_theo_gio NUMERIC,
    p_so_gio NUMERIC,
    p_fee_rate NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    gia_theo_gio NUMERIC(12, 2),
    so_gio NUMERIC(8, 2),
    fee_rate NUMERIC(5, 4),
    tong_tien NUMERIC(14, 2),
    tien_coc_30 NUMERIC(14, 2),
    tien_con_lai_70 NUMERIC(14, 2),
    phi_san NUMERIC(14, 2),
    guide_nhan_online NUMERIC(14, 2),
    guide_cong_vi_cash NUMERIC(14, 2)
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_rate NUMERIC(5, 4);
    v_total NUMERIC(14, 2);
    v_deposit NUMERIC(14, 2);
    v_remaining NUMERIC(14, 2);
    v_fee NUMERIC(14, 2);
BEGIN
    IF p_gia_theo_gio < 80000 OR p_gia_theo_gio > 500000 THEN
        RAISE EXCEPTION 'INVALID_HOURLY_RATE: Đơn giá theo giờ phải từ 80.000 ₫ đến 500.000 ₫ (BR-02).';
    END IF;
    IF p_so_gio <= 0 THEN
        RAISE EXCEPTION 'INVALID_HOURS: Tổng số giờ đặt lịch phải lớn hơn 0.';
    END IF;

    v_rate := COALESCE(p_fee_rate, 0.1200);
    IF v_rate < 0.1000 OR v_rate > 0.1500 THEN
        RAISE EXCEPTION 'INVALID_FEE_RATE: Tỷ lệ phí sàn phải nằm trong khoảng 10%% đến 15%% (BR-13).';
    END IF;

    v_total := ROUND(p_gia_theo_gio * p_so_gio, 0);
    v_deposit := ROUND(v_total * 0.30, 0);
    v_remaining := v_total - v_deposit;
    v_fee := ROUND(v_total * v_rate, 0);

    RETURN QUERY SELECT
        ROUND(p_gia_theo_gio, 2),
        ROUND(p_so_gio, 2),
        v_rate,
        v_total,
        v_deposit,
        v_remaining,
        v_fee,
        (v_total - v_fee)::NUMERIC(14, 2),   -- Online 70%: +(G - F)
        (v_deposit - v_fee)::NUMERIC(14, 2); -- Cash 70%:   +(D - F)
END;
$$;

-- =============================================================================
-- 2. HÀM TÍNH HOÀN / PHẠT CỌC THEO DELTA T (BR-06, BR-07, UC.24, UC.25)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_calc_cancellation_by_delta_t(
    p_tien_coc NUMERIC,
    p_fee_rate NUMERIC,
    p_thoi_gian_bat_dau TIMESTAMPTZ,
    p_thoi_gian_huy TIMESTAMPTZ DEFAULT NOW(),
    p_ben_huy VARCHAR DEFAULT 'Tourist'
)
RETURNS TABLE (
    delta_t_gio NUMERIC(8, 2),
    ty_le_phat_coc NUMERIC(5, 4),
    tien_phat NUMERIC(14, 2),
    tien_hoan NUMERIC(14, 2),
    phi_san_giu NUMERIC(14, 2),
    tien_boi_thuong_guide NUMERIC(14, 2)
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_delta NUMERIC(8, 2);
    v_rate NUMERIC(5, 4);
    v_phat NUMERIC(14, 2);
    v_hoan NUMERIC(14, 2);
    v_phi_san NUMERIC(14, 2);
    v_guide_nhan NUMERIC(14, 2);
BEGIN
    v_delta := ROUND(
        GREATEST(0, EXTRACT(EPOCH FROM (p_thoi_gian_bat_dau - p_thoi_gian_huy)) / 3600.0)::NUMERIC,
        2
    );

    -- Nếu HDV hoặc Hệ thống hủy đơn -> Hoàn 100% cọc cho khách, không phạt (BR-06)
    IF p_ben_huy IN ('LocalGuide', 'System', 'Admin') THEN
        v_rate := 0.0000;
        v_phat := 0;
        v_hoan := ROUND(p_tien_coc, 0);
        v_phi_san := 0;
        v_guide_nhan := 0;
    ELSE
        -- Du khách hủy đơn đã đặt cọc: xét theo 3 bậc Delta T (BR-06, BR-07)
        IF v_delta > 48.0 THEN
            v_rate := 0.0000; -- Hủy trước > 48 giờ: Phạt 0%, Hoàn 100% cọc
        ELSIF v_delta >= 24.0 THEN
            v_rate := 0.5000; -- Hủy từ 24h đến 48h: Phạt 50% cọc, Hoàn 50% cọc
        ELSE
            v_rate := 1.0000; -- Hủy dưới 24h: Phạt 100% cọc, Hoàn 0đ
        END IF;

        v_phat := ROUND(p_tien_coc * v_rate, 0);
        v_hoan := ROUND(p_tien_coc - v_phat, 0);
        v_phi_san := ROUND(v_phat * p_fee_rate, 0);
        v_guide_nhan := GREATEST(0, v_phat - v_phi_san);
    END IF;

    RETURN QUERY SELECT
        v_delta,
        v_rate,
        v_phat,
        v_hoan,
        v_phi_san,
        v_guide_nhan;
END;
$$;

-- =============================================================================
-- 3. HÀM TẠO BOOKING & KHÓA DÒNG CHỐNG ĐẶT TRÙNG KHUNG GIỜ (UC.12, UC.13, BR-04)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_create_booking(
    p_ma_tourist INT,
    p_ma_guide INT,
    p_ma_khung_gio INT,
    p_dia_diem_hen VARCHAR,
    p_so_luong_khach INT,
    p_ghi_chu_yeu_cau VARCHAR,
    p_lock_slot_immediately BOOLEAN DEFAULT FALSE
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slot public.availability_slot%ROWTYPE;
    v_guide public.local_guide%ROWTYPE;
    v_fee_rate NUMERIC(5, 4);
    v_hours NUMERIC(8, 2);
    v_calc RECORD;
    v_booking public.booking%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Kiểm tra dữ liệu đầu vào bắt buộc (FR 4.1, UC.12)
    IF p_dia_diem_hen IS NULL OR BTRIM(p_dia_diem_hen) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Địa điểm hẹn gặp mặt là bắt buộc (FR 4.1).';
    END IF;
    IF p_ghi_chu_yeu_cau IS NULL OR BTRIM(p_ghi_chu_yeu_cau) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Ghi chú yêu cầu chuyến đi là bắt buộc (UC.12).';
    END IF;
    IF p_so_luong_khach IS NULL OR p_so_luong_khach <= 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Số lượng khách phải lớn hơn 0.';
    END IF;

    -- 2. Kiểm tra HDV đã xác minh KYC (BR-01)
    SELECT * INTO v_guide
    FROM public.local_guide
    WHERE ma_tai_khoan = p_ma_guide;

    IF NOT FOUND OR v_guide.trang_thai_xac_minh <> 'Verified' THEN
        RAISE EXCEPTION 'GUIDE_NOT_VERIFIED: Hướng dẫn viên chưa được xác minh KYC nên không thể nhận lịch (BR-01).';
    END IF;

    -- 3. KHÓA DÒNG NGUYÊN TỬ (ROW-LEVEL LOCK) TRÊN KHUNG GIỜ ĐỂ CHỐNG RACE CONDITION
    SELECT * INTO v_slot
    FROM public.availability_slot
    WHERE ma_khung_gio = p_ma_khung_gio
      AND ma_guide = p_ma_guide
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Khung giờ không tồn tại hoặc không thuộc về Hướng dẫn viên này.';
    END IF;

    -- Nếu slot đang Hold nhưng đã quá hạn 15 phút thì tự động nhả về Available trước khi kiểm tra
    IF v_slot.trang_thai = 'Hold' AND v_slot.hold_expires_at IS NOT NULL AND v_slot.hold_expires_at < v_now THEN
        UPDATE public.availability_slot
        SET trang_thai = 'Available',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE ma_khung_gio = v_slot.ma_khung_gio
        RETURNING * INTO v_slot;
    END IF;

    IF v_slot.trang_thai <> 'Available' THEN
        RAISE EXCEPTION 'SLOT_CONFLICT: Khung giờ đã được giữ chỗ (HOLD) hoặc đã kín lịch (BUSY). Không thể đặt trùng!';
    END IF;

    -- 4. Tính toán số giờ, lấy đơn giá của Guide và tỷ lệ phí sàn hiện hành trên Server
    v_hours := ROUND((EXTRACT(EPOCH FROM (v_slot.ket_thuc - v_slot.bat_dau)) / 3600.0)::NUMERIC, 2);
    v_fee_rate := public.fn_get_active_fee_rate();

    SELECT * INTO v_calc
    FROM public.fn_calc_booking_financials(v_guide.gia_theo_gio, v_hours, v_fee_rate);

    -- 5. Khởi tạo Booking
    INSERT INTO public.booking (
        ma_tourist,
        ma_guide,
        ma_khung_gio,
        thoi_gian_bat_dau,
        thoi_gian_ket_thuc,
        dia_diem_hen,
        so_luong_khach,
        ghi_chu_yeu_cau,
        gia_theo_gio_chot,
        fee_rate_chot,
        tong_tien,
        tien_coc_30,
        tien_con_lai_70,
        ngay_tao,
        pending_expires_at,
        thoi_diem_chap_nhan,
        hold_expires_at,
        booking_status,
        payment_status
    ) VALUES (
        p_ma_tourist,
        p_ma_guide,
        p_ma_khung_gio,
        v_slot.bat_dau,
        v_slot.ket_thuc,
        BTRIM(p_dia_diem_hen),
        p_so_luong_khach,
        BTRIM(p_ghi_chu_yeu_cau),
        v_calc.gia_theo_gio,
        v_calc.fee_rate,
        v_calc.tong_tien,
        v_calc.tien_coc_30,
        v_calc.tien_con_lai_70,
        v_now,
        v_now + INTERVAL '24 hours',
        CASE WHEN p_lock_slot_immediately THEN v_now ELSE NULL END,
        CASE WHEN p_lock_slot_immediately THEN v_now + INTERVAL '15 minutes' ELSE NULL END,
        CASE WHEN p_lock_slot_immediately THEN 'WaitingPayment' ELSE 'Pending' END,
        CASE WHEN p_lock_slot_immediately THEN 'WaitingDeposit' ELSE 'Unpaid' END
    )
    RETURNING * INTO v_booking;

    -- 6. Nếu yêu cầu giữ khung giờ 15 phút ngay lập tức, khóa slot sang Hold
    IF p_lock_slot_immediately THEN
        UPDATE public.availability_slot
        SET trang_thai = 'Hold',
            hold_expires_at = v_now + INTERVAL '15 minutes',
            held_by_booking_id = v_booking.ma_booking
        WHERE ma_khung_gio = v_slot.ma_khung_gio;
    END IF;

    -- 7. Ghi nhật ký đơn (BOOKING_LOG) & Thông báo (NOTIFICATION)
    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        CASE
            WHEN p_lock_slot_immediately THEN 'Khởi tạo đơn và khóa giữ chỗ khung giờ 15 phút chờ cọc 30%'
            ELSE 'Du khách khởi tạo yêu cầu đặt lịch (Pending - chờ HDV phản hồi trong 24h)'
        END,
        v_now,
        p_ma_tourist
    );

    INSERT INTO public.notification (ma_tai_khoan, tieu_de, noi_dung, loai_thong_bao, ma_booking)
    VALUES (
        p_ma_guide,
        'Yêu cầu đặt lịch mới ' || v_booking.ma_hien_thi,
        'Du khách vừa gửi yêu cầu đặt lịch tại ' || v_booking.dia_diem_hen || '. Vui lòng phản hồi trong 24 giờ.',
        'BOOKING',
        v_booking.ma_booking
    );

    RETURN v_booking;
END;
$$;

-- =============================================================================
-- 4. HÀM HDV CHẤP NHẬN / TỪ CHỐI ĐƠN & KHÓA KHUNG GIỜ 15 PHÚT (UC.13, BR-04, BR-05)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_guide_respond_booking(
    p_ma_booking INT,
    p_ma_guide INT,
    p_accept BOOLEAN,
    p_ly_do VARCHAR DEFAULT NULL
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_slot public.availability_slot%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Khóa dòng Booking
    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
      AND ma_guide = p_ma_guide
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: Không tìm thấy đơn đặt lịch của Hướng dẫn viên này.';
    END IF;

    IF v_booking.booking_status <> 'Pending' THEN
        RAISE EXCEPTION 'INVALID_STATE: Chỉ có thể phản hồi đơn đang ở trạng thái Pending.';
    END IF;

    -- 2. Khóa dòng Khung giờ (AVAILABILITY_SLOT) để chống chấp nhận trùng lịch
    SELECT * INTO v_slot
    FROM public.availability_slot
    WHERE ma_khung_gio = v_booking.ma_khung_gio
    FOR UPDATE;

    -- Tự nhả nếu Hold cũ đã quá hạn 15 phút
    IF v_slot.trang_thai = 'Hold' AND v_slot.hold_expires_at IS NOT NULL AND v_slot.hold_expires_at < v_now THEN
        UPDATE public.availability_slot
        SET trang_thai = 'Available',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE ma_khung_gio = v_slot.ma_khung_gio
        RETURNING * INTO v_slot;
    END IF;

    IF p_accept THEN
        -- Kiểm tra xung đột lịch nguyên tử (BR-04, UC.13 Ngoại lệ 1)
        IF v_slot.trang_thai <> 'Available' THEN
            RAISE EXCEPTION 'SLOT_CONFLICT: Khung giờ đã được giữ chỗ (HOLD) hoặc đã nhận khách khác (BUSY). Không thể chấp nhận trùng lịch!';
        END IF;

        -- Khóa khung giờ sang Hold trong 15 phút chờ khách đặt cọc 30%
        UPDATE public.availability_slot
        SET trang_thai = 'Hold',
            hold_expires_at = v_now + INTERVAL '15 minutes',
            held_by_booking_id = v_booking.ma_booking
        WHERE ma_khung_gio = v_slot.ma_khung_gio;

        UPDATE public.booking
        SET booking_status = 'WaitingPayment',
            payment_status = 'WaitingDeposit',
            thoi_diem_chap_nhan = v_now,
            hold_expires_at = v_now + INTERVAL '15 minutes'
        WHERE ma_booking = v_booking.ma_booking
        RETURNING * INTO v_booking;

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
        VALUES (
            v_booking.ma_booking,
            'HDV chấp nhận đơn. Hệ thống khóa khung giờ HOLD 15 phút chờ khách thanh toán cọc 30%.',
            v_now,
            p_ma_guide
        );

        INSERT INTO public.notification (ma_tai_khoan, tieu_de, noi_dung, loai_thong_bao, ma_booking)
        VALUES (
            v_booking.ma_tourist,
            'HDV đã chấp nhận đơn ' || v_booking.ma_hien_thi,
            'Vui lòng thanh toán cọc 30% trong vòng 15 phút để giữ chỗ chính thức.',
            'PAYMENT',
            v_booking.ma_booking
        );
    ELSE
        -- HDV từ chối đơn (UC.13 Nhánh từ chối)
        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Unpaid'
        WHERE ma_booking = v_booking.ma_booking
        RETURNING * INTO v_booking;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan
        ) VALUES (
            v_booking.ma_booking,
            v_now,
            'LocalGuide',
            COALESCE(NULLIF(BTRIM(p_ly_do), ''), 'Hướng dẫn viên từ chối yêu cầu đặt lịch do bận đột xuất.'),
            0,
            GREATEST(0, ROUND((EXTRACT(EPOCH FROM (v_booking.thoi_gian_bat_dau - v_now)) / 3600.0)::NUMERIC, 2)),
            0,
            0
        );

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
        VALUES (
            v_booking.ma_booking,
            'HDV từ chối yêu cầu đặt lịch.',
            v_now,
            p_ma_guide
        );
    END IF;

    RETURN v_booking;
END;
$$;

-- =============================================================================
-- 5. HÀM THANH TOÁN ĐẶT CỌC 30% & LẬP THỎA THUẬN DỊCH VỤ ĐIỆN TỬ (UC.14, BR-05, BR-10)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_pay_deposit_30(
    p_ma_booking INT,
    p_ma_tourist INT,
    p_cong_thanh_toan VARCHAR DEFAULT 'VNPAY',
    p_ma_tham_chieu VARCHAR DEFAULT NULL,
    p_is_success BOOLEAN DEFAULT TRUE,
    p_cancel_on_fail BOOLEAN DEFAULT FALSE
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
    v_ref VARCHAR(100);
BEGIN
    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
      AND ma_tourist = p_ma_tourist
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: Không tìm thấy đơn đặt lịch.';
    END IF;

    IF v_booking.booking_status <> 'WaitingPayment' THEN
        RAISE EXCEPTION 'INVALID_STATE: Đơn không ở trạng thái chờ thanh toán cọc 30%%.';
    END IF;

    -- Kiểm tra thời hạn giữ chỗ 15 phút (BR-05)
    IF v_booking.hold_expires_at IS NOT NULL AND v_booking.hold_expires_at < v_now THEN
        -- Tự động hủy đơn & nhả khung giờ
        UPDATE public.availability_slot
        SET trang_thai = 'Available',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE ma_khung_gio = v_booking.ma_khung_gio;

        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Unpaid'
        WHERE ma_booking = v_booking.ma_booking
        RETURNING * INTO v_booking;

        RAISE EXCEPTION 'HOLD_EXPIRED: Đã quá thời hạn giữ chỗ 15 phút. Khung giờ đã được giải phóng (BR-05).';
    END IF;

    v_ref := COALESCE(NULLIF(BTRIM(p_ma_tham_chieu), ''), 'DEP-' || v_booking.ma_booking || '-' || EXTRACT(EPOCH FROM v_now)::BIGINT);

    IF p_is_success THEN
        -- 1. Ghi nhận giao dịch thanh toán cọc 30% thành công
        INSERT INTO public.payment_transaction (
            ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong, thoi_gian_giao_dich
        ) VALUES (
            v_booking.ma_booking, 'Deposit', 'Online', p_cong_thanh_toan, v_booking.tien_coc_30, 'Success', v_ref, v_now
        );

        -- 2. Chuyển khung giờ từ Hold -> Busy
        UPDATE public.availability_slot
        SET trang_thai = 'Busy',
            hold_expires_at = NULL,
            held_by_booking_id = v_booking.ma_booking
        WHERE ma_khung_gio = v_booking.ma_khung_gio;

        -- 3. Cập nhật trạng thái Booking sang Confirmed + Deposited
        UPDATE public.booking
        SET booking_status = 'Confirmed',
            payment_status = 'Deposited',
            thoi_diem_xac_nhan_coc = v_now
        WHERE ma_booking = v_booking.ma_booking
        RETURNING * INTO v_booking;

        -- 4. Tự động khởi tạo Thỏa thuận dịch vụ điện tử (SERVICE_AGREEMENT - BR-10)
        INSERT INTO public.service_agreement (
            ma_booking,
            pham_vi_dich_vu,
            dia_diem,
            gia_theo_gio_chot,
            tong_gia_tri_chot,
            tien_coc_chot,
            tien_con_lai_chot,
            phuong_thuc_thanh_toan,
            chinh_sach_huy,
            ngay_tao
        ) VALUES (
            v_booking.ma_booking,
            v_booking.ghi_chu_yeu_cau,
            v_booking.dia_diem_hen,
            v_booking.gia_theo_gio_chot,
            v_booking.tong_tien,
            v_booking.tien_coc_30,
            v_booking.tien_con_lai_70,
            'Online',
            'Hủy trước >48h: hoàn 100% cọc; Hủy từ 24h-48h: phạt 50% cọc; Hủy <24h: phạt 100% cọc (BR-06, BR-07).',
            v_now
        ) ON CONFLICT (ma_booking) DO NOTHING;

        -- 5. Ghi nhật ký & Thông báo
        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
        VALUES (
            v_booking.ma_booking,
            'Du khách đặt cọc 30% thành công (' || v_booking.tien_coc_30 || ' ₫). Đã lập Thỏa thuận dịch vụ điện tử (BR-10).',
            v_now,
            p_ma_tourist
        );

        INSERT INTO public.notification (ma_tai_khoan, tieu_de, noi_dung, loai_thong_bao, ma_booking)
        VALUES (
            v_booking.ma_guide,
            'Đơn ' || v_booking.ma_hien_thi || ' đã đặt cọc 30% thành công!',
            'Khung giờ đã chuyển sang BUSY. Hãy chuẩn bị đón khách đúng hẹn tại ' || v_booking.dia_diem_hen || '.',
            'PAYMENT',
            v_booking.ma_booking
        );
    ELSE
        -- Giao dịch thất bại
        INSERT INTO public.payment_transaction (
            ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong, thoi_gian_giao_dich
        ) VALUES (
            v_booking.ma_booking, 'Deposit', 'Online', p_cong_thanh_toan, v_booking.tien_coc_30, 'Failed', v_ref, v_now
        );

        IF p_cancel_on_fail THEN
            -- Hủy đơn & nhả lịch ngay theo UC.14 Ngoại lệ 1
            UPDATE public.availability_slot
            SET trang_thai = 'Available',
                hold_expires_at = NULL,
                held_by_booking_id = NULL
            WHERE ma_khung_gio = v_booking.ma_khung_gio;

            UPDATE public.booking
            SET booking_status = 'Cancelled',
                payment_status = 'Unpaid'
            WHERE ma_booking = v_booking.ma_booking
            RETURNING * INTO v_booking;

            INSERT INTO public.cancellation_record (
                ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan
            ) VALUES (
                v_booking.ma_booking,
                v_now,
                'System',
                'Giao dịch thanh toán cọc 30% bị từ chối trên cổng thanh toán (UC.14 Ngoại lệ 1).',
                0,
                GREATEST(0, ROUND((EXTRACT(EPOCH FROM (v_booking.thoi_gian_bat_dau - v_now)) / 3600.0)::NUMERIC, 2)),
                0,
                0
            ) ON CONFLICT (ma_booking) DO NOTHING;
        END IF;
    END IF;

    RETURN v_booking;
END;
$$;

-- =============================================================================
-- 6. HÀM HỦY BOOKING & ĐỐI SOÁT HOÀN / PHẠT CỌC THEO DELTA T (UC.24, UC.25, BR-06, BR-07)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_cancel_booking(
    p_ma_booking INT,
    p_nguoi_huy INT,
    p_ly_do VARCHAR,
    p_thoi_gian_huy TIMESTAMPTZ DEFAULT NOW()
)
RETURNS public.cancellation_record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_actor public.tai_khoan%ROWTYPE;
    v_ben_huy VARCHAR(20);
    v_calc RECORD;
    v_wallet public.wallet%ROWTYPE;
    v_record public.cancellation_record%ROWTYPE;
BEGIN
    IF p_ly_do IS NULL OR BTRIM(p_ly_do) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Bắt buộc nhập lý do hủy đơn (CANCELLATION_RECORD.ly_do NOT NULL).';
    END IF;

    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: Không tìm thấy đơn đặt lịch.';
    END IF;

    IF v_booking.booking_status IN ('Completed', 'Cancelled', 'Disputed') THEN
        RAISE EXCEPTION 'INVALID_STATE: Không thể hủy đơn đã hoàn thành, đã hủy hoặc đang tranh chấp.';
    END IF;

    SELECT * INTO v_actor
    FROM public.tai_khoan
    WHERE ma_tai_khoan = p_nguoi_huy;

    IF v_booking.ma_tourist = p_nguoi_huy THEN
        v_ben_huy := 'Tourist';
    ELSIF v_booking.ma_guide = p_nguoi_huy THEN
        v_ben_huy := 'LocalGuide';
    ELSIF v_actor.loai_tai_khoan = 'Admin' THEN
        v_ben_huy := 'Admin';
    ELSE
        RAISE EXCEPTION 'FORBIDDEN: Bạn không có quyền hủy đơn đặt lịch này.';
    END IF;

    -- 1. Nhả khung giờ về Available
    UPDATE public.availability_slot
    SET trang_thai = 'Available',
        hold_expires_at = NULL,
        held_by_booking_id = NULL
    WHERE ma_khung_gio = v_booking.ma_khung_gio;

    -- 2. Nếu đơn chưa đặt cọc (Pending / WaitingPayment) -> hủy không phạt
    IF v_booking.booking_status IN ('Pending', 'WaitingPayment') THEN
        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Unpaid'
        WHERE ma_booking = v_booking.ma_booking;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan, phi_san_giu, tien_boi_thuong_guide
        ) VALUES (
            v_booking.ma_booking,
            p_thoi_gian_huy,
            v_ben_huy,
            BTRIM(p_ly_do),
            0,
            GREATEST(0, ROUND((EXTRACT(EPOCH FROM (v_booking.thoi_gian_bat_dau - p_thoi_gian_huy)) / 3600.0)::NUMERIC, 2)),
            0,
            0,
            0,
            0
        )
        RETURNING * INTO v_record;

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
        VALUES (
            v_booking.ma_booking,
            v_ben_huy || ' hủy đơn trước khi đặt cọc. Đã nhả khung giờ về Available.',
            p_thoi_gian_huy,
            p_nguoi_huy
        );

        RETURN v_record;
    END IF;

    -- 3. Nếu đơn đã đặt cọc 30% (Confirmed) -> tính hoàn/phạt theo Delta T (BR-06, BR-07)
    SELECT * INTO v_calc
    FROM public.fn_calc_cancellation_by_delta_t(
        v_booking.tien_coc_30,
        v_booking.fee_rate_chot,
        v_booking.thoi_gian_bat_dau,
        p_thoi_gian_huy,
        v_ben_huy
    );

    -- Cập nhật trạng thái Booking
    UPDATE public.booking
    SET booking_status = 'Cancelled',
        payment_status = CASE WHEN v_calc.tien_hoan > 0 THEN 'Refunded' ELSE 'Deposited' END
    WHERE ma_booking = v_booking.ma_booking;

    -- Lưu CANCELLATION_RECORD
    INSERT INTO public.cancellation_record (
        ma_booking,
        ngay_huy,
        ben_huy,
        ly_do,
        ty_le_phat_coc,
        so_gio_con_lai,
        tien_phat,
        tien_hoan,
        phi_san_giu,
        tien_boi_thuong_guide
    ) VALUES (
        v_booking.ma_booking,
        p_thoi_gian_huy,
        v_ben_huy,
        BTRIM(p_ly_do),
        v_calc.ty_le_phat_coc,
        v_calc.delta_t_gio,
        v_calc.tien_phat,
        v_calc.tien_hoan,
        v_calc.phi_san_giu,
        v_calc.tien_boi_thuong_guide
    )
    RETURNING * INTO v_record;

    -- Ghi giao dịch hoàn tiền cho khách nếu tien_hoan > 0
    IF v_calc.tien_hoan > 0 THEN
        INSERT INTO public.payment_transaction (
            ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong, thoi_gian_giao_dich
        ) VALUES (
            v_booking.ma_booking,
            'Refund',
            'Online',
            'VNPAY',
            v_calc.tien_hoan,
            'Refunded',
            'REF-CANCEL-' || v_booking.ma_booking,
            p_thoi_gian_huy
        );
    END IF;

    -- Nếu có tiền bồi thường phạt cọc cho HDV -> cộng vào Ví HDV (WALLET & WALLET_TRANSACTION)
    IF v_calc.tien_boi_thuong_guide > 0 THEN
        SELECT * INTO v_wallet
        FROM public.wallet
        WHERE ma_guide = v_booking.ma_guide
        FOR UPDATE;

        IF NOT FOUND THEN
            INSERT INTO public.wallet (ma_guide, so_du, so_du_kha_dung)
            VALUES (v_booking.ma_guide, 0, 0)
            RETURNING * INTO v_wallet;
        END IF;

        UPDATE public.wallet
        SET so_du = so_du + v_calc.tien_boi_thuong_guide,
            so_du_kha_dung = so_du_kha_dung + v_calc.tien_boi_thuong_guide,
            cap_nhat_luc = p_thoi_gian_huy
        WHERE ma_vi = v_wallet.ma_vi
        RETURNING * INTO v_wallet;

        INSERT INTO public.wallet_transaction (
            ma_vi,
            ma_booking,
            loai_but_toan,
            so_tien,
            phi_san,
            so_du_sau_but_toan,
            cong_thuc_minh_hoa,
            mo_ta,
            ngay_tao
        ) VALUES (
            v_wallet.ma_vi,
            v_booking.ma_booking,
            'CreditCancelPenalty',
            v_calc.tien_boi_thuong_guide,
            v_calc.phi_san_giu,
            v_wallet.so_du_kha_dung,
            'Phạt cọc (' || v_calc.tien_phat || ' ₫) - Phí sàn (' || v_calc.phi_san_giu || ' ₫)',
            'Bồi thường do Du khách hủy đơn ' || v_booking.ma_hien_thi || ' (ΔT = ' || v_calc.delta_t_gio || 'h, phạt ' || ROUND(v_calc.ty_le_phat_coc * 100, 0) || '%)',
            p_thoi_gian_huy
        );
    END IF;

    -- Nếu HDV tự ý hủy đơn đã Confirmed -> tăng so_lan_vi_pham + 1 (BR-06)
    IF v_ben_huy = 'LocalGuide' THEN
        UPDATE public.tai_khoan
        SET so_lan_vi_pham = so_lan_vi_pham + 1
        WHERE ma_tai_khoan = v_booking.ma_guide;
    END IF;

    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        'Hủy đơn bởi ' || v_ben_huy || ' (ΔT = ' || v_calc.delta_t_gio || 'h). Phạt: ' || v_calc.tien_phat || ' ₫, Hoàn khách: ' || v_calc.tien_hoan || ' ₫.',
        p_thoi_gian_huy,
        p_nguoi_huy
    );

    RETURN v_record;
END;
$$;

-- =============================================================================
-- 7. HÀM HOÀN THÀNH CHUYẾN ĐI & QUYẾT TOÁN 70% CÒN LẠI VÀO VÍ HDV (UC.17, UC.18, UC.20, UC.21, BR-13)
-- =============================================================================

-- 7.1. HDV gửi yêu cầu hoàn thành (UC.17 -> mở cửa sổ 24h BR-08)
CREATE OR REPLACE FUNCTION public.fn_request_completion(
    p_ma_booking INT,
    p_ma_guide INT
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
      AND ma_guide = p_ma_guide
    FOR UPDATE;

    IF NOT FOUND OR v_booking.booking_status <> 'Confirmed' THEN
        RAISE EXCEPTION 'INVALID_STATE: Chỉ đơn Confirmed mới có thể gửi yêu cầu xác nhận hoàn thành.';
    END IF;

    UPDATE public.booking
    SET thoi_diem_gui_yeu_cau_hoan_thanh = v_now,
        completion_auto_confirm_at = v_now + INTERVAL '24 hours'
    WHERE ma_booking = v_booking.ma_booking
    RETURNING * INTO v_booking;

    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        'HDV gửi yêu cầu xác nhận hoàn thành chuyến đi. Mở cửa sổ 24 giờ chờ Du khách phản hồi (BR-08).',
        v_now,
        p_ma_guide
    );

    RETURN v_booking;
END;
$$;

-- 7.2. Du khách xác nhận hoàn thành chuyến đi (UC.18)
CREATE OR REPLACE FUNCTION public.fn_confirm_completion(
    p_ma_booking INT,
    p_ma_tourist INT
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
      AND ma_tourist = p_ma_tourist
    FOR UPDATE;

    IF NOT FOUND OR v_booking.booking_status <> 'Confirmed' THEN
        RAISE EXCEPTION 'INVALID_STATE: Đơn không ở trạng thái có thể xác nhận hoàn thành.';
    END IF;

    UPDATE public.booking
    SET booking_status = 'Completed',
        payment_status = 'WaitingFinal',
        thoi_diem_hoan_thanh = v_now
    WHERE ma_booking = v_booking.ma_booking
    RETURNING * INTO v_booking;

    UPDATE public.local_guide
    SET tong_chuyen_hoan_thanh = tong_chuyen_hoan_thanh + 1
    WHERE ma_tai_khoan = v_booking.ma_guide;

    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        'Du khách xác nhận hoàn thành chuyến đi (COMPLETED). Chuyển sang bước tất toán 70% còn lại.',
        v_now,
        p_ma_tourist
    );

    RETURN v_booking;
END;
$$;

-- 7.3. Quyết toán 70% còn lại (Online UC.20 hoặc Tiền mặt UC.21) & Cộng Ví HDV (BR-13)
CREATE OR REPLACE FUNCTION public.fn_settle_final_70(
    p_ma_booking INT,
    p_phuong_thuc VARCHAR, -- 'Online' hoặc 'Cash'
    p_actor_id INT,
    p_ma_tham_chieu VARCHAR DEFAULT NULL
)
RETURNS public.booking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_wallet public.wallet%ROWTYPE;
    v_fee NUMERIC(14, 2);
    v_credit_amount NUMERIC(14, 2);
    v_formula VARCHAR(255);
    v_tx_type VARCHAR(30);
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_phuong_thuc NOT IN ('Online', 'Cash') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Phương thức thanh toán 70%% phải là Online hoặc Cash.';
    END IF;

    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
    FOR UPDATE;

    IF NOT FOUND OR v_booking.booking_status <> 'Completed' THEN
        RAISE EXCEPTION 'INVALID_STATE: Đơn phải ở trạng thái Completed trước khi quyết toán 70%%.';
    END IF;

    IF v_booking.payment_status = 'Paid' THEN
        RAISE EXCEPTION 'ALREADY_PAID: Đơn đặt lịch này đã được tất toán 100%%.';
    END IF;

    -- Tính phí sàn F = G * fee_rate_chot (BR-13)
    v_fee := ROUND(v_booking.tong_tien * v_booking.fee_rate_chot, 0);

    IF p_phuong_thuc = 'Online' THEN
        -- Khách trả 70% Online cho Sàn -> Sàn cộng +(G - F) vào ví HDV
        v_credit_amount := v_booking.tong_tien - v_fee;
        v_tx_type := 'CreditOnlineSettlement';
        v_formula := 'G (' || v_booking.tong_tien || ' ₫) - Phí sàn ' || ROUND(v_booking.fee_rate_chot * 100, 0) || '% (' || v_fee || ' ₫)';
    ELSE
        -- Khách trả 70% Tiền mặt trực tiếp cho HDV -> Sàn khấu trừ phí F từ cọc 30% (D) và cộng +(D - F) vào ví HDV
        v_credit_amount := v_booking.tien_coc_30 - v_fee;
        v_tx_type := 'CreditCashSettlement';
        v_formula := 'Cọc 30% D (' || v_booking.tien_coc_30 || ' ₫) - Phí sàn ' || ROUND(v_booking.fee_rate_chot * 100, 0) || '% (' || v_fee || ' ₫)';
    END IF;

    -- Ghi giao dịch 70% cuối
    INSERT INTO public.payment_transaction (
        ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong, thoi_gian_giao_dich
    ) VALUES (
        v_booking.ma_booking,
        'FinalPayment',
        p_phuong_thuc,
        CASE WHEN p_phuong_thuc = 'Online' THEN 'VNPAY' ELSE 'CASH_DIRECT' END,
        v_booking.tien_con_lai_70,
        'Success',
        COALESCE(p_ma_tham_chieu, 'FIN-' || v_booking.ma_booking),
        v_now
    );

    -- Cập nhật Booking sang Paid
    UPDATE public.booking
    SET payment_status = 'Paid',
        phuong_thuc_70 = p_phuong_thuc
    WHERE ma_booking = v_booking.ma_booking
    RETURNING * INTO v_booking;

    -- Khóa dòng Ví HDV & Cộng tiền
    SELECT * INTO v_wallet
    FROM public.wallet
    WHERE ma_guide = v_booking.ma_guide
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.wallet (ma_guide, so_du, so_du_kha_dung)
        VALUES (v_booking.ma_guide, 0, 0)
        RETURNING * INTO v_wallet;
    END IF;

    UPDATE public.wallet
    SET so_du = so_du + v_credit_amount,
        so_du_kha_dung = so_du_kha_dung + v_credit_amount,
        cap_nhat_luc = v_now
    WHERE ma_vi = v_wallet.ma_vi
    RETURNING * INTO v_wallet;

    INSERT INTO public.wallet_transaction (
        ma_vi,
        ma_booking,
        loai_but_toan,
        so_tien,
        phi_san,
        so_du_sau_but_toan,
        cong_thuc_minh_hoa,
        mo_ta,
        ngay_tao
    ) VALUES (
        v_wallet.ma_vi,
        v_booking.ma_booking,
        v_tx_type,
        v_credit_amount,
        v_fee,
        v_wallet.so_du_kha_dung,
        v_formula,
        'Quyết toán đơn ' || v_booking.ma_hien_thi || ' (70% cuối qua ' || p_phuong_thuc || ')',
        v_now
    );

    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        'Tất toán 70% cuối (' || p_phuong_thuc || '). Đã cộng +' || v_credit_amount || ' ₫ vào Ví HDV.',
        v_now,
        p_actor_id
    );

    RETURN v_booking;
END;
$$;

-- =============================================================================
-- 8. HÀM YÊU CẦU RÚT TIỀN & ADMIN DUYỆT RÚT TIỀN (UC.22, UC.23, BR-09)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_request_payout(
    p_ma_guide INT,
    p_so_tien NUMERIC,
    p_ngan_hang VARCHAR,
    p_so_tai_khoan VARCHAR,
    p_chu_tai_khoan VARCHAR
)
RETURNS public.payout_request
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet public.wallet%ROWTYPE;
    v_req public.payout_request%ROWTYPE;
BEGIN
    IF p_so_tien < 200000 THEN
        RAISE EXCEPTION 'MIN_WITHDRAWAL_ERROR: Số tiền rút tối thiểu là 200.000 ₫ (BR-09).';
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallet
    WHERE ma_guide = p_ma_guide
    FOR UPDATE;

    IF NOT FOUND OR v_wallet.so_du_kha_dung < p_so_tien THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE: Số dư khả dụng không đủ để thực hiện lệnh rút.';
    END IF;

    -- Tạm khóa số dư khả dụng sang số dư chờ rút
    UPDATE public.wallet
    SET so_du_kha_dung = so_du_kha_dung - p_so_tien,
        so_du_cho_rut = so_du_cho_rut + p_so_tien,
        cap_nhat_luc = NOW()
    WHERE ma_vi = v_wallet.ma_vi;

    INSERT INTO public.payout_request (
        ma_vi, so_tien, ngan_hang, so_tai_khoan_nhan, chu_tai_khoan_nhan, trang_thai
    ) VALUES (
        v_wallet.ma_vi, p_so_tien, BTRIM(p_ngan_hang), BTRIM(p_so_tai_khoan), UPPER(BTRIM(p_chu_tai_khoan)), 'Pending'
    )
    RETURNING * INTO v_req;

    RETURN v_req;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_admin_process_payout(
    p_ma_rut_tien INT,
    p_ma_admin INT,
    p_approve BOOLEAN,
    p_ma_unc VARCHAR DEFAULT NULL,
    p_ghi_chu VARCHAR DEFAULT NULL
)
RETURNS public.payout_request
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_req public.payout_request%ROWTYPE;
    v_wallet public.wallet%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_req
    FROM public.payout_request
    WHERE ma_rut_tien = p_ma_rut_tien
    FOR UPDATE;

    IF NOT FOUND OR v_req.trang_thai <> 'Pending' THEN
        RAISE EXCEPTION 'INVALID_STATE: Lệnh rút tiền không tồn tại hoặc đã được xử lý.';
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallet
    WHERE ma_vi = v_req.ma_vi
    FOR UPDATE;

    IF p_approve THEN
        UPDATE public.wallet
        SET so_du = GREATEST(0, so_du - v_req.so_tien),
            so_du_cho_rut = GREATEST(0, so_du_cho_rut - v_req.so_tien),
            tong_da_rut = tong_da_rut + v_req.so_tien,
            cap_nhat_luc = v_now
        WHERE ma_vi = v_wallet.ma_vi
        RETURNING * INTO v_wallet;

        UPDATE public.payout_request
        SET trang_thai = 'Completed',
            ma_admin = p_ma_admin,
            ma_tham_chieu_unc = p_ma_unc,
            ghi_chu_admin = p_ghi_chu,
            ngay_xu_ly = v_now
        WHERE ma_rut_tien = v_req.ma_rut_tien
        RETURNING * INTO v_req;

        INSERT INTO public.wallet_transaction (
            ma_vi, loai_but_toan, so_tien, phi_san, so_du_sau_but_toan, cong_thuc_minh_hoa, mo_ta, ngay_tao
        ) VALUES (
            v_wallet.ma_vi,
            'DebitPayout',
            v_req.so_tien,
            0,
            v_wallet.so_du_kha_dung,
            'UNC: ' || COALESCE(p_ma_unc, 'BANK_TRANSFER'),
            'Giải ngân rút tiền về ' || v_req.ngan_hang || ' (' || v_req.so_tai_khoan_nhan || ')',
            v_now
        );
    ELSE
        -- Từ chối -> hoàn trả lại số dư khả dụng cho Guide
        UPDATE public.wallet
        SET so_du_kha_dung = so_du_kha_dung + v_req.so_tien,
            so_du_cho_rut = GREATEST(0, so_du_cho_rut - v_req.so_tien),
            cap_nhat_luc = v_now
        WHERE ma_vi = v_wallet.ma_vi
        RETURNING * INTO v_wallet;

        UPDATE public.payout_request
        SET trang_thai = 'Rejected',
            ma_admin = p_ma_admin,
            ghi_chu_admin = p_ghi_chu,
            ngay_xu_ly = v_now
        WHERE ma_rut_tien = v_req.ma_rut_tien
        RETURNING * INTO v_req;
    END IF;

    RETURN v_req;
END;
$$;

-- =============================================================================
-- 9. TỰ ĐỘNG HÓA (CRON JOBS): HẾT HẠN GIỮ CHỖ 15 PHÚT & QUÁ HẠN 24 GIỜ
-- =============================================================================

-- 9.1. Job 1: Giải phóng khung giờ HOLD quá 15 phút mà khách chưa thanh toán cọc (BR-05)
CREATE OR REPLACE FUNCTION public.fn_job_expire_hold_15m()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec RECORD;
    v_count INT := 0;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    FOR v_rec IN
        SELECT ma_booking, ma_khung_gio, ma_tourist, ma_guide, ma_hien_thi, thoi_gian_bat_dau
        FROM public.booking
        WHERE booking_status = 'WaitingPayment'
          AND hold_expires_at IS NOT NULL
          AND hold_expires_at < v_now
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.availability_slot
        SET trang_thai = 'Available',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE ma_khung_gio = v_rec.ma_khung_gio;

        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Unpaid'
        WHERE ma_booking = v_rec.ma_booking;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan
        ) VALUES (
            v_rec.ma_booking,
            v_now,
            'System',
            'Tự động hủy đơn và nhả khung giờ do quá hạn 15 phút giữ chỗ chưa đặt cọc 30% (BR-05).',
            0,
            GREATEST(0, ROUND((EXTRACT(EPOCH FROM (v_rec.thoi_gian_bat_dau - v_now)) / 3600.0)::NUMERIC, 2)),
            0,
            0
        ) ON CONFLICT (ma_booking) DO NOTHING;

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem)
        VALUES (
            v_rec.ma_booking,
            'Hệ thống tự động hủy đơn và giải phóng khung giờ HOLD -> AVAILABLE do hết hạn 15 phút cọc.',
            v_now
        );

        v_count := v_count + 1;
    END LOOP;

    -- Dọn dẹp thêm các slot Hold mồ côi đã quá hạn
    UPDATE public.availability_slot
    SET trang_thai = 'Available',
        hold_expires_at = NULL,
        held_by_booking_id = NULL
    WHERE trang_thai = 'Hold'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < v_now;

    RETURN v_count;
END;
$$;

-- 9.2. Job 2: Tự động hủy đơn quá hạn 24 giờ mà HDV chưa xác nhận (BR-03)
CREATE OR REPLACE FUNCTION public.fn_job_expire_pending_24h()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec RECORD;
    v_count INT := 0;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    FOR v_rec IN
        SELECT ma_booking, ma_khung_gio, ma_tourist, ma_guide, ma_hien_thi, thoi_gian_bat_dau, tien_coc_30, payment_status
        FROM public.booking
        WHERE booking_status = 'Pending'
          AND pending_expires_at < v_now
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.availability_slot
        SET trang_thai = 'Available',
            hold_expires_at = NULL,
            held_by_booking_id = NULL
        WHERE ma_khung_gio = v_rec.ma_khung_gio
          AND held_by_booking_id = v_rec.ma_booking;

        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = CASE WHEN v_rec.payment_status = 'Deposited' THEN 'Refunded' ELSE 'Unpaid' END
        WHERE ma_booking = v_rec.ma_booking;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan
        ) VALUES (
            v_rec.ma_booking,
            v_now,
            'System',
            'Tự động hủy đơn do quá 24 giờ Hướng dẫn viên chưa phản hồi xác nhận (BR-03).',
            0,
            GREATEST(0, ROUND((EXTRACT(EPOCH FROM (v_rec.thoi_gian_bat_dau - v_now)) / 3600.0)::NUMERIC, 2)),
            0,
            CASE WHEN v_rec.payment_status = 'Deposited' THEN v_rec.tien_coc_30 ELSE 0 END
        ) ON CONFLICT (ma_booking) DO NOTHING;

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem)
        VALUES (
            v_rec.ma_booking,
            'Hệ thống tự động hủy đơn do quá hạn 24 giờ HDV chưa xác nhận.',
            v_now
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 9.3. Job 3: Tự động xác nhận hoàn thành sau 24 giờ kể từ lúc HDV bấm hoàn tất (BR-08)
CREATE OR REPLACE FUNCTION public.fn_job_auto_complete_24h()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rec RECORD;
    v_count INT := 0;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    FOR v_rec IN
        SELECT ma_booking, ma_guide
        FROM public.booking
        WHERE booking_status = 'Confirmed'
          AND completion_auto_confirm_at IS NOT NULL
          AND completion_auto_confirm_at < v_now
        FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE public.booking
        SET booking_status = 'Completed',
            payment_status = 'WaitingFinal',
            thoi_diem_hoan_thanh = v_now
        WHERE ma_booking = v_rec.ma_booking;

        UPDATE public.local_guide
        SET tong_chuyen_hoan_thanh = tong_chuyen_hoan_thanh + 1
        WHERE ma_tai_khoan = v_rec.ma_guide;

        INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem)
        VALUES (
            v_rec.ma_booking,
            'Hệ thống tự động xác nhận hoàn thành chuyến đi sau 24 giờ không có khiếu nại (BR-08).',
            v_now
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 9.4. Đăng ký lịch chạy tự động mỗi phút với pg_cron (nếu Supabase project đã bật pg_cron)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        PERFORM cron.schedule(
            'localbuddy-expire-hold-15m',
            '* * * * *',
            $cron$SELECT public.fn_job_expire_hold_15m();$cron$
        );

        PERFORM cron.schedule(
            'localbuddy-expire-pending-24h',
            '*/5 * * * *',
            $cron$SELECT public.fn_job_expire_pending_24h();$cron$
        );

        PERFORM cron.schedule(
            'localbuddy-auto-complete-24h',
            '*/5 * * * *',
            $cron$SELECT public.fn_job_auto_complete_24h();$cron$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Bỏ qua nếu chạy trên quyền user thường chưa có quyền tạo pg_cron
    NULL;
END $$;


-- =============================================================================
-- 10. HÀM KHIẾU NẠI, PHÂN XỬ TRANH CHẤP, ĐÁNH GIÁ, DUYỆT KYC & CẤU HÌNH PHÍ SÀN
-- =============================================================================

-- 10.1. Gửi khiếu nại trong cửa sổ 24 giờ trước khi đơn Completed (UC.19, BR-12)
CREATE OR REPLACE FUNCTION public.fn_submit_complaint(
    p_ma_booking INT,
    p_ma_tai_khoan INT,
    p_ly_do VARCHAR,
    p_mo_ta VARCHAR,
    p_tep_bang_chung VARCHAR DEFAULT NULL
)
RETURNS public.complaint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_complaint public.complaint%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: Không tìm thấy đơn đặt lịch.';
    END IF;

    IF p_ma_tai_khoan NOT IN (v_booking.ma_tourist, v_booking.ma_guide) THEN
        RAISE EXCEPTION 'FORBIDDEN: Chỉ Du khách hoặc Hướng dẫn viên của đơn mới được gửi khiếu nại.';
    END IF;

    IF v_booking.booking_status = 'Completed' THEN
        RAISE EXCEPTION 'COMPLAINT_LOCKED: Đơn đã xác nhận hoàn thành (COMPLETED) nên không thể gửi khiếu nại (BR-12).';
    END IF;

    IF v_booking.booking_status <> 'Confirmed' OR v_booking.thoi_diem_gui_yeu_cau_hoan_thanh IS NULL THEN
        RAISE EXCEPTION 'INVALID_WINDOW: Chỉ được gửi khiếu nại trong cửa sổ 24 giờ sau khi HDV gửi yêu cầu hoàn thành (UC.19, BR-12).';
    END IF;

    UPDATE public.booking
    SET booking_status = 'Disputed',
        payment_status = 'WaitingReconcile'
    WHERE ma_booking = v_booking.ma_booking;

    INSERT INTO public.complaint (
        ma_booking, ma_tai_khoan, ly_do, mo_ta, tep_bang_chung, trang_thai, ngay_gui
    ) VALUES (
        v_booking.ma_booking, p_ma_tai_khoan, BTRIM(p_ly_do), BTRIM(p_mo_ta), p_tep_bang_chung, 'Pending', v_now
    )
    RETURNING * INTO v_complaint;

    INSERT INTO public.booking_log (ma_booking, su_kien, thoi_diem, nguoi_thuc_hien)
    VALUES (
        v_booking.ma_booking,
        'Phát sinh khiếu nại tranh chấp (' || BTRIM(p_ly_do) || '). Tạm khóa giải ngân chờ Admin phân xử.',
        v_now,
        p_ma_tai_khoan
    );

    RETURN v_complaint;
END;
$$;

-- 10.2. Admin phân xử tranh chấp (UC.27, BR-12: GUIDE_FAULT vs TOURIST_FAULT)
CREATE OR REPLACE FUNCTION public.fn_admin_resolve_complaint(
    p_ma_booking INT,
    p_ma_admin INT,
    p_phan_quyet_loi VARCHAR, -- 'GUIDE_FAULT' hoặc 'TOURIST_FAULT'
    p_ket_qua_xu_ly VARCHAR
)
RETURNS public.complaint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_complaint public.complaint%ROWTYPE;
    v_wallet public.wallet%ROWTYPE;
    v_fee NUMERIC(14, 2);
    v_guide_comp NUMERIC(14, 2);
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_phan_quyet_loi NOT IN ('GUIDE_FAULT', 'TOURIST_FAULT') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Phán quyết phải là GUIDE_FAULT hoặc TOURIST_FAULT.';
    END IF;
    IF p_ket_qua_xu_ly IS NULL OR LENGTH(BTRIM(p_ket_qua_xu_ly)) < 10 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Biên bản kết luận phân xử phải có tối thiểu 10 ký tự.';
    END IF;

    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
    FOR UPDATE;

    IF NOT FOUND OR v_booking.booking_status <> 'Disputed' THEN
        RAISE EXCEPTION 'INVALID_STATE: Đơn không ở trạng thái đang tranh chấp (Disputed).';
    END IF;

    IF p_phan_quyet_loi = 'GUIDE_FAULT' THEN
        -- Lỗi thuộc về HDV: Hoàn 100% cọc cho Du khách, sàn không thu phí, +1 vi phạm cho HDV
        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Refunded'
        WHERE ma_booking = v_booking.ma_booking;

        INSERT INTO public.payment_transaction (
            ma_booking, loai_giao_dich, phuong_thuc, cong_thanh_toan, so_tien, trang_thai, ma_tham_chieu_cong, thoi_gian_giao_dich
        ) VALUES (
            v_booking.ma_booking, 'Refund', 'Online', 'VNPAY', v_booking.tien_coc_30, 'Refunded', 'REF-DISP-' || v_booking.ma_booking, v_now
        );

        UPDATE public.tai_khoan
        SET so_lan_vi_pham = so_lan_vi_pham + 1
        WHERE ma_tai_khoan = v_booking.ma_guide;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan, phi_san_giu, tien_boi_thuong_guide
        ) VALUES (
            v_booking.ma_booking, v_now, 'Admin', 'Phán quyết tranh chấp (Lỗi HDV): ' || BTRIM(p_ket_qua_xu_ly), 0, 0, 0, v_booking.tien_coc_30, 0, 0
        ) ON CONFLICT (ma_booking) DO NOTHING;
    ELSE
        -- Lỗi thuộc về Du khách: Tịch thu cọc 30%, trích phí sàn, cộng phần dư vào ví HDV, +1 vi phạm cho Du khách
        v_fee := ROUND(v_booking.tien_coc_30 * v_booking.fee_rate_chot, 0);
        v_guide_comp := GREATEST(0, v_booking.tien_coc_30 - v_fee);

        UPDATE public.booking
        SET booking_status = 'Cancelled',
            payment_status = 'Deposited'
        WHERE ma_booking = v_booking.ma_booking;

        SELECT * INTO v_wallet
        FROM public.wallet
        WHERE ma_guide = v_booking.ma_guide
        FOR UPDATE;

        IF NOT FOUND THEN
            INSERT INTO public.wallet (ma_guide, so_du, so_du_kha_dung)
            VALUES (v_booking.ma_guide, 0, 0)
            RETURNING * INTO v_wallet;
        END IF;

        UPDATE public.wallet
        SET so_du = so_du + v_guide_comp,
            so_du_kha_dung = so_du_kha_dung + v_guide_comp,
            cap_nhat_luc = v_now
        WHERE ma_vi = v_wallet.ma_vi
        RETURNING * INTO v_wallet;

        INSERT INTO public.wallet_transaction (
            ma_vi, ma_booking, loai_but_toan, so_tien, phi_san, so_du_sau_but_toan, cong_thuc_minh_hoa, mo_ta, ngay_tao
        ) VALUES (
            v_wallet.ma_vi,
            v_booking.ma_booking,
            'CreditDisputeRuling',
            v_guide_comp,
            v_fee,
            v_wallet.so_du_kha_dung,
            'Tịch thu cọc (' || v_booking.tien_coc_30 || ' ₫) - Phí sàn (' || v_fee || ' ₫)',
            'Bồi thường theo phán quyết tranh chấp đơn ' || v_booking.ma_hien_thi || ' (Lỗi Du khách)',
            v_now
        );

        UPDATE public.tai_khoan
        SET so_lan_vi_pham = so_lan_vi_pham + 1
        WHERE ma_tai_khoan = v_booking.ma_tourist;

        INSERT INTO public.cancellation_record (
            ma_booking, ngay_huy, ben_huy, ly_do, ty_le_phat_coc, so_gio_con_lai, tien_phat, tien_hoan, phi_san_giu, tien_boi_thuong_guide
        ) VALUES (
            v_booking.ma_booking, v_now, 'Admin', 'Phán quyết tranh chấp (Lỗi Du khách): ' || BTRIM(p_ket_qua_xu_ly), 1, 0, v_booking.tien_coc_30, 0, v_fee, v_guide_comp
        ) ON CONFLICT (ma_booking) DO NOTHING;
    END IF;

    UPDATE public.complaint
    SET trang_thai = 'Resolved',
        ma_admin = p_ma_admin,
        phan_quyet_loi = p_phan_quyet_loi,
        ket_qua_xu_ly = BTRIM(p_ket_qua_xu_ly),
        ngay_xu_ly = v_now
    WHERE ma_booking = v_booking.ma_booking
    RETURNING * INTO v_complaint;

    RETURN v_complaint;
END;
$$;

-- 10.3. Du khách gửi đánh giá 1-5 sao & tự động cập nhật avg_rating của HDV (UC.26, BR-09, FR 7.2)
CREATE OR REPLACE FUNCTION public.fn_submit_review(
    p_ma_booking INT,
    p_ma_tourist INT,
    p_so_sao SMALLINT,
    p_nhan_xet VARCHAR
)
RETURNS public.review
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking public.booking%ROWTYPE;
    v_review public.review%ROWTYPE;
    v_avg NUMERIC(3, 2);
    v_count INT;
BEGIN
    IF p_so_sao < 1 OR p_so_sao > 5 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Điểm đánh giá phải từ 1 đến 5 sao.';
    END IF;

    SELECT * INTO v_booking
    FROM public.booking
    WHERE ma_booking = p_ma_booking
      AND ma_tourist = p_ma_tourist;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'BOOKING_NOT_FOUND: Không tìm thấy đơn đặt lịch của bạn.';
    END IF;

    IF v_booking.booking_status <> 'Completed' OR v_booking.payment_status <> 'Paid' THEN
        RAISE EXCEPTION 'INVALID_STATE: Chỉ đơn đã hoàn thành (Completed) và thanh toán đủ 100%% (Paid) mới được đánh giá (BR-09).';
    END IF;

    INSERT INTO public.review (
        ma_booking, ma_tourist, ma_guide, so_sao, nhan_xet, ngay_danh_gia
    ) VALUES (
        v_booking.ma_booking, p_ma_tourist, v_booking.ma_guide, p_so_sao, BTRIM(p_nhan_xet), NOW()
    )
    RETURNING * INTO v_review;

    -- Tính lại điểm trung bình (avg_rating) và tổng số đánh giá trên hồ sơ HDV (FR 7.2)
    SELECT ROUND(AVG(so_sao)::NUMERIC, 2), COUNT(*)::INT
    INTO v_avg, v_count
    FROM public.review
    WHERE ma_guide = v_booking.ma_guide;

    UPDATE public.local_guide
    SET avg_rating = COALESCE(v_avg, p_so_sao),
        tong_so_danh_gia = v_count
    WHERE ma_tai_khoan = v_booking.ma_guide;

    RETURN v_review;
END;
$$;

-- 10.4. Admin cấu hình tỷ lệ phí sàn 10% - 15% (UC.29, BR-13)
CREATE OR REPLACE FUNCTION public.fn_admin_update_fee_rate(
    p_ma_admin INT,
    p_fee_rate NUMERIC,
    p_ghi_chu VARCHAR DEFAULT NULL
)
RETURNS public.fee_config
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cfg public.fee_config%ROWTYPE;
BEGIN
    IF p_fee_rate < 0.1000 OR p_fee_rate > 0.1500 THEN
        RAISE EXCEPTION 'INVALID_FEE_RATE: Tỷ lệ phí sàn bắt buộc nằm trong khoảng 10%% đến 15%% (BR-13).';
    END IF;

    INSERT INTO public.fee_config (ma_admin, fee_rate, ghi_chu, ngay_hieu_luc)
    VALUES (p_ma_admin, ROUND(p_fee_rate, 4), BTRIM(p_ghi_chu), NOW())
    RETURNING * INTO v_cfg;

    RETURN v_cfg;
END;
$$;

-- 10.5. Admin duyệt / từ chối hồ sơ KYC của HDV (UC.05/UC.10, BR-01)
CREATE OR REPLACE FUNCTION public.fn_admin_review_kyc(
    p_ma_kyc INT,
    p_ma_admin INT,
    p_approve BOOLEAN,
    p_ghi_chu VARCHAR
)
RETURNS public.kyc_submission
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kyc public.kyc_submission%ROWTYPE;
BEGIN
    UPDATE public.kyc_submission
    SET trang_thai = CASE WHEN p_approve THEN 'Approved' ELSE 'Rejected' END,
        ma_admin = p_ma_admin,
        ngay_tham_dinh = NOW(),
        ghi_chu_tham_dinh = BTRIM(p_ghi_chu)
    WHERE ma_kyc = p_ma_kyc
    RETURNING * INTO v_kyc;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'KYC_NOT_FOUND: Không tìm thấy hồ sơ KYC.';
    END IF;

    UPDATE public.local_guide
    SET trang_thai_xac_minh = CASE WHEN p_approve THEN 'Verified' ELSE 'Rejected' END
    WHERE ma_tai_khoan = v_kyc.ma_guide;

    RETURN v_kyc;
END;
$$;

-- Cấp quyền EXECUTE các hàm RPC cho authenticated & anon
GRANT EXECUTE ON FUNCTION
    public.fn_get_active_fee_rate(),
    public.fn_calc_booking_financials(NUMERIC, NUMERIC, NUMERIC),
    public.fn_calc_cancellation_by_delta_t(NUMERIC, NUMERIC, TIMESTAMPTZ, TIMESTAMPTZ, VARCHAR),
    public.fn_create_booking(INT, INT, INT, VARCHAR, INT, VARCHAR, BOOLEAN),
    public.fn_guide_respond_booking(INT, INT, BOOLEAN, VARCHAR),
    public.fn_pay_deposit_30(INT, INT, VARCHAR, VARCHAR, BOOLEAN, BOOLEAN),
    public.fn_cancel_booking(INT, INT, VARCHAR, TIMESTAMPTZ),
    public.fn_request_completion(INT, INT),
    public.fn_confirm_completion(INT, INT),
    public.fn_settle_final_70(INT, VARCHAR, INT, VARCHAR),
    public.fn_request_payout(INT, NUMERIC, VARCHAR, VARCHAR, VARCHAR),
    public.fn_admin_process_payout(INT, INT, BOOLEAN, VARCHAR, VARCHAR),
    public.fn_submit_complaint(INT, INT, VARCHAR, VARCHAR, VARCHAR),
    public.fn_admin_resolve_complaint(INT, INT, VARCHAR, VARCHAR),
    public.fn_submit_review(INT, INT, SMALLINT, VARCHAR),
    public.fn_admin_update_fee_rate(INT, NUMERIC, VARCHAR),
    public.fn_admin_review_kyc(INT, INT, BOOLEAN, VARCHAR),
    public.fn_job_expire_hold_15m(),
    public.fn_job_expire_pending_24h(),
    public.fn_job_auto_complete_24h()
TO anon, authenticated;
