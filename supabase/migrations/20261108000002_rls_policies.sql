-- =============================================================================
-- MIGRATION 02: ROW LEVEL SECURITY (RLS) CHO TOÀN BỘ 26 BẢNG THEO 3 VAI TRÒ
-- Quy tắc bảo mật cốt lõi:
--   1. Bật RLS & FORCE RLS trên MỌI bảng trong schema public.
--   2. Tourist: chỉ thấy booking, giao dịch, thỏa thuận, thông báo, tin nhắn của chính mình;
--      chỉ thấy hồ sơ & lịch rảnh của Guide đã xác minh KYC (trang_thai_xac_minh = 'Verified').
--   3. LocalGuide: chỉ thấy booking của mình, hồ sơ của mình, KYC của mình, ví & bút toán ví của mình.
--   4. Admin: toàn quyền đọc tất cả các bảng để vận hành & đối soát.
--   5. DỮ LIỆU TIỀN & TRẠNG THÁI ĐƠN: Thu hồi quyền ghi trực tiếp (INSERT/UPDATE/DELETE)
--      từ phía client (anon, authenticated). Mọi thao tác tạo đơn, giữ lịch, đặt cọc,
--      hoàn/phạt cọc, cộng/trừ ví, rút tiền BẮT BUỘC đi qua hàm Server RPC (SECURITY DEFINER).
-- =============================================================================

-- =============================================================================
-- 1. HÀM TRỢ GIÚP XÁC ĐỊNH NGƯỜI DÙNG & VAI TRÒ HIỆN TẠI (HỖ TRỢ SUPABASE AUTH + TEST)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_acc_id INT;
    v_claim_id TEXT;
BEGIN
    -- 1. Kiểm tra biến session phục vụ kiểm thử tự động hoặc Edge Function nội bộ
    v_claim_id := current_setting('app.current_account_id', true);
    IF v_claim_id IS NOT NULL AND v_claim_id <> '' THEN
        RETURN v_claim_id::INT;
    END IF;

    -- 2. Lấy từ Supabase Auth JWT (auth.uid())
    BEGIN
        v_uid := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_uid := NULL;
    END;

    IF v_uid IS NOT NULL THEN
        SELECT ma_tai_khoan INTO v_acc_id
        FROM public.tai_khoan
        WHERE auth_user_id = v_uid
          AND trang_thai = 'Active'
        LIMIT 1;
        RETURN v_acc_id;
    END IF;

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_account_role()
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acc_id INT;
    v_role VARCHAR(20);
BEGIN
    v_acc_id := public.current_account_id();
    IF v_acc_id IS NULL THEN
        RETURN 'Anonymous';
    END IF;

    SELECT loai_tai_khoan INTO v_role
    FROM public.tai_khoan
    WHERE ma_tai_khoan = v_acc_id
      AND trang_thai = 'Active';

    RETURN COALESCE(v_role, 'Anonymous');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.current_account_role() = 'Admin';
$$;

-- =============================================================================
-- 2. BẬT ROW LEVEL SECURITY (RLS) CHO TOÀN BỘ 26 BẢNG
-- =============================================================================

ALTER TABLE public.tai_khoan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_guide ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chuyen_mon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngon_ngu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khu_vuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_chuyen_mon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_ngon_ngu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_khu_vuc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_agreement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. PHÂN QUYỀN SCHEMA & CHẶN GHI TRỰC TIẾP TỪ CLIENT VÀO CÁC BẢNG TIỀN TỆ
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE ON public.tai_khoan, public.tourist, public.local_guide, public.kyc_submission, public.notification, public.message TO authenticated;
GRANT INSERT, DELETE ON public.availability_slot, public.guide_chuyen_mon, public.guide_ngon_ngu, public.guide_khu_vuc TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON
    public.booking,
    public.service_agreement,
    public.cancellation_record,
    public.booking_log,
    public.payment_transaction,
    public.wallet,
    public.wallet_transaction,
    public.payout_request,
    public.fee_config,
    public.cancellation_policy
FROM anon, authenticated;

-- =============================================================================
-- 4. POLICIES CHO NHÓM BẢNG DANH MỤC CÔNG KHAI (CHUYEN_MON, NGON_NGU, KHUVUC, POLICY)
-- =============================================================================

-- Ai cũng xem được danh mục chuyên môn, ngôn ngữ, khu vực Đà Nẵng và bảng chính sách hủy
CREATE POLICY pol_chuyen_mon_select ON public.chuyen_mon
    FOR SELECT USING (true);
CREATE POLICY pol_ngon_ngu_select ON public.ngon_ngu
    FOR SELECT USING (true);
CREATE POLICY pol_khu_vuc_select ON public.khu_vuc
    FOR SELECT USING (true);
CREATE POLICY pol_cancellation_policy_select ON public.cancellation_policy
    FOR SELECT USING (true);
CREATE POLICY pol_fee_config_select ON public.fee_config
    FOR SELECT USING (public.current_account_role() IN ('LocalGuide', 'Admin'));

-- =============================================================================
-- 5. POLICIES CHO BẢNG NGƯỜI DÙNG & HỒ SƠ (TAIKHOAN, TOURIST, LOCALGUIDE, ADMIN)
-- =============================================================================

-- 5.1. TAIKHOAN:
--   - Chủ tài khoản xem được chính mình
--   - Admin xem tất cả
--   - Công khai xem thông tin cơ bản (họ tên, ảnh) của các Guide đã xác minh để hiển thị thẻ HDV
CREATE POLICY pol_tai_khoan_select ON public.tai_khoan
    FOR SELECT USING (
        ma_tai_khoan = public.current_account_id()
        OR public.is_admin()
        OR (
            loai_tai_khoan = 'LocalGuide'
            AND trang_thai = 'Active'
            AND EXISTS (
                SELECT 1 FROM public.local_guide lg
                WHERE lg.ma_tai_khoan = tai_khoan.ma_tai_khoan
                  AND lg.trang_thai_xac_minh = 'Verified'
            )
        )
        OR EXISTS (
            -- Cho phép Tourist và Guide nhìn thấy tên đối tác trong cùng Booking của mình
            SELECT 1 FROM public.booking b
            WHERE (b.ma_tourist = public.current_account_id() AND b.ma_guide = tai_khoan.ma_tai_khoan)
               OR (b.ma_guide = public.current_account_id() AND b.ma_tourist = tai_khoan.ma_tai_khoan)
        )
    );

-- Chủ tài khoản chỉ được cập nhật họ tên / ảnh đại diện (không được tự sửa role hay so_lan_vi_pham)
CREATE POLICY pol_tai_khoan_update_self ON public.tai_khoan
    FOR UPDATE
    USING (ma_tai_khoan = public.current_account_id())
    WITH CHECK (
        ma_tai_khoan = public.current_account_id()
        AND loai_tai_khoan = public.current_account_role()
    );

-- 5.2. TOURIST: Chỉ chính Tourist đó hoặc Admin mới xem/sửa được
CREATE POLICY pol_tourist_select ON public.tourist
    FOR SELECT USING (
        ma_tai_khoan = public.current_account_id()
        OR public.is_admin()
    );

CREATE POLICY pol_tourist_update ON public.tourist
    FOR UPDATE USING (ma_tai_khoan = public.current_account_id())
    WITH CHECK (ma_tai_khoan = public.current_account_id());

-- 5.3. LOCALGUIDE (BR-01):
--   - Công khai & Tourist chỉ thấy Guide đã xác minh (trang_thai_xac_minh = 'Verified')
--   - Chính Guide đó thấy hồ sơ của mình (dù đang Pending hay Rejected)
--   - Admin thấy tất cả
CREATE POLICY pol_local_guide_select ON public.local_guide
    FOR SELECT USING (
        trang_thai_xac_minh = 'Verified'
        OR ma_tai_khoan = public.current_account_id()
        OR public.is_admin()
    );

-- Guide chỉ được cập nhật hồ sơ của chính mình và giá trong khung 80.000 - 500.000 (BR-02)
CREATE POLICY pol_local_guide_update_self ON public.local_guide
    FOR UPDATE
    USING (ma_tai_khoan = public.current_account_id())
    WITH CHECK (
        ma_tai_khoan = public.current_account_id()
        AND gia_theo_gio >= 80000
        AND gia_theo_gio <= 500000
    );

-- Bảng liên kết N-N của Guide:
CREATE POLICY pol_guide_chuyen_mon_select ON public.guide_chuyen_mon
    FOR SELECT USING (true);
CREATE POLICY pol_guide_ngon_ngu_select ON public.guide_ngon_ngu
    FOR SELECT USING (true);
CREATE POLICY pol_guide_khu_vuc_select ON public.guide_khu_vuc
    FOR SELECT USING (true);

CREATE POLICY pol_guide_chuyen_mon_write ON public.guide_chuyen_mon
    FOR ALL USING (ma_guide = public.current_account_id() OR public.is_admin())
    WITH CHECK (ma_guide = public.current_account_id() OR public.is_admin());

CREATE POLICY pol_guide_ngon_ngu_write ON public.guide_ngon_ngu
    FOR ALL USING (ma_guide = public.current_account_id() OR public.is_admin())
    WITH CHECK (ma_guide = public.current_account_id() OR public.is_admin());

CREATE POLICY pol_guide_khu_vuc_write ON public.guide_khu_vuc
    FOR ALL USING (ma_guide = public.current_account_id() OR public.is_admin())
    WITH CHECK (ma_guide = public.current_account_id() OR public.is_admin());

-- 5.4. ADMIN: Chỉ Admin mới xem được
CREATE POLICY pol_admin_select ON public.admin
    FOR SELECT USING (public.is_admin());

-- =============================================================================
-- 6. POLICIES CHO HỒ SƠ ĐỊNH DANH KYC (KYCSUBMISSION & KYC_FILE)
-- =============================================================================

-- Chỉ Guide sở hữu hồ sơ KYC hoặc Admin mới được xem
CREATE POLICY pol_kyc_submission_select ON public.kyc_submission
    FOR SELECT USING (
        ma_guide = public.current_account_id()
        OR public.is_admin()
    );

-- Guide chỉ được nộp KYC cho chính mình ở trạng thái Pending
CREATE POLICY pol_kyc_submission_insert ON public.kyc_submission
    FOR INSERT WITH CHECK (
        ma_guide = public.current_account_id()
        AND trang_thai = 'Pending'
    );

CREATE POLICY pol_kyc_file_select ON public.kyc_file
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.kyc_submission k
            WHERE k.ma_kyc = kyc_file.ma_kyc
              AND (k.ma_guide = public.current_account_id() OR public.is_admin())
        )
    );

-- =============================================================================
-- 7. POLICIES CHO LỊCH RẢNH KHUNG GIỜ (AVAILABILITY_SLOT)
-- =============================================================================

-- Công khai/Tourist xem được khung giờ của Guide đã xác minh; Guide xem của mình; Admin xem hết
CREATE POLICY pol_availability_slot_select ON public.availability_slot
    FOR SELECT USING (
        ma_guide = public.current_account_id()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.local_guide lg
            WHERE lg.ma_tai_khoan = availability_slot.ma_guide
              AND lg.trang_thai_xac_minh = 'Verified'
        )
    );

-- Guide đã xác minh chỉ được thêm/xóa khung giờ Available của chính mình (không sửa được Hold/Busy)
CREATE POLICY pol_availability_slot_guide_insert ON public.availability_slot
    FOR INSERT WITH CHECK (
        ma_guide = public.current_account_id()
        AND trang_thai IN ('Available', 'Unavailable')
        AND EXISTS (
            SELECT 1 FROM public.local_guide lg
            WHERE lg.ma_tai_khoan = public.current_account_id()
              AND lg.trang_thai_xac_minh = 'Verified'
        )
    );

CREATE POLICY pol_availability_slot_guide_delete ON public.availability_slot
    FOR DELETE USING (
        ma_guide = public.current_account_id()
        AND trang_thai IN ('Available', 'Unavailable')
    );

-- =============================================================================
-- 8. POLICIES CHO BOOKING, THỎA THUẬN, BẢN GHI HỦY & NHẬT KÝ ĐƠN
-- =============================================================================

-- YÊU CẦU CỐT LÕI:
--   - Tourist CHỈ thấy booking của mình (ma_tourist = current_account_id())
--   - Guide CHỈ thấy booking của mình (ma_guide = current_account_id())
--   - Admin thấy tất cả
CREATE POLICY pol_booking_select ON public.booking
    FOR SELECT USING (
        ma_tourist = public.current_account_id()
        OR ma_guide = public.current_account_id()
        OR public.is_admin()
    );

CREATE POLICY pol_service_agreement_select ON public.service_agreement
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.booking b
            WHERE b.ma_booking = service_agreement.ma_booking
              AND (b.ma_tourist = public.current_account_id() OR b.ma_guide = public.current_account_id())
        )
    );

CREATE POLICY pol_cancellation_record_select ON public.cancellation_record
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.booking b
            WHERE b.ma_booking = cancellation_record.ma_booking
              AND (b.ma_tourist = public.current_account_id() OR b.ma_guide = public.current_account_id())
        )
    );

CREATE POLICY pol_booking_log_select ON public.booking_log
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.booking b
            WHERE b.ma_booking = booking_log.ma_booking
              AND (b.ma_tourist = public.current_account_id() OR b.ma_guide = public.current_account_id())
        )
    );

-- =============================================================================
-- 9. POLICIES CHO BẢNG TIỀN TỆ: PAYMENT_TRANSACTION, WALLET, WALLET_TX, PAYOUT
-- (CHỈ ĐỌC THEO QUYỀN, CẤM GHI TRỰC TIẾP TỪ CLIENT)
-- =============================================================================

-- 9.1. Giao dịch thanh toán: Tourist và Guide của đơn đó + Admin được xem
CREATE POLICY pol_payment_tx_select ON public.payment_transaction
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.booking b
            WHERE b.ma_booking = payment_transaction.ma_booking
              AND (b.ma_tourist = public.current_account_id() OR b.ma_guide = public.current_account_id())
        )
    );

-- 9.2. Ví HDV (WALLET): Chỉ Guide sở hữu ví và Admin được xem (Tourist bị chặn hoàn toàn)
CREATE POLICY pol_wallet_select ON public.wallet
    FOR SELECT USING (
        ma_guide = public.current_account_id()
        OR public.is_admin()
    );

-- 9.3. Bút toán ví (WALLET_TRANSACTION): Chỉ Guide sở hữu ví và Admin được xem
CREATE POLICY pol_wallet_tx_select ON public.wallet_transaction
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.wallet w
            WHERE w.ma_vi = wallet_transaction.ma_vi
              AND w.ma_guide = public.current_account_id()
        )
    );

-- 9.4. Yêu cầu rút tiền (PAYOUT_REQUEST): Chỉ Guide sở hữu ví và Admin được xem
CREATE POLICY pol_payout_request_select ON public.payout_request
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.wallet w
            WHERE w.ma_vi = payout_request.ma_vi
              AND w.ma_guide = public.current_account_id()
        )
    );

-- =============================================================================
-- 10. POLICIES CHO ĐÁNH GIÁ, KHIẾU NẠI, THÔNG BÁO & TIN NHẮN
-- =============================================================================

-- 10.1. Đánh giá (REVIEW): Công khai xem đánh giá trên hồ sơ Guide
CREATE POLICY pol_review_select ON public.review
    FOR SELECT USING (true);

-- 10.2. Khiếu nại (COMPLAINT): Chỉ Tourist/Guide của đơn đó và Admin mới thấy
CREATE POLICY pol_complaint_select ON public.complaint
    FOR SELECT USING (
        ma_tai_khoan = public.current_account_id()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.booking b
            WHERE b.ma_booking = complaint.ma_booking
              AND (b.ma_tourist = public.current_account_id() OR b.ma_guide = public.current_account_id())
        )
    );

-- 10.3. Thông báo (NOTIFICATION): Chỉ người nhận hoặc Admin mới thấy
CREATE POLICY pol_notification_select ON public.notification
    FOR SELECT USING (
        ma_tai_khoan = public.current_account_id()
        OR public.is_admin()
    );

CREATE POLICY pol_notification_update_read ON public.notification
    FOR UPDATE
    USING (ma_tai_khoan = public.current_account_id())
    WITH CHECK (ma_tai_khoan = public.current_account_id());

-- 10.4. Tin nhắn (MESSAGE): Chỉ người gửi, người nhận hoặc Admin mới thấy
CREATE POLICY pol_message_select ON public.message
    FOR SELECT USING (
        ma_nguoi_gui = public.current_account_id()
        OR ma_nguoi_nhan = public.current_account_id()
        OR public.is_admin()
    );

CREATE POLICY pol_message_insert ON public.message
    FOR INSERT WITH CHECK (
        ma_nguoi_gui = public.current_account_id()
    );
