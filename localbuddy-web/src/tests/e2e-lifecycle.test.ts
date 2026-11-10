import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { SandboxPaymentProvider } from '../services/paymentProvider';
import { formatMoney, formatHourlyRate } from '../utils/money';
import { calcBookingAmounts, calcPenaltySplit } from '../features/payment/calc';

describe('LocalBuddy Đà Nẵng — Kiểm thử E2E Vòng Đời Trọn Vẹn 3 Vai Trò & PaymentProvider Sandbox (Giai đoạn 4–6)', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();
    const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
    const mig1 = fs.readFileSync(
      path.join(migrationsDir, '20261108000001_init_schema.sql'),
      'utf-8'
    );
    const mig2 = fs.readFileSync(
      path.join(migrationsDir, '20261108000002_rls_policies.sql'),
      'utf-8'
    );
    const mig3 = fs.readFileSync(
      path.join(migrationsDir, '20261108000003_server_functions_and_cron.sql'),
      'utf-8'
    );
    const seedSql = fs.readFileSync(
      path.resolve(__dirname, 'fixtures/test-seed.sql'),
      'utf-8'
    );

    await db.exec(mig1);
    await db.exec(mig2);
    await db.exec(mig3);
    await db.exec(seedSql);
  });

  afterAll(async () => {
    await db.close();
  });

  it('1. Luồng trọn vẹn đầu-cuối: Đăng ký 3 vai trò -> HDV nộp KYC -> Admin duyệt -> Mở lịch -> Tourist đặt lịch -> HDV chấp nhận (Giữ 15p) -> Cọc 30% -> Hoàn thành -> Tất toán 70% -> Đánh giá -> HDV rút tiền -> Admin giải ngân', async () => {
    const gateway = new SandboxPaymentProvider();

    // BƯỚC 1: Đăng ký mới tài khoản Du khách (Tourist) & Hướng dẫn viên (LocalGuide - Pending KYC)
    const touristInsert = await db.query<{ ma_tai_khoan: number }>(`
      INSERT INTO public.tai_khoan (ho_ten, email, so_dien_thoai, mat_khau_hash, trang_thai, loai_tai_khoan)
      VALUES ('Trần Ngọc Bảo Trân', 'baotran.e2e@gmail.com', '0905888991', 'hashed_pw', 'Active', 'Tourist')
      RETURNING ma_tai_khoan;
    `);
    const touristId = touristInsert.rows[0].ma_tai_khoan;
    await db.query(
      `INSERT INTO public.tourist (ma_tai_khoan, ngon_ngu_giao_dien, quoc_tich) VALUES ($1, 'vi', 'Việt Nam');`,
      [touristId]
    );

    const guideInsert = await db.query<{ ma_tai_khoan: number }>(`
      INSERT INTO public.tai_khoan (ho_ten, email, so_dien_thoai, mat_khau_hash, trang_thai, loai_tai_khoan)
      VALUES ('Lê Đình Quang Vũ', 'quangvu.guide.e2e@gmail.com', '0905888992', 'hashed_pw', 'Active', 'LocalGuide')
      RETURNING ma_tai_khoan;
    `);
    const guideId = guideInsert.rows[0].ma_tai_khoan;
    await db.query(
      `INSERT INTO public.local_guide (ma_tai_khoan, khau_hieu, gioi_thieu, gia_theo_gio, so_nam_kinh_nghiem, trang_thai_xac_minh)
       VALUES ($1, 'Thổ địa Sơn Trà & Cầu Rồng', 'Chuyên dẫn tour nhiếp ảnh bình minh Sơn Trà.', 250000, 4, 'Pending');`,
      [guideId]
    );
    await db.query(
      `INSERT INTO public.wallet (ma_guide, so_du, so_du_kha_dung) VALUES ($1, 0, 0);`,
      [guideId]
    );

    // BƯỚC 2: Tạo khung giờ 4 tiếng (08:00 - 12:00) và kiểm tra BR-01 chặn đặt lịch khi HDV chưa duyệt KYC
    const slotInsert = await db.query<{ ma_khung_gio: number }>(
      `INSERT INTO public.availability_slot (ma_guide, bat_dau, ket_thuc, trang_thai)
       VALUES ($1, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 4 hours', 'Available')
       RETURNING ma_khung_gio;`,
      [guideId]
    );
    const slotId = slotInsert.rows[0].ma_khung_gio;

    await expect(
      db.query(
        `SELECT * FROM public.fn_create_booking($1, $2, $3, 'Đầu Cầu Rồng, Đà Nẵng', 2, 'Chụp ảnh Cầu Rồng & Sơn Trà', FALSE);`,
        [touristId, guideId, slotId]
      )
    ).rejects.toThrow(/KYC/);

    // BƯỚC 3: HDV nộp hồ sơ KYC -> Admin (ma_tai_khoan = 10) phê duyệt KYC (UC.09 -> UC.10)
    const kycInsert = await db.query<{ ma_kyc: number }>(
      `INSERT INTO public.kyc_submission (
        ma_guide, so_cccd, loai_giay_to, tep_giay_to,
        ngan_hang, so_tai_khoan_ngan_hang, chu_tai_khoan_ngan_hang, trang_thai
      ) VALUES (
        $1, '048099008877', 'CCCD gắn chip & Thẻ HDV Nội địa', 'https://storage.localbuddy.vn/kyc/front.jpg',
        'Vietcombank - CN Đà Nẵng', '0041000998877', 'LE DINH QUANG VU', 'Pending'
      ) RETURNING ma_kyc;`,
      [guideId]
    );
    const kycId = kycInsert.rows[0].ma_kyc;

    const kycApproved = await db.query<{ trang_thai: string }>(
      `SELECT trang_thai FROM public.fn_admin_review_kyc($1, 10, TRUE, 'Hồ sơ KYC hợp lệ 100%');`,
      [kycId]
    );
    expect(kycApproved.rows[0].trang_thai).toBe('Approved');

    // BƯỚC 4: Tourist đặt lịch 4 giờ x 250.000 ₫/giờ = 1.000.000 ₫ (Cọc 30% = 300.000 ₫, Còn lại 70% = 700.000 ₫)
    const bookingRes = await db.query<{
      ma_booking: number;
      tong_tien: string;
      tien_coc_30: string;
      tien_con_lai_70: string;
      booking_status: string;
    }>(
      `SELECT ma_booking, tong_tien, tien_coc_30, tien_con_lai_70, booking_status
       FROM public.fn_create_booking($1, $2, $3, 'Đầu Cầu Rồng, Hải Châu, Đà Nẵng', 2, 'Đi Sơn Trà ngắm Voọc và uống cà phê muối', FALSE);`,
      [touristId, guideId, slotId]
    );
    const bookingId = bookingRes.rows[0].ma_booking;
    expect(Number(bookingRes.rows[0].tong_tien)).toBe(1000000);
    expect(Number(bookingRes.rows[0].tien_coc_30)).toBe(300000);
    expect(Number(bookingRes.rows[0].tien_con_lai_70)).toBe(700000);
    expect(bookingRes.rows[0].booking_status).toBe('Pending');

    // BƯỚC 5: HDV bấm Chấp nhận đơn -> Khóa nguyên tử khung giờ HOLD 15 phút (UC.13, BR-05)
    const acceptedRes = await db.query<{ booking_status: string; payment_status: string }>(
      `SELECT booking_status, payment_status FROM public.fn_guide_respond_booking($1, $2, TRUE, NULL);`,
      [bookingId, guideId]
    );
    expect(acceptedRes.rows[0].booking_status).toBe('WaitingPayment');
    expect(acceptedRes.rows[0].payment_status).toBe('WaitingDeposit');

    const slotHoldCheck = await db.query<{ trang_thai: string }>(
      `SELECT trang_thai FROM public.availability_slot WHERE ma_khung_gio = $1;`,
      [slotId]
    );
    expect(slotHoldCheck.rows[0].trang_thai).toBe('Hold');

    // BƯỚC 6: Tourist thanh toán cọc 30% qua SandboxPaymentProvider + ghi nhận Server
    const depCheckout = await gateway.processPayment({
      bookingId: `BK-E2E-${bookingId}`,
      phase: 'DEPOSIT_30',
      amount: 300000,
      gateway: 'VNPAY',
      idempotencyKey: `idem-dep-${bookingId}`,
      sandboxOutcome: 'SUCCESS',
    });
    expect(depCheckout.ok).toBe(true);

    const paidDepRes = await db.query<{ booking_status: string; payment_status: string }>(
      `SELECT booking_status, payment_status FROM public.fn_pay_deposit_30($1, $2, 'VNPAY', $3, TRUE, FALSE);`,
      [bookingId, touristId, depCheckout.transactionRef]
    );
    expect(paidDepRes.rows[0].booking_status).toBe('Confirmed');
    expect(paidDepRes.rows[0].payment_status).toBe('Deposited');

    // BƯỚC 7: HDV báo hoàn thành (UC.17) -> Tourist xác nhận hoàn thành (UC.18) -> Tất toán 70% Online (UC.20)
    await db.query(`SELECT * FROM public.fn_request_completion($1, $2);`, [bookingId, guideId]);
    const completedRes = await db.query<{ booking_status: string; payment_status: string }>(
      `SELECT booking_status, payment_status FROM public.fn_confirm_completion($1, $2);`,
      [bookingId, touristId]
    );
    expect(completedRes.rows[0].booking_status).toBe('Completed');
    expect(completedRes.rows[0].payment_status).toBe('WaitingFinal');

    const finCheckout = await gateway.processPayment({
      bookingId: `BK-E2E-${bookingId}`,
      phase: 'BALANCE_70',
      amount: 700000,
      gateway: 'MOMO',
      idempotencyKey: `idem-fin-${bookingId}`,
      sandboxOutcome: 'SUCCESS',
    });
    expect(finCheckout.ok).toBe(true);

    const feeRateRes = await db.query<{ fee_rate_chot: string }>(
      `SELECT fee_rate_chot FROM public.booking WHERE ma_booking = $1;`,
      [bookingId]
    );
    const feeRate = Number(feeRateRes.rows[0].fee_rate_chot);
    const expectedNet = 1000000 - Math.round(1000000 * feeRate);

    const settledRes = await db.query<{ payment_status: string }>(
      `SELECT payment_status FROM public.fn_settle_final_70($1, 'Online', $2, $3);`,
      [bookingId, touristId, finCheckout.transactionRef]
    );
    expect(settledRes.rows[0].payment_status).toBe('Paid');

    const walletAfterSettle = await db.query<{ so_du_kha_dung: string }>(
      `SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = $1;`,
      [guideId]
    );
    expect(Number(walletAfterSettle.rows[0].so_du_kha_dung)).toBe(expectedNet);

    // BƯỚC 8: Tourist đánh giá 5 sao (UC.26) -> Điểm uy tín HDV tự động cập nhật thành 5.0
    await db.query(
      `SELECT * FROM public.fn_submit_review($1, $2, 5::SMALLINT, 'HDV Quang Vũ cực kỳ nhiệt tình, dẫn đi Sơn Trà săn ảnh Voọc tuyệt đẹp!');`,
      [bookingId, touristId]
    );
    const guideRating = await db.query<{ avg_rating: string; tong_so_danh_gia: number }>(
      `SELECT avg_rating, tong_so_danh_gia FROM public.local_guide WHERE ma_tai_khoan = $1;`,
      [guideId]
    );
    expect(Number(guideRating.rows[0].avg_rating)).toBe(5);
    expect(guideRating.rows[0].tong_so_danh_gia).toBe(1);

    // BƯỚC 9: HDV tạo lệnh rút 500.000 ₫ (>= 200.000 ₫) -> Admin phê duyệt chuyển khoản (UC.22 -> UC.23)
    const payoutReq = await db.query<{ ma_rut_tien: number; trang_thai: string }>(
      `SELECT ma_rut_tien, trang_thai FROM public.fn_request_payout($1, 500000, 'Vietcombank - CN Đà Nẵng', '0041000998877', 'LE DINH QUANG VU');`,
      [guideId]
    );
    expect(payoutReq.rows[0].trang_thai).toBe('Pending');

    const payoutApproved = await db.query<{ trang_thai: string }>(
      `SELECT trang_thai FROM public.fn_admin_process_payout($1, 10, TRUE, 'UNC-VCB-998877', 'Đã chuyển khoản Napas 24/7');`,
      [payoutReq.rows[0].ma_rut_tien]
    );
    expect(payoutApproved.rows[0].trang_thai).toBe('Completed');

    const walletFinal = await db.query<{ so_du_kha_dung: string; tong_da_rut: string }>(
      `SELECT so_du_kha_dung, tong_da_rut FROM public.wallet WHERE ma_guide = $1;`,
      [guideId]
    );
    expect(Number(walletFinal.rows[0].tong_da_rut)).toBe(500000);
    expect(Number(walletFinal.rows[0].so_du_kha_dung)).toBe(expectedNet - 500000);
  });

  it('2. Kiểm tra PaymentProvider Sandbox: Chống thanh toán trùng (Idempotency) & Xử lý lỗi mạng / hủy ngang / hết hạn', async () => {
    const mem: Record<string, string> = {};
    Object.defineProperty(globalThis, 'window', {
      value: {
        sessionStorage: {
          getItem: (k: string) => mem[k] ?? null,
          setItem: (k: string, v: string) => {
            mem[k] = v;
          },
          removeItem: (k: string) => {
            delete mem[k];
          },
        },
      },
      configurable: true,
    });

    const provider = new SandboxPaymentProvider();

    provider.startCheckoutSession({
      bookingId: 'BK-TAB-01',
      phase: 'DEPOSIT_30',
      amount: 270000,
      gateway: 'VNPAY',
    });
    provider.markSessionInterrupted('BK-TAB-01', 'DEPOSIT_30');
    const interrupted = provider.getInterruptedSession('BK-TAB-01', 'DEPOSIT_30');
    expect(interrupted).not.toBeNull();
    expect(interrupted?.gateway).toBe('VNPAY');

    const retryRes = await provider.processPayment({
      bookingId: 'BK-TAB-01',
      phase: 'DEPOSIT_30',
      amount: 270000,
      gateway: 'VNPAY',
      sandboxOutcome: 'FAILED_RETRYABLE',
    });
    expect(retryRes.ok).toBe(false);
    expect(retryRes.status).toBe('FAILED_RETRYABLE');

    const firstPay = await provider.processPayment({
      bookingId: 'BK-TAB-01',
      phase: 'DEPOSIT_30',
      amount: 270000,
      gateway: 'VNPAY',
      sandboxOutcome: 'SUCCESS',
    });
    expect(firstPay.ok).toBe(true);
    expect(provider.getInterruptedSession('BK-TAB-01', 'DEPOSIT_30')).toBeNull();

    const duplicatePay = await provider.processPayment({
      bookingId: 'BK-TAB-01',
      phase: 'DEPOSIT_30',
      amount: 270000,
      gateway: 'MOMO',
      sandboxOutcome: 'SUCCESS',
    });
    expect(duplicatePay.ok).toBe(false);
    expect(duplicatePay.status).toBe('DUPLICATE_BLOCKED');
    expect(duplicatePay.transactionRef).toBe(firstPay.transactionRef);
  });

  it('3. Kiểm tra chuẩn định dạng tiền tệ VNĐ ("250.000 ₫ / giờ") và công thức tiền cọc 30% / phạt hủy ΔT', () => {
    expect(formatMoney(250000)).toBe('250.000 ₫');
    expect(formatHourlyRate(250000)).toBe('250.000 ₫ / giờ');

    const { total, deposit, remaining } = calcBookingAmounts(250000, 4, 0.12);
    expect(total).toBe(1000000);
    expect(deposit).toBe(300000);
    expect(remaining).toBe(700000);

    const tierFree = calcPenaltySplit(300000, 50, 0.12);
    expect(tierFree.penaltyRate).toBe(0);
    expect(tierFree.refundToTourist).toBe(300000);

    const tierHalf = calcPenaltySplit(300000, 36, 0.12);
    expect(tierHalf.penaltyRate).toBe(0.5);
    expect(tierHalf.refundToTourist).toBe(150000);
    expect(tierHalf.platformFeeOnPenalty).toBe(18000);
    expect(tierHalf.guideCompensation).toBe(132000);

    const tierFull = calcPenaltySplit(300000, 10, 0.12);
    expect(tierFull.penaltyRate).toBe(1);
    expect(tierFull.refundToTourist).toBe(0);
    expect(tierFull.guideCompensation).toBe(264000);
  });
});
