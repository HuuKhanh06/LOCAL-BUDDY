-- LocalBuddy v3 — Lược đồ lõi (Postgres / Supabase). Tiền: bigint VNĐ. Thời gian: timestamptz (UTC).
-- Chạy được trên Supabase và PGlite (kiểm thử). Phần chỉ dành cho Supabase nằm ở migration 0004.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- ───────────── ENUM ─────────────
create type public.account_role as enum ('TOURIST', 'GUIDE', 'ADMIN');
create type public.account_status as enum ('ACTIVE', 'LOCKED', 'INACTIVE');
create type public.kyc_status as enum ('PENDING', 'VERIFIED', 'REJECTED');
create type public.kyc_doc_type as enum ('CCCD', 'STUDENT_CARD');
create type public.booking_status as enum ('PENDING', 'WAITING_PAYMENT', 'CONFIRMED', 'DISPUTED', 'COMPLETED', 'CANCELLED');
create type public.payment_status as enum ('NOT_PAID', 'DEPOSIT_PENDING', 'DEPOSIT_PAID', 'BALANCE_PENDING', 'PAID', 'REFUND_PENDING', 'REFUNDED', 'RECONCILIATION_PENDING');
create type public.cancel_reason as enum ('GUIDE_REJECTED', 'GUIDE_TIMEOUT', 'DEPOSIT_TIMEOUT', 'DEPOSIT_FAILED', 'USER_CANCELLED', 'DISPUTE_RESULT');
create type public.slot_state as enum ('AVAILABLE', 'HOLD', 'BUSY');
create type public.balance_method as enum ('ONLINE', 'CASH');
create type public.tx_kind as enum ('DEPOSIT', 'BALANCE', 'REFUND');
create type public.tx_status as enum ('PENDING', 'SUCCESS', 'FAILED');
create type public.wallet_tx_kind as enum ('EARNING_ONLINE', 'EARNING_CASH', 'PENALTY_COMPENSATION', 'DISPUTE_COMPENSATION', 'PAYOUT');
create type public.payout_status as enum ('PENDING', 'APPROVED', 'TRANSFERRED', 'REJECTED');
create type public.complaint_status as enum ('OPEN', 'RESOLVED');
create type public.dispute_fault as enum ('GUIDE', 'TOURIST');

-- ───────────── TÀI KHOẢN ─────────────
create table public.profiles (
  id uuid primary key,
  role public.account_role not null,
  status public.account_status not null default 'ACTIVE',
  status_reason text,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  email text not null unique,
  phone text unique check (phone is null or phone ~ '^\+84[0-9]{9,10}$'),
  violation_count int not null default 0,
  locale text not null default 'vi' check (locale in ('vi', 'en')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tourist (
  id uuid primary key references public.profiles(id) on delete cascade,
  nationality text
);

create table public.admin (
  id uuid primary key references public.profiles(id) on delete cascade
);

create table public.local_guide (
  id uuid primary key references public.profiles(id) on delete cascade,
  slug text not null unique,
  hourly_rate bigint check (hourly_rate is null or hourly_rate between 80000 and 500000),
  headline text,
  bio text,
  portrait_url text,
  kyc_status public.kyc_status not null default 'PENDING',
  is_verified boolean not null default false,
  avg_rating numeric(3,2),
  review_count int not null default 0,
  is_demo boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.khu_vuc (id serial primary key, code text unique not null, name_vi text not null, name_en text not null);
create table public.ngon_ngu (id serial primary key, code text unique not null, name_vi text not null, name_en text not null);
create table public.chuyen_mon (id serial primary key, code text unique not null, name_vi text not null, name_en text not null);
create table public.guide_khu_vuc (guide_id uuid references public.local_guide(id) on delete cascade, khu_vuc_id int references public.khu_vuc(id), primary key (guide_id, khu_vuc_id));
create table public.guide_ngon_ngu (guide_id uuid references public.local_guide(id) on delete cascade, ngon_ngu_id int references public.ngon_ngu(id), primary key (guide_id, ngon_ngu_id));
create table public.guide_chuyen_mon (guide_id uuid references public.local_guide(id) on delete cascade, chuyen_mon_id int references public.chuyen_mon(id), primary key (guide_id, chuyen_mon_id));

create table public.kyc_submission (
  id bigserial primary key,
  guide_id uuid not null references public.local_guide(id) on delete cascade,
  doc_type public.kyc_doc_type not null,
  status public.kyc_status not null default 'PENDING',
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.kyc_file (
  id bigserial primary key,
  submission_id bigint not null references public.kyc_submission(id) on delete cascade,
  storage_path text not null
);

-- ───────────── CẤU HÌNH ─────────────
create table public.fee_config (
  id bigserial primary key,
  fee_rate numeric(5,4) not null check (fee_rate between 0.10 and 0.15),
  effective_from timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.system_config (key text primary key, value jsonb not null);

-- ───────────── LỊCH & BOOKING ─────────────
create table public.availability_slot (
  id bigserial primary key,
  guide_id uuid not null references public.local_guide(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  state public.slot_state not null default 'AVAILABLE',
  holding_booking_id uuid,
  constraint slot_one_hour check (end_at = start_at + interval '1 hour' and date_trunc('hour', start_at) = start_at),
  constraint slot_hold_consistent check ((state = 'AVAILABLE') = (holding_booking_id is null)),
  constraint slot_unique_start unique (guide_id, start_at)
);
create index availability_slot_guide_time on public.availability_slot (guide_id, start_at);

create sequence public.booking_code_seq start 1001;

create table public.booking (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('LB-' || nextval('public.booking_code_seq')),
  tourist_id uuid not null references public.profiles(id),
  guide_id uuid not null references public.local_guide(id),
  first_slot_id bigint references public.availability_slot(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  hours int not null check (hours between 1 and 8),
  rate_chot bigint not null check (rate_chot between 80000 and 500000),
  fee_rate_chot numeric(5,4) not null check (fee_rate_chot between 0.10 and 0.15),
  total_g bigint not null,
  deposit_d bigint not null,
  balance_b bigint not null,
  fee_f bigint not null,
  meeting_point text not null check (length(trim(meeting_point)) > 0),
  notes text not null check (length(trim(notes)) > 0),
  guest_count int not null check (guest_count > 0),
  status public.booking_status not null default 'PENDING',
  payment_status public.payment_status not null default 'NOT_PAID',
  cancel_reason public.cancel_reason,
  guide_deadline timestamptz not null,
  deposit_deadline timestamptz,
  completion_requested_at timestamptz,
  tourist_deadline timestamptz,
  balance_method public.balance_method,
  confirmed_at timestamptz,
  completed_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_money check (total_g = rate_chot * hours and deposit_d + balance_b = total_g),
  constraint booking_time check (end_at = start_at + make_interval(hours => hours)),
  constraint booking_cancel_reason check ((status = 'CANCELLED') = (cancel_reason is not null))
);
create index booking_tourist on public.booking (tourist_id, created_at desc);
create index booking_guide on public.booking (guide_id, created_at desc);
create index booking_status_idx on public.booking (status);

alter table public.availability_slot
  add constraint slot_holding_booking_fk foreign key (holding_booking_id) references public.booking(id) deferrable initially deferred;

create table public.booking_slot (
  booking_id uuid not null references public.booking(id) on delete cascade,
  slot_id bigint not null references public.availability_slot(id) on delete cascade,
  primary key (booking_id, slot_id)
);

create table public.service_agreement (
  id bigserial primary key,
  booking_id uuid not null unique references public.booking(id),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.invoice (
  id bigserial primary key,
  booking_id uuid not null references public.booking(id),
  kind public.tx_kind not null,
  amount bigint not null check (amount >= 0),
  issued_at timestamptz not null default now(),
  unique (booking_id, kind)
);

create table public.cancellation_record (
  id bigserial primary key,
  booking_id uuid not null unique references public.booking(id),
  cancelled_by uuid references public.profiles(id),
  actor_role public.account_role,
  reason text,
  hours_left numeric(10,2),
  penalty_rate numeric(3,2) not null default 0,
  penalty_amount bigint not null default 0,
  refund_amount bigint not null default 0,
  fee_on_penalty bigint not null default 0,
  guide_credit bigint not null default 0,
  created_at timestamptz not null default now()
);

create table public.payment_transaction (
  id bigserial primary key,
  booking_id uuid not null references public.booking(id),
  kind public.tx_kind not null,
  method text not null,
  amount bigint not null check (amount >= 0),
  status public.tx_status not null,
  provider_ref text unique,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── VÍ ─────────────
create table public.wallet (
  guide_id uuid primary key references public.local_guide(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.wallet_transaction (
  id bigserial primary key,
  guide_id uuid not null references public.local_guide(id),
  booking_id uuid references public.booking(id),
  payout_id bigint,
  kind public.wallet_tx_kind not null,
  gross_amount bigint not null,
  fee_amount bigint not null default 0,
  net_amount bigint not null,
  created_at timestamptz not null default now()
);

create table public.payout_request (
  id bigserial primary key,
  guide_id uuid not null references public.local_guide(id),
  amount bigint not null check (amount >= 200000),
  bank_name text not null,
  bank_account text not null,
  account_holder text not null,
  status public.payout_status not null default 'PENDING',
  reject_reason text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  transferred_at timestamptz
);

-- ───────────── ĐÁNH GIÁ & KHIẾU NẠI ─────────────
create table public.review (
  id bigserial primary key,
  booking_id uuid not null unique references public.booking(id),
  tourist_id uuid not null references public.profiles(id),
  guide_id uuid not null references public.local_guide(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.complaint (
  id bigserial primary key,
  booking_id uuid not null unique references public.booking(id),
  filed_by uuid not null references public.profiles(id),
  reason text not null check (length(trim(reason)) > 0),
  description text not null check (length(trim(description)) > 0),
  status public.complaint_status not null default 'OPEN',
  fault public.dispute_fault,
  forfeit_x bigint,
  admin_note text,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.complaint_file (
  id bigserial primary key,
  complaint_id bigint not null references public.complaint(id) on delete cascade,
  storage_path text not null
);

-- ───────────── HẠ TẦNG ─────────────
create table public.violation (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id),
  booking_id uuid references public.booking(id),
  kind text not null,
  created_at timestamptz not null default now()
);

create table public.notification (
  id bigserial primary key,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  booking_id uuid references public.booking(id),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notification_recipient on public.notification (recipient_id, created_at desc);

create table public.booking_log (
  id bigserial primary key,
  booking_id uuid not null references public.booking(id),
  actor_id uuid references public.profiles(id),
  action text not null,
  from_status public.booking_status,
  to_status public.booking_status,
  from_payment public.payment_status,
  to_payment public.payment_status,
  created_at timestamptz not null default now()
);

create table public.idempotency_key (
  key uuid primary key,
  actor_id uuid,
  action text not null,
  result jsonb,
  created_at timestamptz not null default now()
);

create table public.webhook_event (
  event_id text primary key,
  provider text not null,
  booking_id uuid,
  kind text not null,
  outcome text not null,
  amount bigint,
  result text,
  flagged boolean not null default false,
  received_at timestamptz not null default now()
);

-- wallet_transaction chỉ ghi thêm
create or replace function public.trg_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'APPEND_ONLY';
end $$;
create trigger wallet_transaction_append_only before update or delete on public.wallet_transaction
  for each row execute function public.trg_append_only();
create trigger booking_log_append_only before update or delete on public.booking_log
  for each row execute function public.trg_append_only();
