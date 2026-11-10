-- LocalBuddy v3 — Hàm server. Mọi chuyển trạng thái chỉ qua các RPC dưới đây (SECURITY DEFINER).
-- Mã lỗi (message): FORBIDDEN, NOT_FOUND, VALIDATION, INVALID_STATE, EXPIRED, SLOT_UNAVAILABLE, SLOT_LOCKED,
-- LEAD_TIME, DUPLICATE_PENDING, GUIDE_UNAVAILABLE, TOO_EARLY, COMPLETED_NO_COMPLAINT, COMPLAINT_NOT_ALLOWED,
-- COMPLAINT_EXISTS, CANCEL_AFTER_START, REVIEW_EXISTS, PAYOUT_MIN, PAYOUT_EXCEEDS, RATE_RANGE, FEE_RANGE.

-- ───────────── TIỆN ÍCH ─────────────
create or replace function public.app_uid() returns uuid language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                         (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')), '')::uuid
$$;

create or replace function public.app_role() returns public.account_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = app_uid() and status = 'ACTIVE'
$$;

create or replace function public.is_admin() returns boolean language sql stable as $$
  select coalesce(public.app_role() = 'ADMIN', false)
$$;

create or replace function public.server_now() returns timestamptz language sql stable as $$ select now() $$;

create or replace function public.lb_require(p_role public.account_role) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v uuid := app_uid();
begin
  if v is null or app_role() is distinct from p_role then raise exception 'FORBIDDEN'; end if;
  return v;
end $$;

create or replace function public.lb_cfg_int(p_key text, p_default int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from system_config where key = p_key), p_default)
$$;

create or replace function public.fn_active_fee_rate() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select fee_rate from fee_config where effective_from <= now()
                   order by effective_from desc, id desc limit 1), 0.12)
$$;

create or replace function public.lb_unaccent(p text) returns text language sql immutable as $$
  select lower(translate(coalesce(p, ''),
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'))
$$;

create or replace function public.lb_notify(p_to uuid, p_type text, p_booking uuid, p_payload jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notification (recipient_id, type, booking_id, payload) values (p_to, p_type, p_booking, coalesce(p_payload, '{}'::jsonb))
$$;

create or replace function public.lb_notify_admins(p_type text, p_booking uuid, p_payload jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notification (recipient_id, type, booking_id, payload)
  select id, p_type, p_booking, coalesce(p_payload, '{}'::jsonb) from profiles where role = 'ADMIN' and status = 'ACTIVE'
$$;

create or replace function public.lb_log(p_booking uuid, p_actor uuid, p_action text,
  p_from public.booking_status, p_to public.booking_status, p_fromp public.payment_status, p_top public.payment_status)
returns void language sql security definer set search_path = public as $$
  insert into booking_log (booking_id, actor_id, action, from_status, to_status, from_payment, to_payment)
  values (p_booking, p_actor, p_action, p_from, p_to, p_fromp, p_top)
$$;

create or replace function public.lb_release_slots(p_booking uuid) returns void
language sql security definer set search_path = public as $$
  update availability_slot set state = 'AVAILABLE', holding_booking_id = null where holding_booking_id = p_booking
$$;

create or replace function public.lb_wallet_credit(p_guide uuid, p_booking uuid, p_kind public.wallet_tx_kind, p_gross bigint, p_fee bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into wallet (guide_id) values (p_guide) on conflict do nothing;
  perform 1 from wallet where guide_id = p_guide for update;
  update wallet set balance = balance + (p_gross - p_fee), updated_at = now() where guide_id = p_guide;
  insert into wallet_transaction (guide_id, booking_id, kind, gross_amount, fee_amount, net_amount)
  values (p_guide, p_booking, p_kind, p_gross, p_fee, p_gross - p_fee);
end $$;

create or replace function public.lb_create_refund(p_booking uuid, p_amount bigint, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into payment_transaction (booking_id, kind, method, amount, status, note)
  values (p_booking, 'REFUND', 'PROVIDER', p_amount, 'PENDING', p_note);
  update booking set payment_status = 'REFUND_PENDING' where id = p_booking;
end $$;

-- ───────────── HẾT HẠN (T4, T7, T10) ─────────────
create or replace function public.lb_expire_booking(p_booking uuid, p_now timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare b booking%rowtype;
begin
  select * into b from booking where id = p_booking for update;
  if not found then return; end if;

  if b.status = 'PENDING' and p_now >= b.guide_deadline then                                  -- T4
    update booking set status = 'CANCELLED', cancel_reason = 'GUIDE_TIMEOUT', cancelled_at = p_now where id = b.id;
    perform lb_log(b.id, null, 'GUIDE_TIMEOUT', b.status, 'CANCELLED', b.payment_status, b.payment_status);
    perform lb_notify(b.tourist_id, 'BOOKING_CANCELLED', b.id, '{"reason":"GUIDE_TIMEOUT"}');
    perform lb_notify(b.guide_id, 'BOOKING_CANCELLED', b.id, '{"reason":"GUIDE_TIMEOUT"}');
  elsif b.status = 'WAITING_PAYMENT' and p_now >= b.deposit_deadline then                     -- T7
    update booking set status = 'CANCELLED', cancel_reason = 'DEPOSIT_TIMEOUT', payment_status = 'NOT_PAID', cancelled_at = p_now where id = b.id;
    perform lb_release_slots(b.id);
    perform lb_log(b.id, null, 'DEPOSIT_TIMEOUT', b.status, 'CANCELLED', b.payment_status, 'NOT_PAID');
    perform lb_notify(b.tourist_id, 'BOOKING_CANCELLED', b.id, '{"reason":"DEPOSIT_TIMEOUT"}');
    perform lb_notify(b.guide_id, 'BOOKING_CANCELLED', b.id, '{"reason":"DEPOSIT_TIMEOUT"}');
  elsif b.status = 'CONFIRMED' and b.completion_requested_at is not null and p_now >= b.tourist_deadline
        and not exists (select 1 from complaint where booking_id = b.id) then                  -- T10
    update booking set status = 'COMPLETED', completed_at = p_now where id = b.id;
    perform lb_log(b.id, null, 'AUTO_COMPLETED', b.status, 'COMPLETED', b.payment_status, b.payment_status);
    perform lb_notify(b.tourist_id, 'BOOKING_COMPLETED', b.id, '{"auto":true}');
    perform lb_notify(b.guide_id, 'BOOKING_COMPLETED', b.id, '{"auto":true}');
  end if;
end $$;

create or replace function public.process_timeouts(p_now timestamptz default now()) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select id from booking
     where (status = 'PENDING' and guide_deadline <= p_now)
        or (status = 'WAITING_PAYMENT' and deposit_deadline <= p_now)
        or (status = 'CONFIRMED' and completion_requested_at is not null and tourist_deadline <= p_now)
     for update skip locked
  loop
    perform lb_expire_booking(r.id, p_now);
    n := n + 1;
  end loop;
  -- QĐ-09: nhắc trả 70% sau 24h và 72h
  insert into notification (recipient_id, type, booking_id, payload)
  select b.tourist_id, 'BALANCE_REMINDER', b.id, jsonb_build_object('stage', s.h)
    from booking b cross join (values (24), (72)) s(h)
   where b.status = 'COMPLETED' and b.payment_status in ('DEPOSIT_PAID', 'RECONCILIATION_PENDING')
     and b.completed_at + make_interval(hours => s.h) <= p_now
     and not exists (select 1 from notification n2 where n2.booking_id = b.id and n2.type = 'BALANCE_REMINDER'
                     and n2.payload ->> 'stage' = s.h::text);
  return n;
end $$;

-- ───────────── T1 TẠO BOOKING ─────────────
create or replace function public.create_booking(p_guide_id uuid, p_start timestamptz, p_hours int,
  p_meeting_point text, p_notes text, p_guest_count int, p_idempotency_key uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := lb_require('TOURIST');
  v_rate bigint; v_fee numeric; v_g bigint; v_d bigint; v_id uuid; v_first bigint; v_cnt int; v_prev jsonb;
begin
  if p_idempotency_key is not null then
    select result into v_prev from idempotency_key where key = p_idempotency_key and actor_id = v_uid and action = 'create_booking';
    if found then return (v_prev ->> 'booking_id')::uuid; end if;
  end if;

  if p_hours is null or p_hours not between 1 and 8 or p_start is null or date_trunc('hour', p_start) <> p_start
     or coalesce(length(trim(p_meeting_point)), 0) = 0 or coalesce(length(trim(p_notes)), 0) = 0
     or coalesce(p_guest_count, 0) <= 0 then
    raise exception 'VALIDATION';
  end if;
  if p_start < now() + make_interval(hours => lb_cfg_int('min_lead_hours', 26)) then raise exception 'LEAD_TIME'; end if;

  select g.hourly_rate into v_rate from local_guide g join profiles p on p.id = g.id
   where g.id = p_guide_id and g.is_verified and p.status = 'ACTIVE' and g.hourly_rate is not null;
  if not found then raise exception 'GUIDE_UNAVAILABLE'; end if;

  select count(*), min(id) into v_cnt, v_first from availability_slot
   where guide_id = p_guide_id and state = 'AVAILABLE'
     and start_at >= p_start and start_at < p_start + make_interval(hours => p_hours);
  if v_cnt <> p_hours then raise exception 'SLOT_UNAVAILABLE'; end if;

  if exists (select 1 from booking where tourist_id = v_uid and guide_id = p_guide_id and status = 'PENDING'
               and start_at < p_start + make_interval(hours => p_hours) and end_at > p_start) then
    raise exception 'DUPLICATE_PENDING';                                                       -- QĐ-05
  end if;

  v_fee := fn_active_fee_rate();
  v_g := v_rate * p_hours;
  v_d := round(v_g * 0.3)::bigint;

  insert into booking (tourist_id, guide_id, first_slot_id, start_at, end_at, hours, rate_chot, fee_rate_chot,
                       total_g, deposit_d, balance_b, fee_f, meeting_point, notes, guest_count, guide_deadline)
  values (v_uid, p_guide_id, v_first, p_start, p_start + make_interval(hours => p_hours), p_hours, v_rate, v_fee,
          v_g, v_d, v_g - v_d, round(v_g * v_fee)::bigint, trim(p_meeting_point), trim(p_notes), p_guest_count,
          now() + make_interval(hours => lb_cfg_int('guide_response_hours', 24)))
  returning id into v_id;

  insert into booking_slot (booking_id, slot_id)
  select v_id, id from availability_slot
   where guide_id = p_guide_id and start_at >= p_start and start_at < p_start + make_interval(hours => p_hours);

  perform lb_log(v_id, v_uid, 'CREATE', null, 'PENDING', null, 'NOT_PAID');
  perform lb_notify(p_guide_id, 'BOOKING_NEW', v_id);
  if p_idempotency_key is not null then
    insert into idempotency_key (key, actor_id, action, result) values (p_idempotency_key, v_uid, 'create_booking', jsonb_build_object('booking_id', v_id));
  end if;
  return v_id;
end $$;

-- ───────────── T2/T3 GUIDE PHẢN HỒI ─────────────
create or replace function public.guide_respond(p_booking uuid, p_accept boolean, p_reason text default null)
returns public.booking_status language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); b booking%rowtype; v_n int;
begin
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking and guide_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status = 'CANCELLED' and b.cancel_reason = 'GUIDE_TIMEOUT' then raise exception 'EXPIRED'; end if;
  if b.status <> 'PENDING' then raise exception 'INVALID_STATE'; end if;

  if p_accept then
    if not exists (select 1 from local_guide where id = v_uid and is_verified) then raise exception 'GUIDE_UNAVAILABLE'; end if;
    perform 1 from availability_slot s join booking_slot bs on bs.slot_id = s.id
      where bs.booking_id = b.id order by s.id for update of s;
    update availability_slot s set state = 'HOLD', holding_booking_id = b.id
      from booking_slot bs where bs.slot_id = s.id and bs.booking_id = b.id and s.state = 'AVAILABLE';
    get diagnostics v_n = row_count;
    if v_n <> b.hours then raise exception 'SLOT_UNAVAILABLE'; end if;
    update booking set status = 'WAITING_PAYMENT', payment_status = 'DEPOSIT_PENDING',
           deposit_deadline = now() + make_interval(mins => lb_cfg_int('deposit_minutes', 15)) where id = b.id;
    perform lb_log(b.id, v_uid, 'ACCEPT', 'PENDING', 'WAITING_PAYMENT', b.payment_status, 'DEPOSIT_PENDING');
    perform lb_notify(b.tourist_id, 'BOOKING_ACCEPTED', b.id);
    return 'WAITING_PAYMENT';
  else
    update booking set status = 'CANCELLED', cancel_reason = 'GUIDE_REJECTED', cancelled_at = now() where id = b.id;
    perform lb_log(b.id, v_uid, 'REJECT', 'PENDING', 'CANCELLED', b.payment_status, b.payment_status);
    perform lb_notify(b.tourist_id, 'BOOKING_CANCELLED', b.id, jsonb_build_object('reason', 'GUIDE_REJECTED', 'note', p_reason));
    return 'CANCELLED';
  end if;
end $$;

-- ───────────── T5/T6 KẾT QUẢ CỌC (chỉ service_role / webhook) ─────────────
create or replace function public.deposit_success(p_booking uuid, p_amount bigint, p_ref text, p_method text default 'SANDBOX')
returns text language plpgsql security definer set search_path = public as $$
declare b booking%rowtype; tp profiles%rowtype; gp profiles%rowtype;
begin
  if exists (select 1 from payment_transaction where provider_ref = p_ref) then return 'DUPLICATE'; end if;
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking for update;
  if not found then return 'UNKNOWN_BOOKING'; end if;
  if p_amount <> b.deposit_d then return 'AMOUNT_MISMATCH'; end if;

  if b.status = 'WAITING_PAYMENT' then
    insert into payment_transaction (booking_id, kind, method, amount, status, provider_ref) values (b.id, 'DEPOSIT', p_method, p_amount, 'SUCCESS', p_ref);
    update booking set status = 'CONFIRMED', payment_status = 'DEPOSIT_PAID', confirmed_at = now() where id = b.id;
    update availability_slot set state = 'BUSY' where holding_booking_id = b.id;
    insert into invoice (booking_id, kind, amount) values (b.id, 'DEPOSIT', p_amount);
    select * into tp from profiles where id = b.tourist_id;
    select * into gp from profiles where id = b.guide_id;
    insert into service_agreement (booking_id, content) values (b.id, jsonb_build_object(
      'code', b.code, 'start_at', b.start_at, 'end_at', b.end_at, 'hours', b.hours,
      'meeting_point', b.meeting_point, 'notes', b.notes, 'guest_count', b.guest_count,
      'rate', b.rate_chot, 'total', b.total_g, 'deposit', b.deposit_d, 'balance', b.balance_b,
      'deposit_method', p_method,
      'tourist', jsonb_build_object('name', tp.full_name, 'email', tp.email, 'phone', tp.phone),
      'guide', jsonb_build_object('name', gp.full_name, 'email', gp.email, 'phone', gp.phone)));
    perform lb_log(b.id, null, 'DEPOSIT_SUCCESS', b.status, 'CONFIRMED', b.payment_status, 'DEPOSIT_PAID');
    perform lb_notify(b.tourist_id, 'BOOKING_CONFIRMED', b.id);
    perform lb_notify(b.guide_id, 'BOOKING_CONFIRMED', b.id);
    return 'CONFIRMED';
  elsif b.status = 'CANCELLED' and b.payment_status = 'NOT_PAID' then                          -- QĐ-13
    insert into payment_transaction (booking_id, kind, method, amount, status, provider_ref) values (b.id, 'DEPOSIT', p_method, p_amount, 'SUCCESS', p_ref);
    perform lb_create_refund(b.id, p_amount, 'LATE_DEPOSIT');
    perform lb_log(b.id, null, 'LATE_DEPOSIT_REFUND', b.status, b.status, b.payment_status, 'REFUND_PENDING');
    perform lb_notify(b.tourist_id, 'LATE_DEPOSIT_REFUND', b.id, jsonb_build_object('amount', p_amount));
    return 'LATE_REFUND';
  end if;
  return 'IGNORED';
end $$;

create or replace function public.deposit_fail(p_booking uuid, p_ref text, p_method text default 'SANDBOX')
returns text language plpgsql security definer set search_path = public as $$
declare b booking%rowtype;
begin
  if exists (select 1 from payment_transaction where provider_ref = p_ref) then return 'DUPLICATE'; end if;
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking for update;
  if not found then return 'UNKNOWN_BOOKING'; end if;
  if b.status <> 'WAITING_PAYMENT' then return 'IGNORED'; end if;
  insert into payment_transaction (booking_id, kind, method, amount, status, provider_ref) values (b.id, 'DEPOSIT', p_method, b.deposit_d, 'FAILED', p_ref);
  update booking set status = 'CANCELLED', cancel_reason = 'DEPOSIT_FAILED', payment_status = 'NOT_PAID', cancelled_at = now() where id = b.id;
  perform lb_release_slots(b.id);
  perform lb_log(b.id, null, 'DEPOSIT_FAILED', b.status, 'CANCELLED', b.payment_status, 'NOT_PAID');
  perform lb_notify(b.tourist_id, 'BOOKING_CANCELLED', b.id, '{"reason":"DEPOSIT_FAILED"}');
  perform lb_notify(b.guide_id, 'BOOKING_CANCELLED', b.id, '{"reason":"DEPOSIT_FAILED"}');
  return 'CANCELLED';
end $$;

-- ───────────── T8/T9 HOÀN THÀNH ─────────────
create or replace function public.request_completion(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); b booking%rowtype;
begin
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking and guide_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'CONFIRMED' or b.completion_requested_at is not null then raise exception 'INVALID_STATE'; end if;
  if now() < b.end_at then raise exception 'TOO_EARLY'; end if;
  update booking set completion_requested_at = now(),
         tourist_deadline = now() + make_interval(hours => lb_cfg_int('tourist_confirm_hours', 24)) where id = b.id;
  perform lb_log(b.id, v_uid, 'REQUEST_COMPLETION', b.status, b.status, b.payment_status, b.payment_status);
  perform lb_notify(b.tourist_id, 'COMPLETION_REQUESTED', b.id);
end $$;

create or replace function public.tourist_confirm(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('TOURIST'); b booking%rowtype;
begin
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking and tourist_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'CONFIRMED' or b.completion_requested_at is null then raise exception 'INVALID_STATE'; end if;
  update booking set status = 'COMPLETED', completed_at = now() where id = b.id;
  perform lb_log(b.id, v_uid, 'TOURIST_CONFIRM', b.status, 'COMPLETED', b.payment_status, b.payment_status);
  perform lb_notify(b.guide_id, 'BOOKING_COMPLETED', b.id);
end $$;

-- ───────────── T11 KHIẾU NẠI ─────────────
create or replace function public.file_complaint(p_booking uuid, p_reason text, p_description text, p_files text[] default '{}')
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := app_uid(); v_role account_role := app_role(); b booking%rowtype; v_id bigint; v_other uuid;
begin
  if v_role not in ('TOURIST', 'GUIDE') or v_role is null then raise exception 'FORBIDDEN'; end if;
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking and (tourist_id = v_uid or guide_id = v_uid) for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status = 'COMPLETED' then raise exception 'COMPLETED_NO_COMPLAINT'; end if;
  if b.status <> 'CONFIRMED' then raise exception 'INVALID_STATE'; end if;
  if exists (select 1 from complaint where booking_id = b.id) then raise exception 'COMPLAINT_EXISTS'; end if;
  if not (b.completion_requested_at is not null
          or (v_role = 'TOURIST' and now() >= b.end_at + make_interval(hours => lb_cfg_int('no_request_complaint_hours', 48)))) then
    raise exception 'COMPLAINT_NOT_ALLOWED';
  end if;
  if coalesce(length(trim(p_reason)), 0) = 0 or coalesce(length(trim(p_description)), 0) = 0 then raise exception 'VALIDATION'; end if;

  insert into complaint (booking_id, filed_by, reason, description) values (b.id, v_uid, trim(p_reason), trim(p_description)) returning id into v_id;
  insert into complaint_file (complaint_id, storage_path) select v_id, f from unnest(coalesce(p_files, '{}')) f where length(f) > 0;
  update booking set status = 'DISPUTED' where id = b.id;
  perform lb_log(b.id, v_uid, 'FILE_COMPLAINT', b.status, 'DISPUTED', b.payment_status, b.payment_status);
  v_other := case when v_uid = b.tourist_id then b.guide_id else b.tourist_id end;
  perform lb_notify(v_other, 'COMPLAINT_FILED', b.id);
  perform lb_notify_admins('COMPLAINT_FILED', b.id, jsonb_build_object('complaint_id', v_id));
  return v_id;
end $$;

-- ───────────── T12–T16 THANH TOÁN 70% ─────────────
create or replace function public.choose_balance(p_booking uuid, p_method public.balance_method)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('TOURIST'); b booking%rowtype; v_to payment_status;
begin
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking and tourist_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'COMPLETED' or not (b.payment_status = 'DEPOSIT_PAID'
       or (b.payment_status = 'RECONCILIATION_PENDING' and b.balance_method = 'ONLINE')) then
    raise exception 'INVALID_STATE';
  end if;
  v_to := case when p_method = 'ONLINE' then 'BALANCE_PENDING'::payment_status else 'RECONCILIATION_PENDING'::payment_status end;
  update booking set payment_status = v_to, balance_method = p_method where id = b.id;
  perform lb_log(b.id, v_uid, 'CHOOSE_BALANCE_' || p_method, b.status, b.status, b.payment_status, v_to);
  if p_method = 'CASH' then perform lb_notify(b.guide_id, 'BALANCE_CASH_CHOSEN', b.id); end if;
  return b.balance_b;
end $$;

create or replace function public.balance_success(p_booking uuid, p_amount bigint, p_ref text, p_method text default 'SANDBOX')
returns text language plpgsql security definer set search_path = public as $$
declare b booking%rowtype;
begin
  if exists (select 1 from payment_transaction where provider_ref = p_ref) then return 'DUPLICATE'; end if;
  select * into b from booking where id = p_booking for update;
  if not found then return 'UNKNOWN_BOOKING'; end if;
  if p_amount <> b.balance_b then return 'AMOUNT_MISMATCH'; end if;
  if b.status <> 'COMPLETED' or b.balance_method is distinct from 'ONLINE'
     or b.payment_status not in ('BALANCE_PENDING', 'RECONCILIATION_PENDING') then return 'IGNORED'; end if;
  insert into payment_transaction (booking_id, kind, method, amount, status, provider_ref) values (b.id, 'BALANCE', p_method, p_amount, 'SUCCESS', p_ref);
  update booking set payment_status = 'PAID', paid_at = now() where id = b.id;
  perform lb_wallet_credit(b.guide_id, b.id, 'EARNING_ONLINE', b.total_g, b.fee_f);                 -- + (G − F)
  perform lb_log(b.id, null, 'BALANCE_SUCCESS', b.status, b.status, b.payment_status, 'PAID');
  perform lb_notify(b.tourist_id, 'BALANCE_PAID', b.id);
  perform lb_notify(b.guide_id, 'BALANCE_PAID', b.id);
  return 'PAID';
end $$;

create or replace function public.balance_fail(p_booking uuid, p_ref text, p_method text default 'SANDBOX')
returns text language plpgsql security definer set search_path = public as $$
declare b booking%rowtype;
begin
  if exists (select 1 from payment_transaction where provider_ref = p_ref) then return 'DUPLICATE'; end if;
  select * into b from booking where id = p_booking for update;
  if not found then return 'UNKNOWN_BOOKING'; end if;
  if b.status <> 'COMPLETED' or b.payment_status <> 'BALANCE_PENDING' then return 'IGNORED'; end if;
  insert into payment_transaction (booking_id, kind, method, amount, status, provider_ref) values (b.id, 'BALANCE', p_method, b.balance_b, 'FAILED', p_ref);
  update booking set payment_status = 'RECONCILIATION_PENDING' where id = b.id;
  perform lb_log(b.id, null, 'BALANCE_FAILED', b.status, b.status, b.payment_status, 'RECONCILIATION_PENDING');
  perform lb_notify(b.tourist_id, 'BALANCE_FAILED', b.id);
  return 'RECONCILIATION_PENDING';
end $$;

create or replace function public.confirm_cash_received(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); b booking%rowtype;
begin
  select * into b from booking where id = p_booking and guide_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'COMPLETED' or b.balance_method is distinct from 'CASH' or b.payment_status <> 'RECONCILIATION_PENDING' then
    raise exception 'INVALID_STATE';
  end if;
  insert into payment_transaction (booking_id, kind, method, amount, status) values (b.id, 'BALANCE', 'CASH', b.balance_b, 'SUCCESS');
  update booking set payment_status = 'PAID', paid_at = now() where id = b.id;
  perform lb_wallet_credit(b.guide_id, b.id, 'EARNING_CASH', b.deposit_d, b.fee_f);                 -- + (D − F)
  perform lb_log(b.id, v_uid, 'CASH_RECEIVED', b.status, b.status, b.payment_status, 'PAID');
  perform lb_notify(b.tourist_id, 'BALANCE_PAID', b.id);
end $$;

-- ───────────── UC.24/25 HUỶ ─────────────
create or replace function public.lb_cancel_calc(b public.booking, p_role public.account_role, p_now timestamptz,
  out case_code text, out hours_left numeric, out penalty_rate numeric, out penalty_amount bigint,
  out refund_amount bigint, out fee_on_penalty bigint, out guide_credit bigint)
language plpgsql stable as $$
begin
  hours_left := round(extract(epoch from (b.start_at - p_now)) / 3600.0, 2);
  penalty_rate := 0; penalty_amount := 0; refund_amount := 0; fee_on_penalty := 0; guide_credit := 0;
  if b.payment_status <> 'DEPOSIT_PAID' then
    case_code := 'NO_DEPOSIT';
  elsif p_role = 'GUIDE' then
    case_code := 'GUIDE_CANCEL'; refund_amount := b.deposit_d;
  else
    case_code := 'TOURIST_CANCEL';
    penalty_rate := case when b.start_at - p_now > interval '48 hours' then 0
                         when b.start_at - p_now >= interval '24 hours' then 0.5 else 1 end;
    penalty_amount := round(b.deposit_d * penalty_rate)::bigint;
    refund_amount := b.deposit_d - penalty_amount;
    fee_on_penalty := round(penalty_amount * b.fee_rate_chot)::bigint;
    guide_credit := penalty_amount - fee_on_penalty;
  end if;
end $$;

create or replace function public.lb_cancellable(p_booking uuid, out b public.booking, out v_role public.account_role)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := app_uid();
begin
  v_role := app_role();
  if v_role not in ('TOURIST', 'GUIDE') or v_role is null then raise exception 'FORBIDDEN'; end if;
  perform lb_expire_booking(p_booking, now());
  select * into b from booking where id = p_booking
     and ((v_role = 'TOURIST' and tourist_id = v_uid) or (v_role = 'GUIDE' and guide_id = v_uid)) for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status not in ('PENDING', 'WAITING_PAYMENT', 'CONFIRMED') then raise exception 'INVALID_STATE'; end if;
  if now() >= b.start_at then raise exception 'CANCEL_AFTER_START'; end if;                    -- QĐ-06
end $$;

create or replace function public.preview_cancellation(p_booking uuid)
returns table (case_code text, hours_left numeric, penalty_rate numeric, penalty_amount bigint,
               refund_amount bigint, deposit_amount bigint, violation_warning boolean)
language plpgsql security definer set search_path = public as $$
declare c record; x record;
begin
  select * into c from lb_cancellable(p_booking);
  select * into x from lb_cancel_calc(c.b, c.v_role, now());
  return query select x.case_code, x.hours_left, x.penalty_rate, x.penalty_amount, x.refund_amount,
    case when x.case_code = 'NO_DEPOSIT' then 0::bigint else (c.b).deposit_d end, x.case_code = 'GUIDE_CANCEL';
end $$;

create or replace function public.cancel_booking(p_booking uuid, p_reason text)
returns table (case_code text, penalty_amount bigint, refund_amount bigint)
language plpgsql security definer set search_path = public as $$
declare c record; x record; b booking; v_uid uuid := app_uid(); v_newpay payment_status; v_cnt int;
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'VALIDATION'; end if;
  select * into c from lb_cancellable(p_booking);
  b := c.b;
  select * into x from lb_cancel_calc(b, c.v_role, now());
  v_newpay := case when x.case_code = 'NO_DEPOSIT' then 'NOT_PAID'::payment_status else b.payment_status end;

  update booking set status = 'CANCELLED', cancel_reason = 'USER_CANCELLED', cancelled_at = now(), payment_status = v_newpay where id = b.id;
  perform lb_release_slots(b.id);
  insert into cancellation_record (booking_id, cancelled_by, actor_role, reason, hours_left, penalty_rate,
                                   penalty_amount, refund_amount, fee_on_penalty, guide_credit)
  values (b.id, v_uid, c.v_role, trim(p_reason), x.hours_left, x.penalty_rate, x.penalty_amount, x.refund_amount,
          x.fee_on_penalty, x.guide_credit);
  if x.penalty_amount > 0 then
    perform lb_wallet_credit(b.guide_id, b.id, 'PENALTY_COMPENSATION', x.penalty_amount, x.fee_on_penalty);
  end if;
  if x.refund_amount > 0 then perform lb_create_refund(b.id, x.refund_amount, 'CANCELLATION'); end if;
  if x.case_code = 'GUIDE_CANCEL' then
    insert into violation (profile_id, booking_id, kind) values (b.guide_id, b.id, 'GUIDE_CANCEL_CONFIRMED');
    update profiles set violation_count = violation_count + 1 where id = b.guide_id;
    select count(*) into v_cnt from violation where profile_id = b.guide_id and kind = 'GUIDE_CANCEL_CONFIRMED'
       and created_at >= now() - interval '90 days';
    if v_cnt >= 3 then perform lb_notify_admins('GUIDE_VIOLATION_FLAG', b.id, jsonb_build_object('guide_id', b.guide_id, 'count', v_cnt)); end if;
  end if;
  perform lb_log(b.id, v_uid, 'CANCEL_' || c.v_role, b.status, 'CANCELLED', b.payment_status,
                 (select payment_status from booking where id = b.id));
  perform lb_notify(case when v_uid = b.tourist_id then b.guide_id else b.tourist_id end, 'BOOKING_CANCELLED', b.id,
                    '{"reason":"USER_CANCELLED"}');
  return query select x.case_code, x.penalty_amount, x.refund_amount;
end $$;

-- Kết quả hoàn tiền từ cổng (service_role)
create or replace function public.refund_result(p_tx bigint, p_success boolean, p_ref text default null)
returns text language plpgsql security definer set search_path = public as $$
declare t payment_transaction%rowtype;
begin
  select * into t from payment_transaction where id = p_tx and kind = 'REFUND' for update;
  if not found or t.status <> 'PENDING' then return 'IGNORED'; end if;
  update payment_transaction set status = case when p_success then 'SUCCESS'::tx_status else 'FAILED'::tx_status end,
         provider_ref = coalesce(p_ref, provider_ref), updated_at = now() where id = t.id;
  if p_success then
    if not exists (select 1 from payment_transaction where booking_id = t.booking_id and kind = 'REFUND' and status = 'PENDING') then
      update booking set payment_status = 'REFUNDED' where id = t.booking_id;
    end if;
    perform lb_notify((select tourist_id from booking where id = t.booking_id), 'REFUND_DONE', t.booking_id, jsonb_build_object('amount', t.amount));
    return 'REFUNDED';
  end if;
  update booking set payment_status = 'RECONCILIATION_PENDING' where id = t.booking_id;
  perform lb_notify_admins('REFUND_FAILED', t.booking_id, jsonb_build_object('tx', t.id));
  return 'RECONCILIATION_PENDING';
end $$;

create or replace function public.admin_retry_refund(p_tx bigint) returns void
language plpgsql security definer set search_path = public as $$
declare t payment_transaction%rowtype; v_uid uuid := lb_require('ADMIN');
begin
  select * into t from payment_transaction where id = p_tx and kind = 'REFUND' and status = 'FAILED' for update;
  if not found then raise exception 'INVALID_STATE'; end if;
  perform lb_create_refund(t.booking_id, t.amount, 'RETRY_' || t.id);
end $$;

-- ───────────── T18 TRANH CHẤP ─────────────
create or replace function public.admin_resolve_dispute(p_complaint bigint, p_fault public.dispute_fault,
  p_forfeit_x bigint default 0, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); c complaint%rowtype; b booking%rowtype; v_x bigint; v_fee bigint := 0; v_refund bigint;
begin
  select * into c from complaint where id = p_complaint for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into b from booking where id = c.booking_id for update;
  if c.status <> 'OPEN' or b.status <> 'DISPUTED' then raise exception 'INVALID_STATE'; end if;

  if p_fault = 'GUIDE' then
    v_x := 0;
    insert into violation (profile_id, booking_id, kind) values (b.guide_id, b.id, 'DISPUTE_GUIDE_FAULT');
    update profiles set violation_count = violation_count + 1 where id = b.guide_id;
  else
    v_x := coalesce(p_forfeit_x, 0);
    if v_x < 0 or v_x > b.deposit_d then raise exception 'VALIDATION'; end if;
    v_fee := round(v_x * b.fee_rate_chot)::bigint;
    if v_x > 0 then perform lb_wallet_credit(b.guide_id, b.id, 'DISPUTE_COMPENSATION', v_x, v_fee); end if;
    insert into violation (profile_id, booking_id, kind) values (b.tourist_id, b.id, 'DISPUTE_TOURIST_FAULT');
    update profiles set violation_count = violation_count + 1 where id = b.tourist_id;
  end if;
  v_refund := b.deposit_d - v_x;

  update booking set status = 'CANCELLED', cancel_reason = 'DISPUTE_RESULT', cancelled_at = now() where id = b.id;
  perform lb_release_slots(b.id);
  if v_refund > 0 then perform lb_create_refund(b.id, v_refund, 'DISPUTE'); end if;
  update complaint set status = 'RESOLVED', fault = p_fault, forfeit_x = v_x, admin_note = p_note,
         resolved_by = v_uid, resolved_at = now() where id = c.id;
  perform lb_log(b.id, v_uid, 'RESOLVE_DISPUTE_' || p_fault, b.status, 'CANCELLED', b.payment_status,
                 (select payment_status from booking where id = b.id));
  perform lb_notify(b.tourist_id, 'DISPUTE_RESOLVED', b.id, jsonb_build_object('fault', p_fault, 'refund', v_refund));
  perform lb_notify(b.guide_id, 'DISPUTE_RESOLVED', b.id, jsonb_build_object('fault', p_fault));
end $$;

-- ───────────── T19 ĐÁNH GIÁ ─────────────
create or replace function public.submit_review(p_booking uuid, p_rating int, p_comment text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('TOURIST'); b booking%rowtype;
begin
  select * into b from booking where id = p_booking and tourist_id = v_uid for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if b.status <> 'COMPLETED' or b.payment_status <> 'PAID' then raise exception 'INVALID_STATE'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'VALIDATION'; end if;
  if exists (select 1 from review where booking_id = b.id) then raise exception 'REVIEW_EXISTS'; end if;
  insert into review (booking_id, tourist_id, guide_id, rating, comment) values (b.id, v_uid, b.guide_id, p_rating, nullif(trim(p_comment), ''));
  update local_guide set avg_rating = (select round(avg(rating), 2) from review where guide_id = b.guide_id),
         review_count = (select count(*) from review where guide_id = b.guide_id) where id = b.guide_id;
end $$;

-- ───────────── UC.22/23 VÍ & RÚT TIỀN ─────────────
create or replace function public.wallet_available(p_guide uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((select balance from wallet where guide_id = p_guide), 0)
       - coalesce((select sum(amount) from payout_request where guide_id = p_guide and status in ('PENDING', 'APPROVED')), 0)
$$;

create or replace function public.request_payout(p_amount bigint, p_bank_name text, p_bank_account text, p_holder text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); v_id bigint;
begin
  insert into wallet (guide_id) values (v_uid) on conflict do nothing;
  perform 1 from wallet where guide_id = v_uid for update;
  if p_amount is null or p_amount < 200000 then raise exception 'PAYOUT_MIN'; end if;
  if p_amount > wallet_available(v_uid) then raise exception 'PAYOUT_EXCEEDS'; end if;
  if coalesce(length(trim(p_bank_name)), 0) = 0 or coalesce(length(trim(p_bank_account)), 0) = 0
     or coalesce(length(trim(p_holder)), 0) = 0 then raise exception 'VALIDATION'; end if;
  insert into payout_request (guide_id, amount, bank_name, bank_account, account_holder)
  values (v_uid, p_amount, trim(p_bank_name), trim(p_bank_account), trim(p_holder)) returning id into v_id;
  perform lb_notify_admins('PAYOUT_REQUESTED', null, jsonb_build_object('payout_id', v_id));
  return v_id;
end $$;

create or replace function public.admin_approve_payout(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); r payout_request%rowtype;
begin
  select * into r from payout_request where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.status <> 'PENDING' then raise exception 'INVALID_STATE'; end if;
  update payout_request set status = 'APPROVED', approved_at = now(), reviewed_by = v_uid where id = p_id;
  perform lb_notify(r.guide_id, 'PAYOUT_APPROVED', null, jsonb_build_object('payout_id', p_id));
end $$;

create or replace function public.admin_complete_payout(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); r payout_request%rowtype;
begin
  select * into r from payout_request where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.status <> 'APPROVED' then raise exception 'INVALID_STATE'; end if;
  perform 1 from wallet where guide_id = r.guide_id for update;
  update wallet set balance = balance - r.amount, updated_at = now() where guide_id = r.guide_id;
  insert into wallet_transaction (guide_id, payout_id, kind, gross_amount, fee_amount, net_amount)
  values (r.guide_id, r.id, 'PAYOUT', -r.amount, 0, -r.amount);
  update payout_request set status = 'TRANSFERRED', transferred_at = now() where id = p_id;
  perform lb_notify(r.guide_id, 'PAYOUT_TRANSFERRED', null, jsonb_build_object('payout_id', p_id, 'amount', r.amount));
end $$;

create or replace function public.admin_reject_payout(p_id bigint, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); r payout_request%rowtype;
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'VALIDATION'; end if;
  select * into r from payout_request where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if r.status not in ('PENDING', 'APPROVED') then raise exception 'INVALID_STATE'; end if;
  update payout_request set status = 'REJECTED', reject_reason = trim(p_reason), reviewed_by = v_uid where id = p_id;
  perform lb_notify(r.guide_id, 'PAYOUT_REJECTED', null, jsonb_build_object('payout_id', p_id, 'reason', trim(p_reason)));
end $$;

-- ───────────── UC.02/05/06/07/08 HỒ SƠ, KYC, LỊCH, TÀI KHOẢN ─────────────
create or replace function public.submit_kyc(p_doc_type public.kyc_doc_type, p_paths text[]) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); v_id bigint;
begin
  if coalesce(array_length(p_paths, 1), 0) = 0 then raise exception 'VALIDATION'; end if;
  if exists (select 1 from local_guide where id = v_uid and is_verified) then raise exception 'INVALID_STATE'; end if;
  insert into kyc_submission (guide_id, doc_type) values (v_uid, p_doc_type) returning id into v_id;
  insert into kyc_file (submission_id, storage_path) select v_id, p from unnest(p_paths) p;
  update local_guide set kyc_status = 'PENDING' where id = v_uid;
  perform lb_notify_admins('KYC_SUBMITTED', null, jsonb_build_object('submission_id', v_id));
  return v_id;
end $$;

create or replace function public.admin_review_kyc(p_submission bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); s kyc_submission%rowtype;
begin
  select * into s from kyc_submission where id = p_submission for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if s.status <> 'PENDING' then raise exception 'INVALID_STATE'; end if;
  if not p_approve and coalesce(length(trim(p_note)), 0) = 0 then raise exception 'VALIDATION'; end if;
  update kyc_submission set status = case when p_approve then 'VERIFIED'::kyc_status else 'REJECTED'::kyc_status end,
         review_note = p_note, reviewed_by = v_uid, reviewed_at = now() where id = s.id;
  update local_guide set kyc_status = case when p_approve then 'VERIFIED'::kyc_status else 'REJECTED'::kyc_status end,
         is_verified = p_approve where id = s.guide_id;
  insert into wallet (guide_id) values (s.guide_id) on conflict do nothing;
  perform lb_notify(s.guide_id, 'KYC_RESULT', null, jsonb_build_object('approved', p_approve, 'note', p_note));
end $$;

create or replace function public.admin_revoke_verification(p_guide uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN');
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'VALIDATION'; end if;
  update local_guide set is_verified = false, kyc_status = 'REJECTED' where id = p_guide;
  if not found then raise exception 'NOT_FOUND'; end if;
  perform lb_notify(p_guide, 'KYC_REVOKED', null, jsonb_build_object('reason', trim(p_reason)));
end $$;

create or replace function public.admin_set_account_status(p_profile uuid, p_status public.account_status, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN');
begin
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'VALIDATION'; end if;
  if p_profile = v_uid then raise exception 'FORBIDDEN'; end if;
  update profiles set status = p_status, status_reason = trim(p_reason) where id = p_profile and role <> 'ADMIN';
  if not found then raise exception 'NOT_FOUND'; end if;
  perform lb_notify(p_profile, 'ACCOUNT_STATUS', null, jsonb_build_object('status', p_status, 'reason', trim(p_reason)));
end $$;

create or replace function public.update_guide_profile(p_headline text, p_bio text, p_hourly_rate bigint,
  p_portrait_url text, p_khu_vuc int[], p_ngon_ngu int[], p_chuyen_mon int[])
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE');
begin
  if p_hourly_rate is null or p_hourly_rate not between 80000 and 500000 then raise exception 'RATE_RANGE'; end if;
  update local_guide set headline = p_headline, bio = p_bio, hourly_rate = p_hourly_rate,
         portrait_url = p_portrait_url, updated_at = now() where id = v_uid;
  delete from guide_khu_vuc where guide_id = v_uid;
  insert into guide_khu_vuc select v_uid, unnest(coalesce(p_khu_vuc, '{}'));
  delete from guide_ngon_ngu where guide_id = v_uid;
  insert into guide_ngon_ngu select v_uid, unnest(coalesce(p_ngon_ngu, '{}'));
  delete from guide_chuyen_mon where guide_id = v_uid;
  insert into guide_chuyen_mon select v_uid, unnest(coalesce(p_chuyen_mon, '{}'));
end $$;

create or replace function public.set_availability(p_add timestamptz[] default '{}', p_remove bigint[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('GUIDE'); t timestamptz; v_h int;
begin
  if exists (select 1 from availability_slot where id = any(coalesce(p_remove, '{}'))
               and (guide_id <> v_uid or state <> 'AVAILABLE')) then
    raise exception 'SLOT_LOCKED';
  end if;
  delete from availability_slot where id = any(coalesce(p_remove, '{}')) and guide_id = v_uid and state = 'AVAILABLE';
  foreach t in array coalesce(p_add, '{}') loop
    v_h := extract(hour from (t at time zone 'Asia/Ho_Chi_Minh'))::int;
    if date_trunc('hour', t) <> t or v_h < 6 or v_h > 21 or t <= now() then raise exception 'VALIDATION'; end if;
    insert into availability_slot (guide_id, start_at, end_at) values (v_uid, t, t + interval '1 hour')
    on conflict (guide_id, start_at) do nothing;
  end loop;
end $$;

create or replace function public.mark_notifications_read(p_ids bigint[] default null) returns void
language sql security definer set search_path = public as $$
  update notification set read_at = now()
   where recipient_id = app_uid() and read_at is null and (p_ids is null or id = any(p_ids))
$$;

-- ───────────── UC.28/29 ADMIN ─────────────
create or replace function public.admin_set_fee_rate(p_rate numeric) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN');
begin
  if p_rate is null or p_rate < 0.10 or p_rate > 0.15 then raise exception 'FEE_RANGE'; end if;
  insert into fee_config (fee_rate, created_by) values (round(p_rate, 4), v_uid);
end $$;

create or replace function public.admin_report(p_from timestamptz, p_to timestamptz, p_bucket text default 'day')
returns table (bucket_start timestamptz, bookings_created bigint, bookings_completed bigint, bookings_cancelled bigint,
               gmv_paid bigint, platform_fee bigint)
language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN');
begin
  if p_bucket not in ('day', 'week', 'month') then raise exception 'VALIDATION'; end if;
  return query
  with buckets as (
    select generate_series(date_trunc(p_bucket, p_from), date_trunc(p_bucket, p_to), ('1 ' || p_bucket)::interval) as s
  )
  select bk.s,
    (select count(*) from booking x where date_trunc(p_bucket, x.created_at) = bk.s and x.created_at between p_from and p_to),
    (select count(*) from booking x where x.completed_at is not null and date_trunc(p_bucket, x.completed_at) = bk.s and x.completed_at between p_from and p_to),
    (select count(*) from booking x where x.cancelled_at is not null and date_trunc(p_bucket, x.cancelled_at) = bk.s and x.cancelled_at between p_from and p_to),
    (select coalesce(sum(x.total_g), 0)::bigint from booking x where x.paid_at is not null and date_trunc(p_bucket, x.paid_at) = bk.s and x.paid_at between p_from and p_to),
    (select coalesce(sum(w.fee_amount), 0)::bigint from wallet_transaction w where date_trunc(p_bucket, w.created_at) = bk.s and w.created_at between p_from and p_to)
  from buckets bk order by bk.s;
end $$;

create or replace function public.admin_delete_demo_data() returns int
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := lb_require('ADMIN'); v_n int;
begin
  create temp table _demo_b on commit drop as
    select b.id from booking b join profiles t on t.id = b.tourist_id join profiles g on g.id = b.guide_id where t.is_demo or g.is_demo;
  delete from complaint_file where complaint_id in (select id from complaint where booking_id in (select id from _demo_b));
  delete from complaint where booking_id in (select id from _demo_b);
  delete from review where booking_id in (select id from _demo_b);
  delete from notification where booking_id in (select id from _demo_b) or recipient_id in (select id from profiles where is_demo);
  delete from violation where booking_id in (select id from _demo_b) or profile_id in (select id from profiles where is_demo);
  alter table wallet_transaction disable trigger wallet_transaction_append_only;
  alter table booking_log disable trigger booking_log_append_only;
  delete from wallet_transaction where booking_id in (select id from _demo_b) or guide_id in (select id from profiles where is_demo);
  delete from booking_log where booking_id in (select id from _demo_b);
  alter table wallet_transaction enable trigger wallet_transaction_append_only;
  alter table booking_log enable trigger booking_log_append_only;
  delete from payment_transaction where booking_id in (select id from _demo_b);
  delete from invoice where booking_id in (select id from _demo_b);
  delete from service_agreement where booking_id in (select id from _demo_b);
  delete from cancellation_record where booking_id in (select id from _demo_b);
  update availability_slot set state = 'AVAILABLE', holding_booking_id = null where holding_booking_id in (select id from _demo_b);
  delete from booking where id in (select id from _demo_b);
  delete from payout_request where guide_id in (select id from profiles where is_demo);
  delete from profiles where is_demo and role <> 'ADMIN';
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ───────────── UC.09/10/11 TÌM KIẾM & HỒ SƠ CÔNG KHAI ─────────────
create or replace function public.search_guides(p_q text default null, p_langs int[] default null, p_areas int[] default null,
  p_skills int[] default null, p_min_rating numeric default null, p_price_min bigint default null, p_price_max bigint default null,
  p_date date default null, p_hour int default null, p_hours int default 1, p_sort text default 'rating',
  p_page int default 1, p_page_size int default 12)
returns table (id uuid, slug text, full_name text, headline text, portrait_url text, hourly_rate bigint,
               avg_rating numeric, review_count int, languages text[], areas text[], total_count bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select g.id, g.slug, p.full_name, g.headline, g.portrait_url, g.hourly_rate, g.avg_rating, g.review_count
      from local_guide g join profiles p on p.id = g.id
     where g.is_verified and p.status = 'ACTIVE' and g.hourly_rate is not null
       and (p_q is null or lb_unaccent(p.full_name || ' ' || coalesce(g.headline, '') || ' ' || coalesce(g.bio, '')) like '%' || lb_unaccent(p_q) || '%')
       and (p_langs is null or exists (select 1 from guide_ngon_ngu x where x.guide_id = g.id and x.ngon_ngu_id = any(p_langs)))
       and (p_areas is null or exists (select 1 from guide_khu_vuc x where x.guide_id = g.id and x.khu_vuc_id = any(p_areas)))
       and (p_skills is null or exists (select 1 from guide_chuyen_mon x where x.guide_id = g.id and x.chuyen_mon_id = any(p_skills)))
       and (p_min_rating is null or coalesce(g.avg_rating, 0) >= p_min_rating)
       and (p_price_min is null or g.hourly_rate >= p_price_min)
       and (p_price_max is null or g.hourly_rate <= p_price_max)
       and (p_date is null or (
             case when p_hour is null then exists (
                    select 1 from availability_slot s where s.guide_id = g.id and s.state = 'AVAILABLE'
                       and s.start_at >= now() + interval '26 hours'
                       and (s.start_at at time zone 'Asia/Ho_Chi_Minh')::date = p_date)
                  else (select count(*) from availability_slot s where s.guide_id = g.id and s.state = 'AVAILABLE'
                          and s.start_at >= ((p_date + make_time(p_hour, 0, 0)) at time zone 'Asia/Ho_Chi_Minh')
                          and s.start_at < ((p_date + make_time(p_hour, 0, 0)) at time zone 'Asia/Ho_Chi_Minh') + make_interval(hours => greatest(coalesce(p_hours, 1), 1))
                       ) = greatest(coalesce(p_hours, 1), 1)
             end))
  )
  select b.id, b.slug, b.full_name, b.headline, b.portrait_url, b.hourly_rate, b.avg_rating, b.review_count,
    array(select n.code from guide_ngon_ngu x join ngon_ngu n on n.id = x.ngon_ngu_id where x.guide_id = b.id order by n.id),
    array(select k.name_vi from guide_khu_vuc x join khu_vuc k on k.id = x.khu_vuc_id where x.guide_id = b.id order by k.id),
    count(*) over ()
  from base b
  order by case when p_sort = 'price_asc' then b.hourly_rate end asc nulls last,
           case when p_sort = 'price_desc' then b.hourly_rate end desc nulls last,
           b.avg_rating desc nulls last, b.review_count desc, b.full_name
  limit least(greatest(coalesce(p_page_size, 12), 1), 50) offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 12), 1), 50)
$$;

create or replace function public.get_guide_public(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', g.id, 'slug', g.slug, 'full_name', p.full_name, 'headline', g.headline, 'bio', g.bio,
    'portrait_url', g.portrait_url, 'hourly_rate', g.hourly_rate, 'avg_rating', g.avg_rating, 'review_count', g.review_count,
    'languages', (select coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'code', n.code, 'vi', n.name_vi, 'en', n.name_en) order by n.id), '[]') from guide_ngon_ngu x join ngon_ngu n on n.id = x.ngon_ngu_id where x.guide_id = g.id),
    'areas', (select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'vi', k.name_vi, 'en', k.name_en) order by k.id), '[]') from guide_khu_vuc x join khu_vuc k on k.id = x.khu_vuc_id where x.guide_id = g.id),
    'skills', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'vi', c.name_vi, 'en', c.name_en) order by c.id), '[]') from guide_chuyen_mon x join chuyen_mon c on c.id = x.chuyen_mon_id where x.guide_id = g.id),
    'slots', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'start_at', s.start_at) order by s.start_at), '[]') from availability_slot s
               where s.guide_id = g.id and s.state = 'AVAILABLE' and s.start_at >= now() + interval '26 hours' and s.start_at < now() + interval '35 days'),
    'reviews', (select coalesce(jsonb_agg(r order by r.created_at desc), '[]') from (
                 select rv.rating, rv.comment, rv.created_at, split_part(tp.full_name, ' ', -1) as tourist_name
                   from review rv join profiles tp on tp.id = rv.tourist_id where rv.guide_id = g.id order by rv.created_at desc limit 20) r))
  from local_guide g join profiles p on p.id = g.id
  where g.slug = p_slug and g.is_verified and p.status = 'ACTIVE'
$$;

create or replace function public.get_service_agreement(p_booking uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select sa.content || jsonb_build_object('created_at', sa.created_at)
    from service_agreement sa join booking b on b.id = sa.booking_id
   where sa.booking_id = p_booking and (b.tourist_id = app_uid() or b.guide_id = app_uid() or is_admin())
$$;

-- ───────────── WEBHOOK (service_role) ─────────────
create or replace function public.handle_payment_event(p_event_id text, p_provider text, p_booking uuid, p_kind text,
  p_outcome text, p_amount bigint, p_ref text)
returns text language plpgsql security definer set search_path = public as $$
declare v_res text;
begin
  insert into webhook_event (event_id, provider, booking_id, kind, outcome, amount)
  values (p_event_id, p_provider, p_booking, p_kind, p_outcome, p_amount) on conflict (event_id) do nothing;
  if not found then return 'DUPLICATE'; end if;
  v_res := case
    when p_kind = 'DEPOSIT' and p_outcome = 'SUCCESS' then deposit_success(p_booking, p_amount, p_ref, p_provider)
    when p_kind = 'DEPOSIT' and p_outcome = 'FAILED' then deposit_fail(p_booking, p_ref, p_provider)
    when p_kind = 'BALANCE' and p_outcome = 'SUCCESS' then balance_success(p_booking, p_amount, p_ref, p_provider)
    when p_kind = 'BALANCE' and p_outcome = 'FAILED' then balance_fail(p_booking, p_ref, p_provider)
    else 'UNSUPPORTED' end;
  update webhook_event set result = v_res, flagged = v_res in ('AMOUNT_MISMATCH', 'UNKNOWN_BOOKING', 'UNSUPPORTED') where event_id = p_event_id;
  if v_res = 'AMOUNT_MISMATCH' then perform lb_notify_admins('PAYMENT_FLAGGED', p_booking, jsonb_build_object('event', p_event_id)); end if;
  return v_res;
end $$;
