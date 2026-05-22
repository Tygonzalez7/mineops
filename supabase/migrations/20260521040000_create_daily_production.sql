-- daily_production: one tonnage row per operator per shift (or per day).
-- Source of truth for the Production tab bar charts.
-- VL-connected machines: source='visionlink' (operator confirms prefill).
-- Otherwise: source='manual' (operator types in the number).

create table if not exists public.daily_production (
  id          uuid primary key default gen_random_uuid(),
  mine_id     uuid not null references public.mines(id)     on delete cascade,
  machine_id  text not null,
  operator_id uuid not null references public.operators(id) on delete cascade,
  shift_id    uuid references public.shifts(id) on delete set null,
  date        date not null,
  tonnage     numeric(10,2) not null check (tonnage >= 0),
  source      text not null check (source in ('manual','visionlink')),
  notes       text,
  created_at  timestamptz not null default now(),
  foreign key (machine_id, mine_id) references public.machines(id, mine_id) on delete cascade
);

-- One row per shift (allows operators to edit their entry via upsert on shift_id).
create unique index if not exists daily_production_unique_shift
  on public.daily_production (shift_id) where shift_id is not null;

create index if not exists daily_production_mine_date    on public.daily_production (mine_id, date desc);
create index if not exists daily_production_op_date      on public.daily_production (operator_id, date desc);
create index if not exists daily_production_machine_date on public.daily_production (machine_id, date desc);

alter table public.daily_production enable row level security;

-- Anyone signed in to this mine can read its production.
create policy "dp_read_mine_members" on public.daily_production
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = daily_production.mine_id
  ));

-- Operators can only write rows attributed to themselves.
create policy "dp_insert_self" on public.daily_production
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.id = daily_production.operator_id
  ));

create policy "dp_update_self" on public.daily_production
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.id = daily_production.operator_id
  ));
