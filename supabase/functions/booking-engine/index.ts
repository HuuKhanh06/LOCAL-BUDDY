// =============================================================================
// SUPABASE EDGE FUNCTION: booking-engine
// Xử lý tập trung các nghiệp vụ nhạy cảm về tiền và khóa khung giờ nguyên tử trên Server
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'CREATE_BOOKING': {
        const { data, error } = await supabase.rpc('fn_create_booking', {
          p_ma_tourist: payload.maTourist,
          p_ma_guide: payload.maGuide,
          p_ma_khung_gio: payload.maKhungGio,
          p_dia_diem_hen: payload.diaDiemHen,
          p_so_luong_khach: payload.soLuongKhach,
          p_ghi_chu_yeu_cau: payload.ghiChuYeuCau,
          p_lock_slot_immediately: payload.lockSlotImmediately ?? false,
        });
        if (error) throw error;
        return Response.json({ ok: true, data }, { headers: corsHeaders });
      }

      case 'GUIDE_RESPOND': {
        const { data, error } = await supabase.rpc('fn_guide_respond_booking', {
          p_ma_booking: payload.maBooking,
          p_ma_guide: payload.maGuide,
          p_accept: payload.accept,
          p_ly_do: payload.lyDo ?? null,
        });
        if (error) throw error;
        return Response.json({ ok: true, data }, { headers: corsHeaders });
      }

      case 'PAY_DEPOSIT_30': {
        const { data, error } = await supabase.rpc('fn_pay_deposit_30', {
          p_ma_booking: payload.maBooking,
          p_ma_tourist: payload.maTourist,
          p_cong_thanh_toan: payload.congThanhToan ?? 'VNPAY',
          p_ma_tham_chieu: payload.maThamChieu ?? null,
          p_is_success: payload.isSuccess ?? true,
          p_cancel_on_fail: payload.cancelOnFail ?? false,
        });
        if (error) throw error;
        return Response.json({ ok: true, data }, { headers: corsHeaders });
      }

      case 'CANCEL_BOOKING': {
        const { data, error } = await supabase.rpc('fn_cancel_booking', {
          p_ma_booking: payload.maBooking,
          p_nguoi_huy: payload.nguoiHuy,
          p_ly_do: payload.lyDo,
          p_thoi_gian_huy: payload.thoiGianHuy ?? new Date().toISOString(),
        });
        if (error) throw error;
        return Response.json({ ok: true, data }, { headers: corsHeaders });
      }

      case 'SETTLE_FINAL_70': {
        const { data, error } = await supabase.rpc('fn_settle_final_70', {
          p_ma_booking: payload.maBooking,
          p_phuong_thuc: payload.phuongThuc,
          p_actor_id: payload.actorId,
          p_ma_tham_chieu: payload.maThamChieu ?? null,
        });
        if (error) throw error;
        return Response.json({ ok: true, data }, { headers: corsHeaders });
      }

      default:
        return Response.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400, headers: corsHeaders }
        );
    }
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 400, headers: corsHeaders }
    );
  }
});
