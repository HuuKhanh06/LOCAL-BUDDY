import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

describe('LocalBuddy Đà Nẵng — Kiểm thử Hạ tầng PostgreSQL, RLS, Quy tắc Tiền & Chống Đặt Trùng Khung Giờ', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();

    const migrationsDir = path.resolve(__dirname, '../../supabase/migrations');
    const seedPath = path.resolve(__dirname, 'fixtures/test-seed.sql');

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
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    await db.exec(mig1);
    await db.exec(mig2);
    await db.exec(mig3);
    await db.exec(seedSql);
  });

  afterAll(async () => {
    await db.close();
  });

  it('1. Khởi tạo đầy đủ 27 bảng theo ERD và bật Row Level Security (RLS) trên 100% bảng', async () => {
    const res = await db.query<{ tablename: string; rowsecurity: boolean }>(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    expect(res.rows.length).toBe(27);
    for (const row of res.rows) {
      expect(row.rowsecurity, `Bảng ${row.tablename} phải bật RLS`).toBe(true);
    }
  });

  it('2. Kiểm tra RLS theo vai trò (Tourist chỉ thấy đơn của mình, Guide thấy đơn & ví của mình, Admin thấy tất cả, chặn ghi tiền trực tiếp)', async () => {
    // 2.1. Đóng vai Tourist 1 (Dương Đăng Huân)
    await db.exec(`
      BEGIN;
      SET LOCAL ROLE authenticated;
      SET LOCAL app.current_account_id = '1';
    `);
    const touristBookings = await db.query<{ ma_booking: number; ma_tourist: number }>(
      `SELECT ma_booking, ma_tourist FROM public.booking;`
    );
    expect(touristBookings.rows.length).toBeGreaterThan(0);
    expect(touristBookings.rows.every((b) => b.ma_tourist === 1)).toBe(true);

    // Tourist 1 không được thấy ví của bất kỳ HDV nào
    const touristWalletView = await db.query(`SELECT * FROM public.wallet;`);
    expect(touristWalletView.rows.length).toBe(0);

    // Tourist 1 chỉ thấy 5 HDV đã Verified (BR-01), không thấy HDV số 9 đang Pending KYC
    const visibleGuidesForTourist = await db.query<{ ma_tai_khoan: number; trang_thai_xac_minh: string }>(
      `SELECT ma_tai_khoan, trang_thai_xac_minh FROM public.local_guide;`
    );
    expect(visibleGuidesForTourist.rows.length).toBe(5);
    expect(visibleGuidesForTourist.rows.every((g) => g.trang_thai_xac_minh === 'Verified')).toBe(true);

    // Tourist 1 cố tình ghi trực tiếp vào bảng payment_transaction hoặc wallet -> Bị chặn bởi REVOKE / RLS
    await expect(
      db.query(`
        INSERT INTO public.payment_transaction (ma_booking, loai_giao_dich, phuong_thuc, so_tien, trang_thai)
        VALUES (1, 'Deposit', 'Online', 1000, 'Success');
      `)
    ).rejects.toThrow();
    await db.exec(`ROLLBACK;`);

    // 2.2. Đóng vai Guide 4 (Nguyễn Hữu Khanh) -> chỉ thấy ví của chính mình (ma_guide = 4)
    await db.exec(`
      BEGIN;
      SET LOCAL ROLE authenticated;
      SET LOCAL app.current_account_id = '4';
    `);
    const guideWallets = await db.query<{ ma_guide: number; so_du_kha_dung: string }>(
      `SELECT ma_guide, so_du_kha_dung FROM public.wallet;`
    );
    expect(guideWallets.rows.length).toBe(1);
    expect(guideWallets.rows[0].ma_guide).toBe(4);
    await db.exec(`ROLLBACK;`);

    // 2.3. Đóng vai Admin 10 (Lê Văn Hoàng) -> thấy toàn bộ 6 ví và toàn bộ 6 HDV (kể cả Pending KYC)
    await db.exec(`
      BEGIN;
      SET LOCAL ROLE authenticated;
      SET LOCAL app.current_account_id = '10';
    `);
    const adminGuides = await db.query(`SELECT * FROM public.local_guide;`);
    const adminWallets = await db.query(`SELECT * FROM public.wallet;`);
    expect(adminGuides.rows.length).toBe(6);
    expect(adminWallets.rows.length).toBe(6);
    await db.exec(`ROLLBACK;`);
  });

  it('3. Kiểm tra hàm Server tính toán tiền: Đặt cọc 30%, Còn lại 70%, Phí sàn 12%, Quyết toán Ví Online +(G-F) và Tiền mặt +(D-F)', async () => {
    // Đơn 4 giờ x 250.000 ₫/giờ = 1.000.000 ₫, phí sàn 12%
    const res = await db.query<{
      tong_tien: string;
      tien_coc_30: string;
      tien_con_lai_70: string;
      phi_san: string;
      guide_nhan_online: string;
      guide_cong_vi_cash: string;
    }>(`
      SELECT * FROM public.fn_calc_booking_financials(250000, 4, 0.12);
    `);

    const row = res.rows[0];
    expect(Number(row.tong_tien)).toBe(1000000);         // G = 1.000.000 ₫
    expect(Number(row.tien_coc_30)).toBe(300000);        // D = 30% G = 300.000 ₫
    expect(Number(row.tien_con_lai_70)).toBe(700000);    // B = 70% G = 700.000 ₫
    expect(Number(row.phi_san)).toBe(120000);            // F = 12% G = 120.000 ₫
    expect(Number(row.guide_nhan_online)).toBe(880000);  // +(G - F) = +880.000 ₫
    expect(Number(row.guide_cong_vi_cash)).toBe(180000); // +(D - F) = +180.000 ₫ (cộng với 700k tiền mặt = 880k)

    // Kiểm tra chặn đơn giá ngoài khung 80.000 - 500.000 ₫ (BR-02)
    await expect(
      db.query(`SELECT * FROM public.fn_calc_booking_financials(50000, 3, 0.12);`)
    ).rejects.toThrow(/INVALID_HOURLY_RATE/);

    // Kiểm tra chặn phí sàn ngoài khung 10% - 15% (BR-13)
    await expect(
      db.query(`SELECT * FROM public.fn_calc_booking_financials(250000, 3, 0.25);`)
    ).rejects.toThrow(/INVALID_FEE_RATE/);
  });

  it('4. Kiểm tra hàm Server tính hoàn/phạt cọc theo ΔT ở cả 3 bậc (>48h: 0%, 24h-48h: 50%, <24h: 100%) và khi HDV hủy đơn (BR-06, BR-07)', async () => {
    // Bậc 1: Hủy trước 60 giờ (ΔT > 48h) -> Phạt 0%, Hoàn 100% cọc (300.000 ₫)
    const tier1 = await db.query<{
      delta_t_gio: string;
      ty_le_phat_coc: string;
      tien_phat: string;
      tien_hoan: string;
      phi_san_giu: string;
      tien_boi_thuong_guide: string;
    }>(`
      SELECT * FROM public.fn_calc_cancellation_by_delta_t(
        300000,
        0.12,
        '2026-11-15T12:00:00Z'::TIMESTAMPTZ,
        '2026-11-13T00:00:00Z'::TIMESTAMPTZ,
        'Tourist'
      );
    `);
    expect(Number(tier1.rows[0].delta_t_gio)).toBe(60);
    expect(Number(tier1.rows[0].ty_le_phat_coc)).toBe(0);
    expect(Number(tier1.rows[0].tien_phat)).toBe(0);
    expect(Number(tier1.rows[0].tien_hoan)).toBe(300000);
    expect(Number(tier1.rows[0].tien_boi_thuong_guide)).toBe(0);

    // Bậc 2: Hủy trước 30 giờ (24h <= ΔT <= 48h) -> Phạt 50% cọc (150.000 ₫), Hoàn 50% (150.000 ₫)
    // Phí sàn giữ = 150.000 * 12% = 18.000 ₫; Cộng ví HDV = 132.000 ₫
    const tier2 = await db.query<{
      delta_t_gio: string;
      ty_le_phat_coc: string;
      tien_phat: string;
      tien_hoan: string;
      phi_san_giu: string;
      tien_boi_thuong_guide: string;
    }>(`
      SELECT * FROM public.fn_calc_cancellation_by_delta_t(
        300000,
        0.12,
        '2026-11-15T18:00:00Z'::TIMESTAMPTZ,
        '2026-11-14T12:00:00Z'::TIMESTAMPTZ,
        'Tourist'
      );
    `);
    expect(Number(tier2.rows[0].delta_t_gio)).toBe(30);
    expect(Number(tier2.rows[0].ty_le_phat_coc)).toBe(0.5);
    expect(Number(tier2.rows[0].tien_phat)).toBe(150000);
    expect(Number(tier2.rows[0].tien_hoan)).toBe(150000);
    expect(Number(tier2.rows[0].phi_san_giu)).toBe(180000 * 0.1); // 18.000 ₫
    expect(Number(tier2.rows[0].tien_boi_thuong_guide)).toBe(132000);

    // Bậc 3: Hủy trước 10 giờ (ΔT < 24h) -> Phạt 100% cọc (300.000 ₫), Hoàn 0 ₫
    // Phí sàn giữ = 300.000 * 12% = 36.000 ₫; Cộng ví HDV = 264.000 ₫
    const tier3 = await db.query<{
      delta_t_gio: string;
      ty_le_phat_coc: string;
      tien_phat: string;
      tien_hoan: string;
      phi_san_giu: string;
      tien_boi_thuong_guide: string;
    }>(`
      SELECT * FROM public.fn_calc_cancellation_by_delta_t(
        300000,
        0.12,
        '2026-11-15T22:00:00Z'::TIMESTAMPTZ,
        '2026-11-15T12:00:00Z'::TIMESTAMPTZ,
        'Tourist'
      );
    `);
    expect(Number(tier3.rows[0].delta_t_gio)).toBe(10);
    expect(Number(tier3.rows[0].ty_le_phat_coc)).toBe(1);
    expect(Number(tier3.rows[0].tien_phat)).toBe(300000);
    expect(Number(tier3.rows[0].tien_hoan)).toBe(0);
    expect(Number(tier3.rows[0].phi_san_giu)).toBe(36000);
    expect(Number(tier3.rows[0].tien_boi_thuong_guide)).toBe(264000);

    // Bậc 4: HDV hủy đơn sát giờ (ΔT = 5h) -> Khách vẫn được hoàn 100% cọc (300.000 ₫), HDV nhận 0 ₫ (BR-06)
    const guideCancel = await db.query<{
      ty_le_phat_coc: string;
      tien_phat: string;
      tien_hoan: string;
      tien_boi_thuong_guide: string;
    }>(`
      SELECT * FROM public.fn_calc_cancellation_by_delta_t(
        300000,
        0.12,
        '2026-11-15T17:00:00Z'::TIMESTAMPTZ,
        '2026-11-15T12:00:00Z'::TIMESTAMPTZ,
        'LocalGuide'
      );
    `);
    expect(Number(guideCancel.rows[0].ty_le_phat_coc)).toBe(0);
    expect(Number(guideCancel.rows[0].tien_hoan)).toBe(300000);
    expect(Number(guideCancel.rows[0].tien_boi_thuong_guide)).toBe(0);
  });

  it('5. Chống đặt trùng khung giờ khi 2 người bấm cùng lúc (Row-Level Lock FOR UPDATE) & Tự động nhả khung giờ sau 15 phút giữ chỗ', async () => {
    // Khung giờ số 7 của HDV Lê Hoàng Nam (guide 6, giá 300.000 ₫/giờ, 5 giờ = 1.500.000 ₫, cọc 30% = 450.000 ₫) đang Available
    // Hai du khách (Tourist 1 và Tourist 2) cùng bấm đặt và giữ khung giờ số 7 cùng lúc:
    const [attempt1, attempt2] = await Promise.allSettled([
      db.query<{ ma_booking: number; tien_coc_30: string; booking_status: string }>(`
        SELECT ma_booking, tien_coc_30, booking_status
        FROM public.fn_create_booking(
          1, 6, 7,
          'Cổng chính Sun World Bà Nà Hills',
          2,
          'Tham quan Cầu Vàng và Làng Pháp',
          TRUE
        );
      `),
      db.query<{ ma_booking: number; tien_coc_30: string; booking_status: string }>(`
        SELECT ma_booking, tien_coc_30, booking_status
        FROM public.fn_create_booking(
          2, 6, 7,
          'Ga cáp treo Hội An - Bà Nà Hills',
          4,
          'Đi cáp treo và chụp ảnh gia đình',
          TRUE
        );
      `),
    ]);

    // Phải có đúng 1 người thành công (khóa HOLD 15 phút) và 1 người bị từ chối do SLOT_CONFLICT!
    const fulfilled = [attempt1, attempt2].filter((r) => r.status === 'fulfilled');
    const rejected = [attempt1, attempt2].filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/SLOT_CONFLICT/);

    const winnerBooking = (
      fulfilled[0] as PromiseFulfilledResult<{
        rows: { ma_booking: number; tien_coc_30: string; booking_status: string }[];
      }>
    ).value.rows[0];
    expect(Number(winnerBooking.tien_coc_30)).toBe(450000); // 30% của 1.500.000 ₫
    expect(winnerBooking.booking_status).toBe('WaitingPayment');

    // Kiểm tra trạng thái slot 7 trên DB đã chuyển sang Hold
    const slotAfterLock = await db.query<{ trang_thai: string; held_by_booking_id: number }>(`
      SELECT trang_thai, held_by_booking_id FROM public.availability_slot WHERE ma_khung_gio = 7;
    `);
    expect(slotAfterLock.rows[0].trang_thai).toBe('Hold');
    expect(slotAfterLock.rows[0].held_by_booking_id).toBe(winnerBooking.ma_booking);

    // Giả lập hết hạn 15 phút giữ chỗ và chạy Cron Job fn_job_expire_hold_15m()
    await db.query(`
      UPDATE public.booking
      SET hold_expires_at = NOW() - INTERVAL '1 minute'
      WHERE ma_booking = $1;
    `, [winnerBooking.ma_booking]);

    const expiredJobRes = await db.query<{ fn_job_expire_hold_15m: number }>(`
      SELECT public.fn_job_expire_hold_15m();
    `);
    expect(expiredJobRes.rows[0].fn_job_expire_hold_15m).toBeGreaterThanOrEqual(1);

    // Khung giờ số 7 đã tự động được nhả về Available, và đơn của người thứ nhất đã chuyển sang Cancelled
    const slotAfterExpire = await db.query<{ trang_thai: string }>(`
      SELECT trang_thai FROM public.availability_slot WHERE ma_khung_gio = 7;
    `);
    expect(slotAfterExpire.rows[0].trang_thai).toBe('Available');

    // Bây giờ Tourist 2 đặt lại khung giờ số 7 hoàn toàn thành công!
    const retryTourist2 = await db.query<{ ma_booking: number; booking_status: string }>(`
      SELECT ma_booking, booking_status
      FROM public.fn_create_booking(
        2, 6, 7,
        'Ga cáp treo Bà Nà Hills',
        4,
        'Đặt lại sau khi khung giờ được giải phóng',
        TRUE
      );
    `);
    expect(retryTourist2.rows[0].booking_status).toBe('WaitingPayment');
  });

  it('6. Thực thi trọn vẹn vòng đời hủy đơn thực tế trên DB: Cộng tiền phạt cọc vào Ví HDV và ghi bút toán WALLET_TRANSACTION', async () => {
    // Đơn BK-1003 (ma_booking = 3) của Tourist 1 với Guide 4 đang Confirmed + Deposited (Cọc 300.000 ₫, phí sàn 12%)
    // Kiểm tra số dư ví khả dụng của Guide 4 trước khi khách hủy
    const walletBefore = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 4;
    `);
    const balanceBefore = Number(walletBefore.rows[0].so_du_kha_dung);

    // Lấy thời gian bắt đầu của đơn 3, và giả lập khách hủy cách giờ bắt đầu đúng 30 giờ (bậc phạt 50% = 150.000 ₫, phí sàn 18.000 ₫, Guide nhận +132.000 ₫)
    const cancelRes = await db.query<{
      ty_le_phat_coc: string;
      tien_phat: string;
      tien_hoan: string;
      phi_san_giu: string;
      tien_boi_thuong_guide: string;
    }>(`
      SELECT ty_le_phat_coc, tien_phat, tien_hoan, phi_san_giu, tien_boi_thuong_guide
      FROM public.fn_cancel_booking(
        3,
        1,
        'Đoàn có việc đột xuất phải đổi lịch bay về Hà Nội sớm hơn dự kiến.',
        (SELECT thoi_gian_bat_dau - INTERVAL '30 hours' FROM public.booking WHERE ma_booking = 3)
      );
    `);

    expect(Number(cancelRes.rows[0].ty_le_phat_coc)).toBe(0.5);
    expect(Number(cancelRes.rows[0].tien_phat)).toBe(150000);
    expect(Number(cancelRes.rows[0].tien_hoan)).toBe(150000);
    expect(Number(cancelRes.rows[0].phi_san_giu)).toBe(18000);
    expect(Number(cancelRes.rows[0].tien_boi_thuong_guide)).toBe(132000);

    // Số dư khả dụng của Guide 4 phải tăng thêm đúng 132.000 ₫
    const walletAfter = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 4;
    `);
    expect(Number(walletAfter.rows[0].so_du_kha_dung)).toBe(balanceBefore + 132000);
  });

  it('7. Kiểm tra Quyết toán 70% cuối bằng Tiền mặt +(D - F), Rút tiền tối thiểu 200.000 ₫ và Job tự hủy đơn quá hạn 24h HDV chưa xác nhận', async () => {
    // 7.1. Đơn BK-1004 (ma_booking = 4) đang Completed + WaitingFinal (G = 1.000.000 ₫, D = 300.000 ₫, F = 12% = 120.000 ₫)
    // Khi khách trả 70% bằng Tiền mặt (Cash), ví Guide 4 phải cộng +(D - F) = +(300.000 - 120.000) = +180.000 ₫
    const walletBefore = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 4;
    `);
    const beforeVal = Number(walletBefore.rows[0].so_du_kha_dung);

    await db.query(`
      SELECT * FROM public.fn_settle_final_70(4, 'Cash', 4, 'CASH-BK1004');
    `);

    const walletAfter = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 4;
    `);
    expect(Number(walletAfter.rows[0].so_du_kha_dung)).toBe(beforeVal + 180000);

    // 7.2. Kiểm tra rút tiền dưới 200.000 ₫ bị chặn (BR-09)
    await expect(
      db.query(`
        SELECT * FROM public.fn_request_payout(4, 150000, 'Vietcombank', '0041000389214', 'NGUYEN HUU KHANH');
      `)
    ).rejects.toThrow(/MIN_WITHDRAWAL_ERROR/);

    // 7.3. Kiểm tra Job tự hủy đơn Pending quá 24h HDV chưa xác nhận (fn_job_expire_pending_24h)
    await db.query(`
      UPDATE public.booking
      SET pending_expires_at = NOW() - INTERVAL '5 minutes'
      WHERE ma_booking = 1;
    `);
    const expiredPendingRes = await db.query<{ fn_job_expire_pending_24h: number }>(`
      SELECT public.fn_job_expire_pending_24h();
    `);
    expect(expiredPendingRes.rows[0].fn_job_expire_pending_24h).toBe(1);

    const b1Status = await db.query<{ booking_status: string }>(`
      SELECT booking_status FROM public.booking WHERE ma_booking = 1;
    `);
    expect(b1Status.rows[0].booking_status).toBe('Cancelled');
  });

  it('8. Kiểm tra Cửa sổ Khiếu nại 24h (BR-12), Phán quyết Tranh chấp của Admin (UC.27), Đánh giá tự tính lại avg_rating (UC.26), Duyệt KYC (BR-01) & Cấu hình Phí sàn (BR-13)', async () => {
    // 8.1. Kiểm tra BR-12: Đơn số 4 đã Completed -> cố tình gửi khiếu nại phải bị chặn COMPLAINT_LOCKED
    await expect(
      db.query(`
        SELECT * FROM public.fn_submit_complaint(
          4, 1, 'HDV đến trễ', 'Khiếu nại sau khi đơn đã hoàn thành', NULL
        );
      `)
    ).rejects.toThrow(/COMPLAINT_LOCKED/);

    // 8.2. Tạo đơn mới trên khung giờ số 8 (Guide 8 - Võ Thị Cẩm Tú, 220.000 ₫/giờ x 4 giờ = 880.000 ₫, cọc 30% = 264.000 ₫)
    const createDispBooking = await db.query<{ ma_booking: number }>(`
      SELECT ma_booking FROM public.fn_create_booking(
        1, 8, 8,
        'Chợ Cồn, Hải Châu, Đà Nẵng',
        2,
        'Khám phá ẩm thực Chợ Cồn',
        FALSE
      );
    `);
    const bDispId = createDispBooking.rows[0].ma_booking;

    // Guide 8 chấp nhận đơn -> khóa HOLD 15 phút
    await db.query(`SELECT * FROM public.fn_guide_respond_booking($1, 8, TRUE, NULL);`, [bDispId]);
    // Tourist 1 đặt cọc 30% (264.000 ₫) -> tạo SERVICE_AGREEMENT (BR-10)
    await db.query(`SELECT * FROM public.fn_pay_deposit_30($1, 1, 'VNPAY', 'DEP-DISP-8', TRUE, FALSE);`, [bDispId]);
    // Guide 8 bấm gửi yêu cầu hoàn thành -> mở cửa sổ 24h (UC.17)
    await db.query(`SELECT * FROM public.fn_request_completion($1, 8);`, [bDispId]);

    // Tourist 1 gửi khiếu nại trong cửa sổ 24h (UC.19) -> trạng thái chuyển sang Disputed
    const compRes = await db.query<{ trang_thai: string }>(`
      SELECT trang_thai FROM public.fn_submit_complaint(
        $1, 1,
        'HDV tự ý bỏ điểm tham quan',
        'HDV kết thúc sớm hơn 1 tiếng so với thỏa thuận.',
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b'
      );
    `, [bDispId]);
    expect(compRes.rows[0].trang_thai).toBe('Pending');

    // Admin 10 phân xử lỗi thuộc về Du khách (TOURIST_FAULT) -> Tịch thu cọc 264.000 ₫, trừ phí sàn 12% (31.680 ₫), cộng +232.320 ₫ vào ví Guide 8
    const w8Before = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 8;
    `);
    const bal8Before = Number(w8Before.rows[0].so_du_kha_dung);

    const resolveRes = await db.query<{ trang_thai: string; phan_quyet_loi: string }>(`
      SELECT trang_thai, phan_quyet_loi FROM public.fn_admin_resolve_complaint(
        $1, 10, 'TOURIST_FAULT',
        'Qua đối soát GPS và tin nhắn, HDV đã phục vụ đủ thời lượng, khách tự ý rời đoàn sớm.'
      );
    `, [bDispId]);
    expect(resolveRes.rows[0].trang_thai).toBe('Resolved');
    expect(resolveRes.rows[0].phan_quyet_loi).toBe('TOURIST_FAULT');

    const w8After = await db.query<{ so_du_kha_dung: string }>(`
      SELECT so_du_kha_dung FROM public.wallet WHERE ma_guide = 8;
    `);
    expect(Number(w8After.rows[0].so_du_kha_dung)).toBe(bal8Before + 232320);

    // 8.3. Đánh giá 5 sao cho đơn số 4 (đã Completed + Paid ở bước 7) -> tự động cập nhật avg_rating cho Guide 4 (UC.26)
    const revRes = await db.query<{ so_sao: number }>(`
      SELECT so_sao FROM public.fn_submit_review(
        4, 1, 5::SMALLINT, 'Chuyến đi Ngũ Hành Sơn tuyệt vời, HDV Khanh chụp ảnh cực đẹp!'
      );
    `);
    expect(Number(revRes.rows[0].so_sao)).toBe(5);

    // 8.4. Admin 10 duyệt hồ sơ KYC số 4 của HDV số 9 (Đặng Quốc Bảo) -> trạng thái chuyển sang Verified (BR-01)
    const kycRes = await db.query<{ trang_thai: string }>(`
      SELECT trang_thai FROM public.fn_admin_review_kyc(
        4, 10, TRUE, 'CCCD gắn chip và Thẻ SV Du lịch Đà Nẵng hợp lệ.'
      );
    `);
    expect(kycRes.rows[0].trang_thai).toBe('Approved');

    const guide9Status = await db.query<{ trang_thai_xac_minh: string }>(`
      SELECT trang_thai_xac_minh FROM public.local_guide WHERE ma_tai_khoan = 9;
    `);
    expect(guide9Status.rows[0].trang_thai_xac_minh).toBe('Verified');

    // 8.5. Admin 10 cập nhật tỷ lệ phí sàn mới 14% (nằm trong khung 10% - 15% BR-13)
    const feeRes = await db.query<{ fee_rate: string }>(`
      SELECT fee_rate FROM public.fn_admin_update_fee_rate(10, 0.14, 'Điều chỉnh phí sàn mùa cao điểm lễ hội pháo hoa Đà Nẵng');
    `);
    expect(Number(feeRes.rows[0].fee_rate)).toBe(0.14);
  });
});
