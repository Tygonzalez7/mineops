-- Pre-operational vehicle / truck check.
-- One row per submitted inspection. Each item is a {state, note} entry in
-- the results jsonb; photo evidence lives in check_photos with
-- log_type = 'vehicle_check' (so we reuse the existing storage bucket + UX).

create table if not exists public.vehicle_checks (
  id            uuid primary key default gen_random_uuid(),
  mine_id       uuid not null references public.mines(id) on delete cascade,
  shift_id      uuid references public.shifts(id) on delete set null,
  operator_id   uuid references public.operators(id) on delete set null,
  operator_name text not null,
  vehicle_label text not null,
  odometer_km   integer,
  results       jsonb not null default '{}'::jsonb,
  defect_notes  text,
  pass_count    integer not null default 0,
  fail_count    integer not null default 0,
  na_count      integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists vehicle_checks_mine_date on public.vehicle_checks (mine_id, created_at desc);
create index if not exists vehicle_checks_operator  on public.vehicle_checks (operator_id, created_at desc);

alter table public.vehicle_checks enable row level security;

drop policy if exists "vc_read"   on public.vehicle_checks;
drop policy if exists "vc_insert" on public.vehicle_checks;

create policy "vc_read" on public.vehicle_checks
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = vehicle_checks.mine_id
  ));
create policy "vc_insert" on public.vehicle_checks
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = vehicle_checks.mine_id
  ));

-- Extend the check_photos + check_item_config log_type domain to recognise
-- 'vehicle_check'. Original constraints were auto-named …_log_type_check.
alter table public.check_photos
  drop constraint if exists check_photos_log_type_check;
alter table public.check_photos
  add constraint check_photos_log_type_check
  check (log_type in ('prestart','maintenance','workplace_exam','fire_ext','vehicle_check'));

alter table public.check_item_config
  drop constraint if exists check_item_config_log_type_check;
alter table public.check_item_config
  add constraint check_item_config_log_type_check
  check (log_type in ('prestart','maintenance','workplace_exam','fire_ext','vehicle_check'));
