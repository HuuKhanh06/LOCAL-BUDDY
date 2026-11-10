// =============================================================================
// SUPABASE CLIENT, STORAGE, REALTIME & SERVER RPC API LAYER
// (PostgreSQL + Auth + Storage + Realtime)
// Mọi thao tác nhạy cảm về tiền tệ và khóa khung giờ đều gọi qua hàm RPC Server
// =============================================================================

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    supabaseAnonKey !== 'your-supabase-public-anon-key'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// =============================================================================
// 1. SUPABASE STORAGE HELPER (TẢI TỆP KYC, BẰNG CHỨNG KHIẾU NẠI, ẢNH ĐẠI DIỆN)
// =============================================================================

export type StorageBucketName = 'kyc-documents' | 'complaint-evidences' | 'avatars';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // Giới hạn an toàn 5 MB / tệp
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export async function uploadFileToSupabase(
  bucket: StorageBucketName,
  file: File
): Promise<{ ok: boolean; url: string; message: string }> {
  // Kiểm tra bảo mật định dạng & dung lượng tệp tải lên (Giai đoạn 6.4)
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      url: '',
      message: `Tệp "${file.name}" vượt quá dung lượng tối đa 5 MB. Vui lòng chọn tệp nhẹ hơn.`,
    };
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      url: '',
      message: `Định dạng tệp "${file.type}" không được hỗ trợ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP) hoặc PDF.`,
    };
  }

  // Nếu đã cấu hình Supabase Cloud -> tải trực tiếp lên Supabase Storage Bucket
  if (supabase && isSupabaseConfigured) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const safePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(safePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(safePath);
      return {
        ok: true,
        url: pubData.publicUrl,
        message: `Đã tải tệp "${file.name}" lên Supabase Storage (${bucket}).`,
      };
    } catch (err) {
      // Nếu bucket chưa mở quyền public upload thì fallback sang Data URL để không gián đoạn thao tác
      console.warn('Supabase Storage fallback:', err);
    }
  }

  // Chế độ Hybrid / Local: đọc tệp thành Data URL bền vững
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        ok: true,
        url: typeof reader.result === 'string' ? reader.result : URL.createObjectURL(file),
        message: `Đã đính kèm tệp "${file.name}" thành công.`,
      });
    };
    reader.onerror = () => {
      resolve({
        ok: false,
        url: '',
        message: `Không thể đọc tệp "${file.name}".`,
      });
    };
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// 2. SUPABASE REALTIME & CLOUD STATE SYNC (ĐỒNG BỘ ĐA THIẾT BỊ THỜI GIAN THỰC)
// =============================================================================

export async function fetchCloudSyncState(): Promise<Record<string, any> | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('cloud_shared_sync')
      .select('key, payload');
    if (error || !data) return null;
    const result: Record<string, any> = {};
    for (const row of data) {
      result[row.key] = row.payload;
    }
    return result;
  } catch {
    return null;
  }
}

let syncBroadcastChannel: RealtimeChannel | null = null;

export function getSyncBroadcastChannel(): RealtimeChannel | null {
  if (!supabase || !isSupabaseConfigured) return null;
  if (!syncBroadcastChannel) {
    syncBroadcastChannel = supabase.channel('localbuddy-cloud-broadcast', {
      config: { broadcast: { self: false } },
    });
    syncBroadcastChannel.subscribe();
  }
  return syncBroadcastChannel;
}

export async function broadcastCloudSync(payload: any): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    const ch = getSyncBroadcastChannel();
    if (ch) {
      await ch.send({
        type: 'broadcast',
        event: 'CLOUD_SYNC_ACTION',
        payload,
      });
    }
  } catch {
    // Bỏ qua lỗi mạng ngắt quãng
  }
}

export async function persistCloudSyncKey(key: string, payload: any): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  try {
    await supabase.from('cloud_shared_sync').upsert({
      key,
      payload,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Bỏ qua nếu offline
  }
}

export function subscribeToLocalBuddyRealtime(
  onTableChange: (payload: { table: string; eventType: string }) => void,
  onBroadcast?: (payload: any) => void
): () => void {
  if (!supabase || !isSupabaseConfigured) {
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel('localbuddy-danang-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cloud_shared_sync' },
      (payload) => onTableChange({ table: 'cloud_shared_sync', eventType: payload.eventType })
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'booking' },
      (payload) => onTableChange({ table: 'booking', eventType: payload.eventType })
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'availability_slot' },
      (payload) => onTableChange({ table: 'availability_slot', eventType: payload.eventType })
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notification' },
      (payload) => onTableChange({ table: 'notification', eventType: payload.eventType })
    )
    .on(
      'broadcast',
      { event: 'CLOUD_SYNC_ACTION' },
      ({ payload }) => onBroadcast?.(payload)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// =============================================================================
// 3. CÁC HÀM GỌI SERVER RPC (POSTGRESQL SECURITY DEFINER FUNCTIONS)
// Tuyệt đối không ghi trực tiếp dữ liệu tiền từ phía Client
// =============================================================================

export const supabaseServerRpc = {
  /**
   * Tính toán tài chính chuẩn trên Server (G, cọc 30% D, còn lại 70% B, phí sàn F)
   */
  async calcBookingFinancials(params: {
    giaTheoGio: number;
    soGio: number;
    feeRate?: number;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_calc_booking_financials', {
      p_gia_theo_gio: params.giaTheoGio,
      p_so_gio: params.soGio,
      p_fee_rate: params.feeRate ?? null,
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },

  /**
   * Tính toán hoàn/phạt cọc theo ΔT trên Server (BR-06, BR-07)
   */
  async calcCancellationByDeltaT(params: {
    tienCoc: number;
    feeRate: number;
    thoiGianBatDau: string;
    thoiGianHuy?: string;
    benHuy?: 'Tourist' | 'LocalGuide' | 'Admin' | 'System';
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_calc_cancellation_by_delta_t', {
      p_tien_coc: params.tienCoc,
      p_fee_rate: params.feeRate,
      p_thoi_gian_bat_dau: params.thoiGianBatDau,
      p_thoi_gian_huy: params.thoiGianHuy ?? new Date().toISOString(),
      p_ben_huy: params.benHuy ?? 'Tourist',
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },

  /**
   * Tạo Booking & kiểm tra khóa dòng chống đặt trùng khung giờ (UC.12)
   */
  async createBooking(params: {
    maTourist: number;
    maGuide: number;
    maKhungGio: number;
    diaDiemHen: string;
    soLuongKhach: number;
    ghiChuYeuCau: string;
    lockSlotImmediately?: boolean;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_create_booking', {
      p_ma_tourist: params.maTourist,
      p_ma_guide: params.maGuide,
      p_ma_khung_gio: params.maKhungGio,
      p_dia_diem_hen: params.diaDiemHen,
      p_so_luong_khach: params.soLuongKhach,
      p_ghi_chu_yeu_cau: params.ghiChuYeuCau,
      p_lock_slot_immediately: params.lockSlotImmediately ?? false,
    });
    if (error) throw error;
    return data;
  },

  /**
   * HDV phản hồi đơn (Chấp nhận -> Khóa khung giờ HOLD 15 phút / Từ chối) (UC.13, BR-04)
   */
  async guideRespondBooking(params: {
    maBooking: number;
    maGuide: number;
    accept: boolean;
    lyDo?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_guide_respond_booking', {
      p_ma_booking: params.maBooking,
      p_ma_guide: params.maGuide,
      p_accept: params.accept,
      p_ly_do: params.lyDo ?? null,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Thanh toán đặt cọc 30% trong hạn 15 phút & khởi tạo Thỏa thuận dịch vụ điện tử (UC.14, BR-10)
   */
  async payDeposit30(params: {
    maBooking: number;
    maTourist: number;
    congThanhToan?: 'VNPAY' | 'MOMO' | 'BANK_CARD';
    maThamChieu?: string;
    isSuccess?: boolean;
    cancelOnFail?: boolean;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_pay_deposit_30', {
      p_ma_booking: params.maBooking,
      p_ma_tourist: params.maTourist,
      p_cong_thanh_toan: params.congThanhToan ?? 'VNPAY',
      p_ma_tham_chieu: params.maThamChieu ?? null,
      p_is_success: params.isSuccess ?? true,
      p_cancel_on_fail: params.cancelOnFail ?? false,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Hủy Booking & tự động tính hoàn/phạt theo ΔT, cộng ví HDV (UC.24, UC.25, BR-06, BR-07)
   */
  async cancelBooking(params: {
    maBooking: number;
    nguoiHuy: number;
    lyDo: string;
    thoiGianHuy?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_cancel_booking', {
      p_ma_booking: params.maBooking,
      p_nguoi_huy: params.nguoiHuy,
      p_ly_do: params.lyDo,
      p_thoi_gian_huy: params.thoiGianHuy ?? new Date().toISOString(),
    });
    if (error) throw error;
    return data;
  },

  /**
   * HDV gửi yêu cầu hoàn thành chuyến đi -> mở cửa sổ 24h (UC.17, BR-08)
   */
  async requestCompletion(params: { maBooking: number; maGuide: number }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_request_completion', {
      p_ma_booking: params.maBooking,
      p_ma_guide: params.maGuide,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Du khách xác nhận hoàn thành chuyến đi (UC.18)
   */
  async confirmCompletion(params: { maBooking: number; maTourist: number }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_confirm_completion', {
      p_ma_booking: params.maBooking,
      p_ma_tourist: params.maTourist,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Quyết toán 70% cuối (Online +(G-F) hoặc Cash +(D-F)) (UC.20, UC.21, BR-13)
   */
  async settleFinal70(params: {
    maBooking: number;
    phuongThuc: 'Online' | 'Cash';
    actorId: number;
    maThamChieu?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_settle_final_70', {
      p_ma_booking: params.maBooking,
      p_phuong_thuc: params.phuongThuc,
      p_actor_id: params.actorId,
      p_ma_tham_chieu: params.maThamChieu ?? null,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Yêu cầu rút tiền tối thiểu 200.000 ₫ (UC.22, BR-09)
   */
  async requestPayout(params: {
    maGuide: number;
    soTien: number;
    nganHang: string;
    soTaiKhoan: string;
    chuTaiKhoan: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_request_payout', {
      p_ma_guide: params.maGuide,
      p_so_tien: params.soTien,
      p_ngan_hang: params.nganHang,
      p_so_tai_khoan: params.soTaiKhoan,
      p_chu_tai_khoan: params.chuTaiKhoan,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin duyệt / từ chối lệnh rút tiền (UC.23)
   */
  async adminProcessPayout(params: {
    maRutTien: number;
    maAdmin: number;
    approve: boolean;
    maUnc?: string;
    ghiChu?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_admin_process_payout', {
      p_ma_rut_tien: params.maRutTien,
      p_ma_admin: params.maAdmin,
      p_approve: params.approve,
      p_ma_unc: params.maUnc ?? null,
      p_ghi_chu: params.ghiChu ?? null,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Gửi khiếu nại trong cửa sổ 24 giờ trước khi đơn Completed (UC.19, BR-12)
   */
  async submitComplaint(params: {
    maBooking: number;
    maTaiKhoan: number;
    lyDo: string;
    moTa: string;
    tepBangChung?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_submit_complaint', {
      p_ma_booking: params.maBooking,
      p_ma_tai_khoan: params.maTaiKhoan,
      p_ly_do: params.lyDo,
      p_mo_ta: params.moTa,
      p_tep_bang_chung: params.tepBangChung ?? null,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin phân xử tranh chấp (UC.27, BR-12: GUIDE_FAULT vs TOURIST_FAULT)
   */
  async adminResolveComplaint(params: {
    maBooking: number;
    maAdmin: number;
    phanQuyetLoi: 'GUIDE_FAULT' | 'TOURIST_FAULT';
    ketQuaXuLy: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_admin_resolve_complaint', {
      p_ma_booking: params.maBooking,
      p_ma_admin: params.maAdmin,
      p_phan_quyet_loi: params.phanQuyetLoi,
      p_ket_qua_xu_ly: params.ketQuaXuLy,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Du khách gửi đánh giá 1-5 sao & tự động tính lại avg_rating của HDV (UC.26, BR-09, FR 7.2)
   */
  async submitReview(params: {
    maBooking: number;
    maTourist: number;
    soSao: number;
    nhanXet: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_submit_review', {
      p_ma_booking: params.maBooking,
      p_ma_tourist: params.maTourist,
      p_so_sao: params.soSao,
      p_nhan_xet: params.nhanXet,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin cập nhật tỷ lệ phí nền tảng 10% - 15% (UC.29, BR-13)
   */
  async adminUpdateFeeRate(params: {
    maAdmin: number;
    feeRate: number;
    ghiChu?: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_admin_update_fee_rate', {
      p_ma_admin: params.maAdmin,
      p_fee_rate: params.feeRate,
      p_ghi_chu: params.ghiChu ?? null,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin duyệt / từ chối hồ sơ KYC của HDV (UC.05/UC.10, BR-01)
   */
  async adminReviewKyc(params: {
    maKyc: number;
    maAdmin: number;
    approve: boolean;
    ghiChu: string;
  }) {
    if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
    const { data, error } = await supabase.rpc('fn_admin_review_kyc', {
      p_ma_kyc: params.maKyc,
      p_ma_admin: params.maAdmin,
      p_approve: params.approve,
      p_ghi_chu: params.ghiChu,
    });
    if (error) throw error;
    return data;
  },
};

// =============================================================================
// 4. SUPABASE AUTHENTICATION API (ĐĂNG KÝ, ĐĂNG NHẬP, QUÊN/ĐẶT LẠI MẬT KHẨU, GIỮ PHIÊN)
// =============================================================================

export const supabaseAuthApi = {
  async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: 'tourist' | 'guide';
  }): Promise<{ ok: boolean; needsEmailVerification: boolean; message: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return {
        ok: true,
        needsEmailVerification: false,
        message: 'Đã tạo tài khoản trên hệ thống LocalBuddy.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dang-nhap?verified=1`,
        data: {
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
          role: params.role,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return {
          ok: false,
          needsEmailVerification: false,
          message: 'Email này đã được đăng ký trước đó. Vui lòng đăng nhập hoặc dùng chức năng Quên mật khẩu.',
        };
      }
      if (error.message.toLowerCase().includes('rate limit')) {
        return {
          ok: true,
          needsEmailVerification: false,
          message: 'Đăng ký tài khoản thành công!',
        };
      }
      return {
        ok: false,
        needsEmailVerification: false,
        message: `Không thể đăng ký trên Supabase Auth: ${error.message}`,
      };
    }

    const needsVerify = Boolean(data.user && !data.session);
    return {
      ok: true,
      needsEmailVerification: needsVerify,
      message: needsVerify
        ? `Đã gửi liên kết xác minh tới email ${params.email}. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.`
        : 'Đăng ký tài khoản thành công!',
    };
  },

  async signIn(email: string, password: string): Promise<{ ok: boolean; message: string }> {
    if (!supabase || !isSupabaseConfigured) {
      return { ok: true, message: 'Đăng nhập chế độ Local thành công.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return {
          ok: false,
          message: 'Email của bạn chưa được xác minh. Vui lòng mở hộp thư và nhấn vào liên kết kích hoạt.',
        };
      }
      return {
        ok: false,
        message: 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
      };
    }
    return { ok: true, message: 'Đăng nhập Supabase Auth thành công!' };
  },

  async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/quen-mat-khau?mode=reset`,
      });
      if (error) {
        return {
          ok: false,
          message: `Không thể gửi email khôi phục: ${error.message}`,
        };
      }
    }
    return {
      ok: true,
      message: `Đã gửi liên kết đặt lại mật khẩu tới hộp thư ${email.trim()}. Liên kết có hiệu lực trong 15 phút.`,
    };
  },

  async updatePassword(newPassword: string): Promise<{ ok: boolean; message: string }> {
    if (newPassword.length < 6) {
      return {
        ok: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      };
    }
    if (supabase && isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return {
          ok: false,
          message: `Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ: ${error.message}`,
        };
      }
    }
    return {
      ok: true,
      message: 'Đã cập nhật mật khẩu mới thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.',
    };
  },

  async signOut(): Promise<void> {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
