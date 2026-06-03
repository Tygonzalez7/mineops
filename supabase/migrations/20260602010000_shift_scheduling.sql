-- Shift scheduling module.
--
-- Six tables:
--   shift_templates           — reusable shift definitions per mine + role
--                               (e.g. "Day 6am-6pm" for operators).
--   shift_slots               — date-bound required headcount for a template
--                               (e.g. "8 operators on Day shift on 2026-06-15").
--   shift_assignments         — concrete operator placement against a slot.
--   shift_trade_requests      — direct or marketplace trade/give/take asks.
--   operator_shift_preferences— per-operator day/night bias + unavailable dates.
--   shift_schedule_config     — per-mine min-rest hrs / rotation period / fairness.
--
-- All policies use defensive `drop policy if exists` because this DB has
-- thrown re-run errors before.

-- ── shift_schedule_config ────────────────────────────────────────────────
-- One row per mine. Auto-created lazily by the app on first Setup access.
create table if not exists public.shift_schedule_config (
  mine_id              uuid primary key references public.mines(id) on delete cascade,
  min_rest_hours       integer not null default 10,
  rotation_period_days integer not null default 14,
  fairness_window_days integer not null default 28,
  updated_at           timestamptz not null default now(),
  updated_by           uuid references public.operators(id) on delete set null
);

-- ── shift_templates ──────────────────────────────────────────────────────
-- Admin-defined. One template per (mine, role, name). is_overnight flips
-- for shifts that cross midnight (end_time < start_time).
create table if not exists public.shift_templates (
  id           uuid primary key default gen_random_uuid(),
  mine_id      uuid not null references public.mines(id) on delete cascade,
  name         text not null,
  role         text not null check (role in ('operator','supervisor','minemanager','maintenance','admin')),
  start_time   time not null,
  end_time     time not null,
  is_overnight boolean not null default false,
  color        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists shift_templates_mine_active
  on public.shift_templates (mine_id, role, is_active);
create unique index if not exists shift_templates_unique_name
  on public.shift_templates (mine_id, role, name) where is_active = true;

-- ── shift_slots ──────────────────────────────────────────────────────────
-- One row per (template, date). required_count = headcount needed.
-- Notes is free text for the schedule builder (e.g. "Quarry-side blast hold").
create table if not exists public.shift_slots (
  id             uuid primary key default gen_random_uuid(),
  mine_id        uuid not null references public.mines(id) on delete cascade,
  template_id    uuid not null references public.shift_templates(id) on delete cascade,
  role           text not null check (role in ('operator','supervisor','minemanager','maintenance','admin')),
  date           date not null,
  required_count integer not null default 1 check (required_count >= 0),
  notes          text,
  created_at     timestamptz not null default now()
);
create unique index if not exists shift_slots_unique
  on public.shift_slots (template_id, date);
create index if not exists shift_slots_mine_date
  on public.shift_slots (mine_id, date);

-- ── shift_assignments ────────────────────────────────────────────────────
-- One row per (slot, operator). status tracks trade lifecycle.
-- day_or_night is denormalised from the template so the constraint solver
-- can check persistence without joining.
create table if not exists public.shift_assignments (
  id           uuid primary key default gen_random_uuid(),
  mine_id      uuid not null references public.mines(id) on delete cascade,
  slot_id      uuid not null references public.shift_slots(id) on delete cascade,
  operator_id  uuid not null references public.operators(id) on delete cascade,
  status       text not null default 'assigned'
                check (status in ('assigned','trade_pending','traded','gave','took','cancelled')),
  day_or_night text not null default 'day' check (day_or_night in ('day','night')),
  assigned_at  timestamptz not null default now(),
  assigned_by  uuid references public.operators(id) on delete set null
);
create unique index if not exists shift_assignments_unique
  on public.shift_assignments (slot_id, operator_id) where status <> 'cancelled';
create index if not exists shift_assignments_operator
  on public.shift_assignments (operator_id, status);
create index if not exists shift_assignments_mine_status
  on public.shift_assignments (mine_id, status);

-- ── shift_trade_requests ─────────────────────────────────────────────────
-- Direct: to_operator_id set → that operator's inbox.
-- Marketplace / give / take: to_operator_id null → visible to anyone with
-- matching role at the same mine.
create table if not exists public.shift_trade_requests (
  id                  uuid primary key default gen_random_uuid(),
  mine_id             uuid not null references public.mines(id) on delete cascade,
  from_assignment_id  uuid references public.shift_assignments(id) on delete cascade,
  from_operator_id    uuid references public.operators(id) on delete set null,
  to_operator_id      uuid references public.operators(id) on delete set null,
  target_slot_id      uuid references public.shift_slots(id) on delete cascade,
  trade_type          text not null check (trade_type in ('direct','marketplace','give','take')),
  status              text not null default 'open'
                       check (status in ('open','accepted','declined','cancelled','completed')),
  note                text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);
create index if not exists shift_trade_mine_status
  on public.shift_trade_requests (mine_id, status, created_at desc);
create index if not exists shift_trade_to_operator
  on public.shift_trade_requests (to_operator_id, status);
create index if not exists shift_trade_from_operator
  on public.shift_trade_requests (from_operator_id, status);

-- ── operator_shift_preferences ───────────────────────────────────────────
-- One row per (operator, mine). unavailable_dates is a date[] so the
-- constraint solver can check membership cheaply.
create table if not exists public.operator_shift_preferences (
  id                 uuid primary key default gen_random_uuid(),
  operator_id        uuid not null references public.operators(id) on delete cascade,
  mine_id            uuid not null references public.mines(id) on delete cascade,
  prefers_day        boolean not null default false,
  prefers_night      boolean not null default false,
  unavailable_dates  date[] not null default '{}',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists op_shift_prefs_unique
  on public.operator_shift_preferences (operator_id, mine_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.shift_schedule_config        enable row level security;
alter table public.shift_templates              enable row level security;
alter table public.shift_slots                  enable row level security;
alter table public.shift_assignments            enable row level security;
alter table public.shift_trade_requests         enable row level security;
alter table public.operator_shift_preferences   enable row level security;

-- shift_schedule_config: mine members read; admin/minemanager write.
drop policy if exists "ssc_read"   on public.shift_schedule_config;
drop policy if exists "ssc_write"  on public.shift_schedule_config;
drop policy if exists "ssc_update" on public.shift_schedule_config;

create policy "ssc_read" on public.shift_schedule_config
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = shift_schedule_config.mine_id
  ));
create policy "ssc_write" on public.shift_schedule_config
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_schedule_config.mine_id
      and o.role in ('admin','minemanager')
  ));
create policy "ssc_update" on public.shift_schedule_config
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_schedule_config.mine_id
      and o.role in ('admin','minemanager')
  ));

-- shift_templates: mine members read; admin/minemanager/supervisor write.
drop policy if exists "st_read"   on public.shift_templates;
drop policy if exists "st_insert" on public.shift_templates;
drop policy if exists "st_update" on public.shift_templates;
drop policy if exists "st_delete" on public.shift_templates;

create policy "st_read" on public.shift_templates
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = shift_templates.mine_id
  ));
create policy "st_insert" on public.shift_templates
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_templates.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));
create policy "st_update" on public.shift_templates
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_templates.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));
create policy "st_delete" on public.shift_templates
  for delete using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_templates.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));

-- shift_slots: mine members read; supervisor+ write.
drop policy if exists "sslot_read"   on public.shift_slots;
drop policy if exists "sslot_insert" on public.shift_slots;
drop policy if exists "sslot_update" on public.shift_slots;
drop policy if exists "sslot_delete" on public.shift_slots;

create policy "sslot_read" on public.shift_slots
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = shift_slots.mine_id
  ));
create policy "sslot_insert" on public.shift_slots
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_slots.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));
create policy "sslot_update" on public.shift_slots
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_slots.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));
create policy "sslot_delete" on public.shift_slots
  for delete using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_slots.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));

-- shift_assignments: mine members read; operators write own; supervisor+ write any.
drop policy if exists "sa_read"         on public.shift_assignments;
drop policy if exists "sa_insert_self"  on public.shift_assignments;
drop policy if exists "sa_insert_admin" on public.shift_assignments;
drop policy if exists "sa_update_self"  on public.shift_assignments;
drop policy if exists "sa_update_admin" on public.shift_assignments;
drop policy if exists "sa_delete_admin" on public.shift_assignments;

create policy "sa_read" on public.shift_assignments
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = shift_assignments.mine_id
  ));

-- Operator can insert a row for themselves (e.g. "take" from marketplace).
create policy "sa_insert_self" on public.shift_assignments
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.id      = shift_assignments.operator_id
      and o.mine_id = shift_assignments.mine_id
  ));
-- Supervisor+ can insert assignments for anyone in the mine.
create policy "sa_insert_admin" on public.shift_assignments
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_assignments.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));

-- Operator can update their own assignment (cancel / give).
create policy "sa_update_self" on public.shift_assignments
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.id      = shift_assignments.operator_id
  ));
create policy "sa_update_admin" on public.shift_assignments
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_assignments.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));
create policy "sa_delete_admin" on public.shift_assignments
  for delete using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_assignments.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));

-- shift_trade_requests: mine members read; operators create own; recipient or sender updates.
drop policy if exists "str_read"          on public.shift_trade_requests;
drop policy if exists "str_insert_self"   on public.shift_trade_requests;
drop policy if exists "str_update_party"  on public.shift_trade_requests;
drop policy if exists "str_update_admin"  on public.shift_trade_requests;

create policy "str_read" on public.shift_trade_requests
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = shift_trade_requests.mine_id
  ));
create policy "str_insert_self" on public.shift_trade_requests
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.id      = shift_trade_requests.from_operator_id
      and o.mine_id = shift_trade_requests.mine_id
  ));
-- Either party (sender or recipient) can update — accept/decline/cancel/complete.
-- Marketplace rows (to_operator_id null) are updateable by any mine member
-- with the matching role — enforcement of role match happens app-side.
create policy "str_update_party" on public.shift_trade_requests
  for update using (
    exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id = shift_trade_requests.mine_id
        and (
          o.id = shift_trade_requests.from_operator_id
          or o.id = shift_trade_requests.to_operator_id
          or shift_trade_requests.to_operator_id is null
        )
    )
  );
create policy "str_update_admin" on public.shift_trade_requests
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = shift_trade_requests.mine_id
      and o.role in ('admin','minemanager','supervisor')
  ));

-- operator_shift_preferences: operator manages own; supervisor+ can read all.
drop policy if exists "osp_read_self"   on public.operator_shift_preferences;
drop policy if exists "osp_read_admin"  on public.operator_shift_preferences;
drop policy if exists "osp_write_self"  on public.operator_shift_preferences;
drop policy if exists "osp_update_self" on public.operator_shift_preferences;

create policy "osp_read_self" on public.operator_shift_preferences
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = operator_shift_preferences.mine_id
  ));
create policy "osp_write_self" on public.operator_shift_preferences
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.id      = operator_shift_preferences.operator_id
      and o.mine_id = operator_shift_preferences.mine_id
  ));
create policy "osp_update_self" on public.operator_shift_preferences
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and (
        o.id = operator_shift_preferences.operator_id
        or (o.mine_id = operator_shift_preferences.mine_id
            and o.role in ('admin','minemanager','supervisor'))
      )
  ));
