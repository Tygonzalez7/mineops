-- Per-check photo evidence + admin configuration of photo-required items.
--
-- check_item_config: per-mine override of photo_required for a given
--   (log_type, item_key). When no row exists, the app falls back to a
--   hardcoded default map (see PHOTO_REQUIRED_DEFAULTS in src/App.jsx).
--
-- check_photos: one row per attached photo. log_id links to the originating
--   log row (prestart_logs.id, maintenance_logs.id, fire_extinguisher_inspections.id,
--   workplace_exams.id); log_type discriminates which table.

create table if not exists public.check_item_config (
  id             uuid primary key default gen_random_uuid(),
  mine_id        uuid not null references public.mines(id) on delete cascade,
  log_type       text not null check (log_type in ('prestart','maintenance','workplace_exam','fire_ext')),
  item_key       text not null,
  photo_required boolean not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists check_item_config_unique
  on public.check_item_config (mine_id, log_type, item_key);

create table if not exists public.check_photos (
  id           uuid primary key default gen_random_uuid(),
  mine_id      uuid not null references public.mines(id) on delete cascade,
  log_id       uuid not null,
  log_type     text not null check (log_type in ('prestart','maintenance','workplace_exam','fire_ext')),
  item_key     text not null,
  storage_path text not null,
  uploaded_by  uuid references public.operators(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists check_photos_log on public.check_photos (log_type, log_id);
create index if not exists check_photos_mine_date on public.check_photos (mine_id, created_at desc);

alter table public.check_item_config enable row level security;
alter table public.check_photos      enable row level security;

drop policy if exists "cic_read"         on public.check_item_config;
drop policy if exists "cic_admin_insert" on public.check_item_config;
drop policy if exists "cic_admin_update" on public.check_item_config;
drop policy if exists "cp_read"          on public.check_photos;
drop policy if exists "cp_insert"        on public.check_photos;

create policy "cic_read" on public.check_item_config
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = check_item_config.mine_id
  ));
create policy "cic_admin_insert" on public.check_item_config
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = check_item_config.mine_id
      and o.role in ('admin','minemanager')
  ));
create policy "cic_admin_update" on public.check_item_config
  for update using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = check_item_config.mine_id
      and o.role in ('admin','minemanager')
  ));

create policy "cp_read" on public.check_photos
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = check_photos.mine_id
  ));
create policy "cp_insert" on public.check_photos
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = check_photos.mine_id
  ));

-- Storage bucket — private, 10 MB limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('check-photos', 'check-photos', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {mine_id}/{log_type}/{log_id}/{item_key}_{timestamp}.jpg
-- Mine membership enforced by checking the first folder segment.

drop policy if exists "cp_storage_read"   on storage.objects;
drop policy if exists "cp_storage_insert" on storage.objects;

create policy "cp_storage_read" on storage.objects
  for select using (
    bucket_id = 'check-photos'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
create policy "cp_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'check-photos'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
