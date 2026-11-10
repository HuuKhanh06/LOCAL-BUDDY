-- =============================================================================
-- MIGRATION 01: KHỞI TẠO TOÀN BỘ LƯỢC ĐỒ CSDL LOCALBUDDY ĐÀ NẴNG (ERD & THIẾT KẾ CSDL)
-- Hệ quản trị: Supabase PostgreSQL 15+ (Auth + Storage + Realtime)
-- =============================================================================

-- Bật các extension cần thiết (nếu có sẵn trên máy chủ PostgreSQL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pgcrypto') THEN
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    END IF;
END $$;

-- Đảm bảo tương thích 100% trên cả Supabase Cloud và PostgreSQL Local / PGlite Test
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        CREATE TABLE auth.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid') THEN
        EXECUTE 'CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $fn$ SELECT NULLIF(current_setting(''request.jwt.claim.sub'', true), '''')::UUID; $fn$;';
    END IF;
END $$;

-- =============================================================================
-- 1. NHÓM BẢNG NGƯỜI DÙNG & PHÂN QUYỀN (TAIKHOAN, TOURIST, LOCALGUIDE, ADMIN)
-- =============================================================================

-- 1.1. Bảng TAIKHOAN (Liên kết 1-1 với auth.users của Supabase Auth)
CREATE TABLE IF NOT EXISTS public.tai_khoan (
    ma_tai_khoan SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    so_dien_thoai VARCHAR(15) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL DEFAULT 'SUPABASE_AUTH_MANAGED',
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (trang_thai IN ('Active', 'Locked', 'Inactive')),
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    loai_tai_khoan VARCHAR(20) NOT NULL
        CHECK (loai_tai_khoan IN ('Tourist', 'LocalGuide', 'Admin')),
    so_lan_vi_pham INT NOT NULL DEFAULT 0
        CHECK (so_lan_vi_pham >= 0),
    anh_dai_dien VARCHAR(500) NULL
);

COMMENT ON TABLE public.tai_khoan IS 'Thực thể TAIKHOAN trong ERD: Quản lý thông tin định danh và trạng thái của cả 3 vai trò Tourist, LocalGuide, Admin.';

-- 1.2. Bảng TOURIST (Kế thừa 1-1 từ TAIKHOAN)
CREATE TABLE IF NOT EXISTS public.tourist (
    ma_tai_khoan INT PRIMARY KEY REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ngon_ngu_giao_dien VARCHAR(10) DEFAULT 'vi',
    quoc_tich VARCHAR(100) DEFAULT 'Việt Nam'
);

COMMENT ON TABLE public.tourist IS 'Thực thể TOURIST trong ERD: Lưu thông tin riêng của Du khách.';

-- 1.3. Bảng LOCALGUIDE (Kế thừa 1-1 từ TAIKHOAN, lưu hồ sơ & đơn giá theo giờ BR-02)
CREATE TABLE IF NOT EXISTS public.local_guide (
    ma_tai_khoan INT PRIMARY KEY REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    khau_hieu VARCHAR(255) NULL,
    gioi_thieu TEXT NULL,
    anh_chan_dung VARCHAR(500) NULL,
    anh_bia VARCHAR(500) NULL,
    gia_theo_gio NUMERIC(12, 2) NOT NULL DEFAULT 200000
        CHECK (gia_theo_gio >= 80000 AND gia_theo_gio <= 500000),
    so_nam_kinh_nghiem INT NOT NULL DEFAULT 1
        CHECK (so_nam_kinh_nghiem >= 0),
    trang_thai_xac_minh VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (trang_thai_xac_minh IN ('Pending', 'Verified', 'Rejected')),
    avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00
        CHECK (avg_rating >= 0 AND avg_rating <= 5),
    tong_so_danh_gia INT NOT NULL DEFAULT 0
        CHECK (tong_so_danh_gia >= 0),
    tong_chuyen_hoan_thanh INT NOT NULL DEFAULT 0
        CHECK (tong_chuyen_hoan_thanh >= 0),
    ty_le_phan_hoi INT NOT NULL DEFAULT 100
        CHECK (ty_le_phan_hoi BETWEEN 0 AND 100),
    thoi_gian_phan_hoi VARCHAR(100) DEFAULT 'Thường phản hồi trong 15 phút',
    ngan_hang VARCHAR(100) NULL,
    so_tai_khoan_ngan_hang VARCHAR(50) NULL,
    chu_tai_khoan_ngan_hang VARCHAR(100) NULL
);

COMMENT ON TABLE public.local_guide IS 'Thực thể LOCALGUIDE trong ERD: Hồ sơ chuyên môn, đơn giá theo giờ (80.000đ - 500.000đ theo BR-02) và trạng thái xác minh KYC (BR-01).';

-- 1.4. Bảng ADMIN (Kế thừa 1-1 từ TAIKHOAN)
CREATE TABLE IF NOT EXISTS public.admin (
    ma_tai_khoan INT PRIMARY KEY REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    quyen_han VARCHAR(100) NOT NULL DEFAULT 'SUPER_ADMIN',
    ngay_tao_ho_so TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin IS 'Thực thể ADMIN trong ERD: Quản trị viên vận hành nền tảng.';

-- =============================================================================
-- 2. NHÓM BẢNG DANH MỤC & LIÊN KẾT N-N CỦA HDV (CHUYEN_MON, NGON_NGU, KHUVUC)
-- =============================================================================

-- 2.1. Thực thể CHUYEN_MON
CREATE TABLE IF NOT EXISTS public.chuyen_mon (
    ma_chuyen_mon SERIAL PRIMARY KEY,
    ten_chuyen_mon VARCHAR(100) NOT NULL UNIQUE,
    mo_ta VARCHAR(500) NULL
);

-- 2.2. Thực thể NGON_NGU
CREATE TABLE IF NOT EXISTS public.ngon_ngu (
    ma_ngon_ngu SERIAL PRIMARY KEY,
    ten_ngon_ngu VARCHAR(100) NOT NULL UNIQUE,
    ma_ngon_ngu_iso VARCHAR(10) UNIQUE
);

-- 2.3. Thực thể KHUVUC (Địa danh tại Đà Nẵng & phụ cận)
CREATE TABLE IF NOT EXISTS public.khu_vuc (
    ma_khu_vuc SERIAL PRIMARY KEY,
    ten_khu_vuc VARCHAR(150) NOT NULL UNIQUE,
    mo_ta VARCHAR(500) NULL,
    anh_khu_vuc VARCHAR(500) NULL
);

-- 2.4. Bảng liên kết GUIDE_CHUYEN_MON
CREATE TABLE IF NOT EXISTS public.guide_chuyen_mon (
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    ma_chuyen_mon INT NOT NULL REFERENCES public.chuyen_mon(ma_chuyen_mon) ON DELETE CASCADE,
    PRIMARY KEY (ma_guide, ma_chuyen_mon)
);

-- 2.5. Bảng liên kết GUIDE_NGON_NGU
CREATE TABLE IF NOT EXISTS public.guide_ngon_ngu (
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    ma_ngon_ngu INT NOT NULL REFERENCES public.ngon_ngu(ma_ngon_ngu) ON DELETE CASCADE,
    PRIMARY KEY (ma_guide, ma_ngon_ngu)
);

-- 2.6. Bảng liên kết GUIDE_KHUVUC
CREATE TABLE IF NOT EXISTS public.guide_khu_vuc (
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    ma_khu_vuc INT NOT NULL REFERENCES public.khu_vuc(ma_khu_vuc) ON DELETE CASCADE,
    PRIMARY KEY (ma_guide, ma_khu_vuc)
);

-- =============================================================================
-- 3. NHÓM BẢNG THẨM ĐỊNH ĐỊNH DANH KYC (KYCSUBMISSION & KYC_FILE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.kyc_submission (
    ma_kyc SERIAL PRIMARY KEY,
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    ma_admin INT NULL REFERENCES public.admin(ma_tai_khoan) ON DELETE SET NULL,
    so_cccd VARCHAR(20) NOT NULL,
    loai_giay_to VARCHAR(100) NOT NULL DEFAULT 'CCCD gắn chip & Thẻ HDV',
    tep_giay_to VARCHAR(500) NOT NULL,
    ngan_hang VARCHAR(100) NULL,
    so_tai_khoan_ngan_hang VARCHAR(50) NULL,
    chu_tai_khoan_ngan_hang VARCHAR(100) NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (trang_thai IN ('Pending', 'Approved', 'Rejected')),
    ngay_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ngay_tham_dinh TIMESTAMPTZ NULL,
    ghi_chu_tham_dinh VARCHAR(1000) NULL
);

COMMENT ON TABLE public.kyc_submission IS 'Thực thể KYCSUBMISSION trong ERD (UC.02, UC.05/UC.09, UC.10, BR-01).';

CREATE TABLE IF NOT EXISTS public.kyc_file (
    ma_tep SERIAL PRIMARY KEY,
    ma_kyc INT NOT NULL REFERENCES public.kyc_submission(ma_kyc) ON DELETE CASCADE,
    loai_tai_lieu VARCHAR(50) NOT NULL
        CHECK (loai_tai_lieu IN ('CCCD_FRONT', 'CCCD_BACK', 'GUIDE_CARD', 'LANGUAGE_CERT')),
    ten_tai_lieu VARCHAR(255) NOT NULL,
    duong_dan_url VARCHAR(500) NOT NULL,
    ngay_tai_len TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. NHÓM BẢNG CẤU HÌNH PHÍ SÀN & CHÍNH SÁCH HỦY (FEE_CONFIG, CANCELLATION_POLICY)
-- =============================================================================

-- 4.1. Thực thể FEE_CONFIG (UC.29, BR-13: 10% đến 15%)
CREATE TABLE IF NOT EXISTS public.fee_config (
    ma_cau_hinh SERIAL PRIMARY KEY,
    ma_admin INT NOT NULL REFERENCES public.admin(ma_tai_khoan) ON DELETE RESTRICT,
    fee_rate NUMERIC(5, 4) NOT NULL
        CHECK (fee_rate >= 0.1000 AND fee_rate <= 0.1500),
    ghi_chu VARCHAR(500) NULL,
    ngay_hieu_luc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.fee_config IS 'Thực thể FEE_CONFIG trong ERD: Lưu lịch sử cấu hình tỷ lệ phí nền tảng (10% - 15% theo BR-13).';

-- 4.2. Thực thể CANCELLATION_POLICY (Bảng bậc phạt hoàn/hủy theo Delta T - BR-06, BR-07)
CREATE TABLE IF NOT EXISTS public.cancellation_policy (
    ma_chinh_sach SERIAL PRIMARY KEY,
    ten_muc_huy VARCHAR(100) NOT NULL,
    delta_t_toi_thieu_gio NUMERIC(8, 2) NOT NULL,
    delta_t_toi_da_gio NUMERIC(8, 2) NULL,
    ty_le_phat_coc NUMERIC(5, 4) NOT NULL CHECK (ty_le_phat_coc BETWEEN 0 AND 1),
    ty_le_hoan_coc NUMERIC(5, 4) NOT NULL CHECK (ty_le_hoan_coc BETWEEN 0 AND 1),
    mo_ta VARCHAR(500) NOT NULL
);

COMMENT ON TABLE public.cancellation_policy IS 'Chính sách hoàn/phạt cọc chuẩn theo Delta T (>48h: phạt 0%, 24h-48h: phạt 50%, <24h: phạt 100%).';

-- =============================================================================
-- 5. NHÓM BẢNG LỊCH RẢNH & KHUNG GIỜ (AVAILABILITY_SLOT)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.availability_slot (
    ma_khung_gio SERIAL PRIMARY KEY,
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    bat_dau TIMESTAMPTZ NOT NULL,
    ket_thuc TIMESTAMPTZ NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'Available'
        CHECK (trang_thai IN ('Available', 'Hold', 'Busy', 'Unavailable')),
    hold_expires_at TIMESTAMPTZ NULL,
    held_by_booking_id INT NULL,
    CONSTRAINT chk_slot_time_valid CHECK (ket_thuc > bat_dau),
    -- Ràng buộc chống tạo 2 khung giờ trùng nhau cho cùng 1 HDV
    CONSTRAINT uq_guide_slot_time UNIQUE (ma_guide, bat_dau, ket_thuc)
);

CREATE INDEX IF NOT EXISTS idx_availability_slot_guide_time
    ON public.availability_slot(ma_guide, bat_dau, trang_thai);
CREATE INDEX IF NOT EXISTS idx_availability_slot_hold_expiry
    ON public.availability_slot(trang_thai, hold_expires_at)
    WHERE trang_thai = 'Hold';

COMMENT ON TABLE public.availability_slot IS 'Thực thể AVAILABILITY_SLOT trong ERD: Quản lý khung giờ rảnh của HDV (Available, Hold 15 phút, Busy).';

-- =============================================================================
-- 6. NHÓM BẢNG ĐƠN ĐẶT LỊCH, THỎA THUẬN, NHẬT KÝ & HỦY ĐƠN
-- =============================================================================

-- 6.1. Thực thể BOOKING
CREATE TABLE IF NOT EXISTS public.booking (
    ma_booking SERIAL PRIMARY KEY,
    ma_hien_thi VARCHAR(30) UNIQUE,
    ma_tourist INT NOT NULL REFERENCES public.tourist(ma_tai_khoan) ON DELETE RESTRICT,
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE RESTRICT,
    ma_khung_gio INT NOT NULL REFERENCES public.availability_slot(ma_khung_gio) ON DELETE RESTRICT,
    thoi_gian_bat_dau TIMESTAMPTZ NOT NULL,
    thoi_gian_ket_thuc TIMESTAMPTZ NOT NULL,
    dia_diem_hen VARCHAR(500) NOT NULL,
    so_luong_khach INT NOT NULL DEFAULT 1
        CHECK (so_luong_khach > 0),
    ghi_chu_yeu_cau VARCHAR(1000) NOT NULL,
    gia_theo_gio_chot NUMERIC(12, 2) NOT NULL
        CHECK (gia_theo_gio_chot >= 80000 AND gia_theo_gio_chot <= 500000),
    tong_so_gio NUMERIC(8, 2) GENERATED ALWAYS AS (
        ROUND((EXTRACT(EPOCH FROM (thoi_gian_ket_thuc - thoi_gian_bat_dau)) / 3600.0)::NUMERIC, 2)
    ) STORED,
    fee_rate_chot NUMERIC(5, 4) NOT NULL
        CHECK (fee_rate_chot >= 0.1000 AND fee_rate_chot <= 0.1500),
    tong_tien NUMERIC(14, 2) NOT NULL CHECK (tong_tien >= 0),
    tien_coc_30 NUMERIC(14, 2) NOT NULL CHECK (tien_coc_30 >= 0),
    tien_con_lai_70 NUMERIC(14, 2) NOT NULL CHECK (tien_con_lai_70 >= 0),
    phuong_thuc_70 VARCHAR(20) NULL
        CHECK (phuong_thuc_70 IS NULL OR phuong_thuc_70 IN ('Online', 'Cash')),
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pending_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    thoi_diem_chap_nhan TIMESTAMPTZ NULL,
    hold_expires_at TIMESTAMPTZ NULL,
    thoi_diem_xac_nhan_coc TIMESTAMPTZ NULL,
    thoi_diem_gui_yeu_cau_hoan_thanh TIMESTAMPTZ NULL,
    completion_auto_confirm_at TIMESTAMPTZ NULL,
    thoi_diem_hoan_thanh TIMESTAMPTZ NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (booking_status IN (
            'Pending',
            'WaitingPayment',
            'Confirmed',
            'Completed',
            'Cancelled',
            'Disputed'
        )),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Unpaid'
        CHECK (payment_status IN (
            'Unpaid',
            'WaitingDeposit',
            'Deposited',
            'WaitingFinal',
            'WaitingReconcile',
            'Paid',
            'WaitingRefund',
            'Refunded'
        )),
    CONSTRAINT chk_booking_time_valid CHECK (thoi_gian_ket_thuc > thoi_gian_bat_dau)
);

CREATE INDEX IF NOT EXISTS idx_booking_tourist ON public.booking(ma_tourist, ngay_tao DESC);
CREATE INDEX IF NOT EXISTS idx_booking_guide ON public.booking(ma_guide, ngay_tao DESC);
CREATE INDEX IF NOT EXISTS idx_booking_status ON public.booking(booking_status, payment_status);

COMMENT ON TABLE public.booking IS 'Thực thể BOOKING trong ERD: Quản lý vòng đời đơn đặt lịch với 2 trạng thái độc lập booking_status & payment_status.';

-- Trigger tự sinh mã hiển thị BK-100x nếu chưa truyền
CREATE OR REPLACE FUNCTION public.trg_set_booking_display_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.ma_hien_thi IS NULL OR BTRIM(NEW.ma_hien_thi) = '' THEN
        NEW.ma_hien_thi := 'BK-' || (1000 + NEW.ma_booking)::TEXT;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_booking_code ON public.booking;
CREATE TRIGGER before_insert_booking_code
BEFORE INSERT ON public.booking
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_booking_display_code();

-- 6.2. Thực thể SERVICE_AGREEMENT (Thỏa thuận dịch vụ điện tử - BR-10)
CREATE TABLE IF NOT EXISTS public.service_agreement (
    ma_thoa_thuan SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL UNIQUE REFERENCES public.booking(ma_booking) ON DELETE CASCADE,
    pham_vi_dich_vu VARCHAR(1000) NOT NULL,
    dia_diem VARCHAR(500) NOT NULL,
    gia_theo_gio_chot NUMERIC(12, 2) NOT NULL CHECK (gia_theo_gio_chot >= 0),
    tong_gia_tri_chot NUMERIC(14, 2) NOT NULL CHECK (tong_gia_tri_chot >= 0),
    tien_coc_chot NUMERIC(14, 2) NOT NULL CHECK (tien_coc_chot >= 0),
    tien_con_lai_chot NUMERIC(14, 2) NOT NULL CHECK (tien_con_lai_chot >= 0),
    phuong_thuc_thanh_toan VARCHAR(30) NOT NULL DEFAULT 'Online',
    chinh_sach_huy VARCHAR(1000) NOT NULL,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.service_agreement IS 'Thực thể SERVICE_AGREEMENT trong ERD: Tự động khởi tạo khi khách thanh toán cọc 30% thành công (BR-10).';

-- 6.3. Thực thể CANCELLATION_RECORD (Bản ghi hủy & đối soát phạt theo Delta T - BR-06, BR-07)
CREATE TABLE IF NOT EXISTS public.cancellation_record (
    ma_huy SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL UNIQUE REFERENCES public.booking(ma_booking) ON DELETE CASCADE,
    ngay_huy TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ben_huy VARCHAR(20) NOT NULL
        CHECK (ben_huy IN ('Tourist', 'LocalGuide', 'Admin', 'System')),
    ly_do VARCHAR(1000) NOT NULL,
    ty_le_phat_coc NUMERIC(5, 4) NOT NULL
        CHECK (ty_le_phat_coc BETWEEN 0 AND 1),
    so_gio_con_lai NUMERIC(8, 2) NOT NULL
        CHECK (so_gio_con_lai >= 0),
    tien_phat NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (tien_phat >= 0),
    tien_hoan NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (tien_hoan >= 0),
    phi_san_giu NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (phi_san_giu >= 0),
    tien_boi_thuong_guide NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (tien_boi_thuong_guide >= 0)
);

COMMENT ON TABLE public.cancellation_record IS 'Thực thể CANCELLATION_RECORD trong ERD: Lưu chi tiết Delta T, tỷ lệ phạt, tiền hoàn khách và tiền bồi thường HDV.';

-- 6.4. Thực thể BOOKING_LOG (Nhật ký sự kiện đơn hàng - BR-11)
CREATE TABLE IF NOT EXISTS public.booking_log (
    ma_nhat_ky SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL REFERENCES public.booking(ma_booking) ON DELETE CASCADE,
    su_kien VARCHAR(500) NOT NULL,
    thoi_diem TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    nguoi_thuc_hien INT NULL REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_log_booking ON public.booking_log(ma_booking, thoi_diem ASC);

-- =============================================================================
-- 7. NHÓM BẢNG THANH TOÁN, VÍ HDV, BÚT TOÁN VÍ & YÊU CẦU RÚT TIỀN
-- =============================================================================

-- 7.1. Thực thể PAYMENT_TRANSACTION
CREATE TABLE IF NOT EXISTS public.payment_transaction (
    ma_giao_dich SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL REFERENCES public.booking(ma_booking) ON DELETE RESTRICT,
    loai_giao_dich VARCHAR(30) NOT NULL
        CHECK (loai_giao_dich IN ('Deposit', 'FinalPayment', 'Refund')),
    phuong_thuc VARCHAR(30) NOT NULL
        CHECK (phuong_thuc IN ('Online', 'Cash')),
    cong_thanh_toan VARCHAR(50) DEFAULT 'VNPAY',
    so_tien NUMERIC(14, 2) NOT NULL
        CHECK (so_tien >= 0),
    trang_thai VARCHAR(30) NOT NULL
        CHECK (trang_thai IN ('Pending', 'Success', 'Failed', 'Refunded')),
    ma_tham_chieu_cong VARCHAR(100) NULL,
    thoi_gian_giao_dich TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_booking ON public.payment_transaction(ma_booking, thoi_gian_giao_dich DESC);

-- 7.2. Thực thể WALLET (Mỗi Guide có duy nhất 1 ví)
CREATE TABLE IF NOT EXISTS public.wallet (
    ma_vi SERIAL PRIMARY KEY,
    ma_guide INT NOT NULL UNIQUE REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    so_du NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (so_du >= 0),
    so_du_kha_dung NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (so_du_kha_dung >= 0),
    so_du_cho_rut NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (so_du_cho_rut >= 0),
    tong_da_rut NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (tong_da_rut >= 0),
    cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.wallet IS 'Thực thể WALLET trong ERD: Quản lý số dư tổng và số dư khả dụng của Hướng dẫn viên.';

-- 7.3. Thực thể WALLET_TRANSACTION (Sổ phụ biến động số dư ví - BR-13)
CREATE TABLE IF NOT EXISTS public.wallet_transaction (
    ma_but_toan SERIAL PRIMARY KEY,
    ma_vi INT NOT NULL REFERENCES public.wallet(ma_vi) ON DELETE RESTRICT,
    ma_booking INT NULL REFERENCES public.booking(ma_booking) ON DELETE RESTRICT,
    loai_but_toan VARCHAR(30) NOT NULL
        CHECK (loai_but_toan IN (
            'CreditOnlineSettlement',
            'CreditCashSettlement',
            'CreditCancelPenalty',
            'CreditDisputeRuling',
            'DebitPayout',
            'RefundPayoutRejected'
        )),
    so_tien NUMERIC(14, 2) NOT NULL
        CHECK (so_tien >= 0),
    phi_san NUMERIC(14, 2) NOT NULL DEFAULT 0
        CHECK (phi_san >= 0),
    so_du_sau_but_toan NUMERIC(14, 2) NOT NULL DEFAULT 0,
    cong_thuc_minh_hoa VARCHAR(255) NULL,
    mo_ta VARCHAR(500) NULL,
    ngay_tao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_vi ON public.wallet_transaction(ma_vi, ngay_tao DESC);

-- 7.4. Thực thể PAYOUT_REQUEST (Yêu cầu rút tiền tối thiểu 200.000đ - UC.22, UC.23, BR-09)
CREATE TABLE IF NOT EXISTS public.payout_request (
    ma_rut_tien SERIAL PRIMARY KEY,
    ma_vi INT NOT NULL REFERENCES public.wallet(ma_vi) ON DELETE RESTRICT,
    ma_admin INT NULL REFERENCES public.admin(ma_tai_khoan) ON DELETE SET NULL,
    so_tien NUMERIC(14, 2) NOT NULL
        CHECK (so_tien >= 200000),
    ngan_hang VARCHAR(100) NOT NULL,
    so_tai_khoan_nhan VARCHAR(50) NOT NULL,
    chu_tai_khoan_nhan VARCHAR(100) NOT NULL DEFAULT '',
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (trang_thai IN ('Pending', 'Approved', 'Rejected', 'Completed')),
    ma_tham_chieu_unc VARCHAR(100) NULL,
    ghi_chu_admin VARCHAR(500) NULL,
    ngay_yeu_cau TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ngay_xu_ly TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_payout_request_vi ON public.payout_request(ma_vi, ngay_yeu_cau DESC);

-- =============================================================================
-- 8. NHÓM BẢNG ĐÁNH GIÁ, KHIẾU NẠI, THÔNG BÁO & TIN NHẮN
-- =============================================================================

-- 8.1. Thực thể REVIEW (Mỗi Booking tối đa 1 đánh giá - UC.26, BR-09)
CREATE TABLE IF NOT EXISTS public.review (
    ma_danh_gia SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL UNIQUE REFERENCES public.booking(ma_booking) ON DELETE CASCADE,
    ma_tourist INT NOT NULL REFERENCES public.tourist(ma_tai_khoan) ON DELETE CASCADE,
    ma_guide INT NOT NULL REFERENCES public.local_guide(ma_tai_khoan) ON DELETE CASCADE,
    so_sao SMALLINT NOT NULL
        CHECK (so_sao BETWEEN 1 AND 5),
    nhan_xet VARCHAR(1000) NULL,
    ngay_danh_gia TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_guide ON public.review(ma_guide, ngay_danh_gia DESC);

-- 8.2. Thực thể COMPLAINT (Khiếu nại & Tranh chấp - UC.19, UC.27, BR-12)
CREATE TABLE IF NOT EXISTS public.complaint (
    ma_khieu_nai SERIAL PRIMARY KEY,
    ma_booking INT NOT NULL UNIQUE REFERENCES public.booking(ma_booking) ON DELETE CASCADE,
    ma_tai_khoan INT NOT NULL REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE RESTRICT,
    ma_admin INT NULL REFERENCES public.admin(ma_tai_khoan) ON DELETE SET NULL,
    ly_do VARCHAR(500) NOT NULL,
    mo_ta VARCHAR(2000) NOT NULL,
    tep_bang_chung VARCHAR(500) NULL,
    trang_thai VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (trang_thai IN ('Pending', 'Processing', 'Resolved', 'Rejected')),
    phan_quyet_loi VARCHAR(30) NULL
        CHECK (phan_quyet_loi IS NULL OR phan_quyet_loi IN ('GUIDE_FAULT', 'TOURIST_FAULT')),
    ket_qua_xu_ly VARCHAR(1000) NULL,
    ngay_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ngay_xu_ly TIMESTAMPTZ NULL
);

-- 8.3. Thực thể NOTIFICATION (Thông báo thời gian thực - UC.05, UC.15, UC.16)
CREATE TABLE IF NOT EXISTS public.notification (
    ma_thong_bao SERIAL PRIMARY KEY,
    ma_tai_khoan INT NOT NULL REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    tieu_de VARCHAR(255) NOT NULL DEFAULT 'Thông báo hệ thống',
    noi_dung VARCHAR(1000) NOT NULL,
    loai_thong_bao VARCHAR(30) NOT NULL DEFAULT 'BOOKING'
        CHECK (loai_thong_bao IN ('BOOKING', 'PAYMENT', 'DISPUTE', 'WALLET', 'KYC', 'SYSTEM')),
    ma_booking INT NULL REFERENCES public.booking(ma_booking) ON DELETE SET NULL,
    ngay_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    da_doc BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON public.notification(ma_tai_khoan, ngay_gui DESC);

-- 8.4. Thực thể MESSAGE (Tin nhắn trao đổi lịch trình giữa Tourist & Guide)
CREATE TABLE IF NOT EXISTS public.message (
    ma_tin_nhan SERIAL PRIMARY KEY,
    ma_booking INT NULL REFERENCES public.booking(ma_booking) ON DELETE SET NULL,
    ma_nguoi_gui INT NOT NULL REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ma_nguoi_nhan INT NOT NULL REFERENCES public.tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    noi_dung VARCHAR(2000) NOT NULL,
    da_doc BOOLEAN NOT NULL DEFAULT FALSE,
    ngay_gui TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_participants ON public.message(ma_nguoi_gui, ma_nguoi_nhan, ngay_gui ASC);

-- =============================================================================
-- 9. KHỞI TẠO SUPABASE STORAGE BUCKETS & REALTIME PUBLICATION
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES
            ('kyc-documents', 'kyc-documents', false),
            ('complaint-evidences', 'complaint-evidences', false),
            ('avatars', 'avatars', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Bỏ qua nếu môi trường PostgreSQL thuần không có schema storage
    NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE
            public.booking,
            public.availability_slot,
            public.notification,
            public.message,
            public.wallet;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
