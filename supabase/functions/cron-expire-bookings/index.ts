// =============================================================================
// SUPABASE EDGE FUNCTION: cron-expire-bookings
// Tự động quét và xử lý:
//   1. Nhả khung giờ HOLD quá 15 phút chưa đặt cọc 30% (fn_job_expire_hold_15m)
//   2. Hủy đơn PENDING quá 24 giờ HDV chưa xác nhận (fn_job_expire_pending_24h)
//   3. Tự xác nhận hoàn thành sau 24 giờ kể từ lúc HDV bấm hoàn tất (fn_job_auto_complete_24h)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const [hold15mRes, pending24hRes, autoComplete24hRes] = await Promise.all([
      supabaseAdmin.rpc('fn_job_expire_hold_15m'),
      supabaseAdmin.rpc('fn_job_expire_pending_24h'),
      supabaseAdmin.rpc('fn_job_auto_complete_24h'),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        executedAt: new Date().toISOString(),
        expiredHold15mCount: hold15mRes.data ?? 0,
        expiredPending24hCount: pending24hRes.data ?? 0,
        autoCompleted24hCount: autoComplete24hRes.data ?? 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
