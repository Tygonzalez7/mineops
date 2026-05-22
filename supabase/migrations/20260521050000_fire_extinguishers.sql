-- Fire extinguisher inspections — MSHA 30 CFR § 56.4201 (monthly per extinguisher).
--
-- Three tables:
--   extinguisher_locations  — admin-curated locations (Crusher Building, Workshop, etc.)
--   fire_extinguishers      — one row per physical extinguisher (keyed by serial)
--   fire_extinguisher_inspections — one row per inspection event
--
-- Plus a private storage bucket `fire-extinguishers` for serial-tag photos.

-- ── locations ────────────────────────────────────────────────────────────
create table if not exists public.extinguisher_locations (
  id          uuid primary key default gen_random_uuid(),
  mine_id     uuid not null references public.mines(id) on delete cascade,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists ext_loc_mine_active
  on public.extinguisher_locations (mine_id, is_active);

-- ── extinguishers (physical units) ───────────────────────────────────────
create table if not exists public.fire_extinguishers (
  id                uuid primary key default gen_random_uuid(),
  mine_id           uuid not null references public.mines(id) on delete cascade,
  location_id       uuid not null references public.extinguisher_locations(id) on delete cascade,
  serial_number     text,
  serial_photo_path text,
  first_seen_at     timestamptz not null default now(),
  last_inspected_at timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
-- One extinguisher per serial number per mine (serial may be null until OCR fills it in).
create unique index if not exists fire_ext_unique_serial
  on public.fire_extinguishers (mine_id, serial_number) where serial_number is not null;
create index if not exists fire_ext_location
  on public.fire_extinguishers (location_id, is_active);

-- ── inspection events ────────────────────────────────────────────────────
create table if not exists public.fire_extinguisher_inspections (
  id                uuid primary key default gen_random_uuid(),
  mine_id           uuid not null references public.mines(id) on delete cascade,
  location_id       uuid not null references public.extinguisher_locations(id) on delete cascade,
  extinguisher_id   uuid references public.fire_extinguishers(id) on delete set null,
  inspector_id      uuid references public.operators(id) on delete set null,
  inspector_name    text not null,
  serial_photo_path text,
  status            text not null check (status in ('pass','fail')),
  notes             text,
  inspected_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);
create index if not exists fire_insp_mine_date
  on public.fire_extinguisher_inspections (mine_id, inspected_at desc);
create index if not exists fire_insp_location_date
  on public.fire_extinguisher_inspections (location_id, inspected_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.extinguisher_locations           enable row level security;
alter table public.fire_extinguishers               enable row level security;
alter table public.fire_extinguisher_inspections    enable row level security;

-- Helper expression: is this auth.uid() a member of this mine?
-- (Inlined per policy for clarity / no extra function needed.)

-- extinguisher_locations: mine members read; admin/minemanager write.
create policy "ext_loc_read" on public.extinguisher_locations
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = extinguisher_locations.mine_id
  ));
create policy "ext_loc_admin_insert" on public.extinguisher_locations
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = extinguisher_locations.mine_id
      and o.role in ('admin','minemanager')
  ));
create policy "ext_loc_admin_update" on public.extinguisher_locations
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = extinguisher_locations.mine_id
      and o.role in ('admin','minemanager')
  ));

-- fire_extinguishers: mine members read + write (auto-created during inspections).
create policy "fire_ext_read" on public.fire_extinguishers
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = fire_extinguishers.mine_id
  ));
create policy "fire_ext_insert" on public.fire_extinguishers
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = fire_extinguishers.mine_id
  ));
create policy "fire_ext_update" on public.fire_extinguishers
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = fire_extinguishers.mine_id
  ));

-- fire_extinguisher_inspections: mine members read; inspector inserts; inspector updates own.
create policy "fire_insp_read" on public.fire_extinguisher_inspections
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = fire_extinguisher_inspections.mine_id
  ));
create policy "fire_insp_insert" on public.fire_extinguisher_inspections
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = fire_extinguisher_inspections.mine_id
  ));
create policy "fire_insp_update_self" on public.fire_extinguisher_inspections
  for update using (
    inspector_id is not null
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid() and o.id = fire_extinguisher_inspections.inspector_id
    )
  );

-- ── Storage bucket for serial-tag photos ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('fire-extinguishers', 'fire-extinguishers', false)
on conflict (id) do nothing;

-- Path convention: {mine_id}/{inspection_or_temp_id}/{timestamp}.jpg
-- Mine membership is enforced by checking the first folder == operator.mine_id.

drop policy if exists "fe_storage_read"   on storage.objects;
drop policy if exists "fe_storage_insert" on storage.objects;

create policy "fe_storage_read" on storage.objects
  for select using (
    bucket_id = 'fire-extinguishers'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );

create policy "fe_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'fire-extinguishers'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
