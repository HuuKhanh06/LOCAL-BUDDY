-- LocalBuddy v3 — Phân quyền: RLS trên mọi bảng, view an toàn theo vai trò, quyền EXECUTE tường minh.
-- Bảng booking/cancellation_record/service_agreement KHÔNG cấp SELECT trực tiếp cho client: chỉ đọc qua view
-- (view cho Tourist không có cột phí sàn) hoặc RPC.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create or replace function public.lb_is_party(p_booking uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from booking b where b.id = p_booking and (b.tourist_id = app_uid() or b.guide_id = app_uid()))
$$;
grant execute on function public.lb_is_party(uuid) to authenticated;

-- Danh mục & thông tin công khai
grant select on public.khu_vuc, public.ngon_ngu, public.chuyen_mon,
  public.guide_khu_vuc, public.guide_ngon_ngu, public.guide_chuyen_mon, public.availability_slot, public.review
  to anon, authenticated;
create policy public_read on public.khu_vuc for select using (true);
create policy public_read on public.ngon_ngu for select using (true);
create policy public_read on public.chuyen_mon for select using (true);
create policy public_read on public.guide_khu_vuc for select using (true);
create policy public_read on public.guide_ngon_ngu for select using (true);
create policy public_read on public.guide_chuyen_mon for select using (true);
create policy public_read on public.availability_slot for select using (true);
create policy public_read on public.review for select using (true);

grant select on public.system_config to authenticated;
create policy auth_read on public.system_config for select using (true);

-- Tài khoản
grant select on public.profiles, public.local_guide, public.tourist to authenticated;
create policy own_or_admin on public.profiles for select using (id = app_uid() or is_admin());
create policy own_or_admin on public.local_guide for select using (id = app_uid() or is_admin());
create policy own_or_admin on public.tourist for select using (id = app_uid() or is_admin());
create policy admin_only on public.admin for select using (is_admin());

grant select on public.kyc_submission, public.kyc_file to authenticated;
create policy own_or_admin on public.kyc_submission for select using (guide_id = app_uid() or is_admin());
create policy own_or_admin on public.kyc_file for select
  using (exists (select 1 from public.kyc_submission s where s.id = submission_id and (s.guide_id = app_uid() or is_admin())));

-- Phí sàn: chỉ Admin
grant select on public.fee_config to authenticated;
create policy admin_only on public.fee_config for select using (is_admin());

-- Thanh toán (không chứa phí sàn)
grant select on public.payment_transaction, public.invoice to authenticated;
create policy party_or_admin on public.payment_transaction for select using (is_admin() or lb_is_party(booking_id));
create policy party_or_admin on public.invoice for select using (is_admin() or lb_is_party(booking_id));

-- Ví: chỉ chủ ví (Guide) và Admin
grant select on public.wallet, public.wallet_transaction, public.payout_request to authenticated;
create policy own_or_admin on public.wallet for select using (guide_id = app_uid() or is_admin());
create policy own_or_admin on public.wallet_transaction for select using (guide_id = app_uid() or is_admin());
create policy own_or_admin on public.payout_request for select using (guide_id = app_uid() or is_admin());

-- Khiếu nại
grant select on public.complaint, public.complaint_file to authenticated;
create policy party_or_admin on public.complaint for select using (is_admin() or lb_is_party(booking_id));
create policy party_or_admin on public.complaint_file for select
  using (exists (select 1 from public.complaint c where c.id = complaint_id));

-- Thông báo
grant select on public.notification to authenticated;
create policy own on public.notification for select using (recipient_id = app_uid());

-- Chỉ Admin (đọc qua RLS)
create policy admin_only on public.booking for select using (is_admin());
create policy admin_only on public.violation for select using (is_admin());
grant select on public.violation to authenticated;

-- ───────────── VIEW ─────────────
create view public.v_tourist_bookings as
select b.id, b.code, b.guide_id, gp.full_name as guide_name, g.slug as guide_slug, g.portrait_url as guide_portrait,
       b.start_at, b.end_at, b.hours, b.rate_chot, b.total_g, b.deposit_d, b.balance_b,
       b.meeting_point, b.notes, b.guest_count, b.status, b.payment_status, b.cancel_reason,
       b.guide_deadline, b.deposit_deadline, b.completion_requested_at, b.tourist_deadline, b.balance_method,
       b.confirmed_at, b.completed_at, b.paid_at, b.cancelled_at, b.created_at,
       cr.actor_role as cancelled_by_role, cr.penalty_rate, cr.penalty_amount, cr.refund_amount,
       exists (select 1 from public.review r where r.booking_id = b.id) as has_review,
       exists (select 1 from public.complaint c where c.booking_id = b.id) as has_complaint
  from public.booking b
  join public.local_guide g on g.id = b.guide_id
  join public.profiles gp on gp.id = b.guide_id
  left join public.cancellation_record cr on cr.booking_id = b.id
 where b.tourist_id = public.app_uid();

create view public.v_guide_bookings as
select b.id, b.code, b.tourist_id, tp.full_name as tourist_name,
       b.start_at, b.end_at, b.hours, b.rate_chot, b.fee_rate_chot, b.total_g, b.deposit_d, b.balance_b, b.fee_f,
       b.meeting_point, b.notes, b.guest_count, b.status, b.payment_status, b.cancel_reason,
       b.guide_deadline, b.deposit_deadline, b.completion_requested_at, b.tourist_deadline, b.balance_method,
       b.confirmed_at, b.completed_at, b.paid_at, b.cancelled_at, b.created_at,
       cr.actor_role as cancelled_by_role, cr.penalty_rate, cr.penalty_amount, cr.refund_amount, cr.fee_on_penalty, cr.guide_credit,
       exists (select 1 from public.complaint c where c.booking_id = b.id) as has_complaint,
       (b.status = 'PENDING' and exists (
          select 1 from public.booking_slot bs join public.availability_slot s on s.id = bs.slot_id
           where bs.booking_id = b.id and s.state <> 'AVAILABLE')) as slot_taken
  from public.booking b
  join public.profiles tp on tp.id = b.tourist_id
  left join public.cancellation_record cr on cr.booking_id = b.id
 where b.guide_id = public.app_uid();

create view public.v_admin_bookings as
select b.*, tp.full_name as tourist_name, gp.full_name as guide_name
  from public.booking b
  join public.profiles tp on tp.id = b.tourist_id
  join public.profiles gp on gp.id = b.guide_id
 where public.is_admin();

create view public.v_booking_log as
select l.id, l.booking_id, l.action, l.from_status, l.to_status, l.from_payment, l.to_payment, l.created_at,
       (l.actor_id is null) as by_system
  from public.booking_log l join public.booking b on b.id = l.booking_id
 where b.tourist_id = public.app_uid() or b.guide_id = public.app_uid() or public.is_admin();

grant select on public.v_tourist_bookings, public.v_guide_bookings, public.v_admin_bookings, public.v_booking_log to authenticated;

-- ───────────── EXECUTE ─────────────
grant execute on function public.app_uid(), public.app_role(), public.is_admin(), public.server_now(),
  public.lb_unaccent(text), public.search_guides(text, int[], int[], int[], numeric, bigint, bigint, date, int, int, text, int, int),
  public.get_guide_public(text)
  to anon, authenticated;

grant execute on function
  public.create_booking(uuid, timestamptz, int, text, text, int, uuid),
  public.guide_respond(uuid, boolean, text),
  public.request_completion(uuid),
  public.tourist_confirm(uuid),
  public.file_complaint(uuid, text, text, text[]),
  public.choose_balance(uuid, public.balance_method),
  public.confirm_cash_received(uuid),
  public.preview_cancellation(uuid),
  public.cancel_booking(uuid, text),
  public.submit_review(uuid, int, text),
  public.wallet_available(uuid),
  public.request_payout(bigint, text, text, text),
  public.submit_kyc(public.kyc_doc_type, text[]),
  public.update_guide_profile(text, text, bigint, text, int[], int[], int[]),
  public.set_availability(timestamptz[], bigint[]),
  public.mark_notifications_read(bigint[]),
  public.get_service_agreement(uuid),
  public.admin_review_kyc(bigint, boolean, text),
  public.admin_revoke_verification(uuid, text),
  public.admin_set_account_status(uuid, public.account_status, text),
  public.admin_resolve_dispute(bigint, public.dispute_fault, bigint, text),
  public.admin_approve_payout(bigint),
  public.admin_complete_payout(bigint),
  public.admin_reject_payout(bigint, text),
  public.admin_retry_refund(bigint),
  public.admin_set_fee_rate(numeric),
  public.admin_report(timestamptz, timestamptz, text),
  public.admin_delete_demo_data()
  to authenticated;

-- Chỉ service_role (webhook, cron, Edge Function): KHÔNG cấp cho anon/authenticated
grant execute on function
  public.process_timeouts(timestamptz),
  public.deposit_success(uuid, bigint, text, text),
  public.deposit_fail(uuid, text, text),
  public.balance_success(uuid, bigint, text, text),
  public.balance_fail(uuid, text, text),
  public.refund_result(bigint, boolean, text),
  public.handle_payment_event(text, text, uuid, text, text, bigint, text)
  to service_role;

grant select on all tables in schema public to service_role;
