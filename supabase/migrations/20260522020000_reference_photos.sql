-- Reference photo library — wiki-style visual cheat sheet keyed by
-- (machine_model, item_key). Anyone in the mine can read or contribute;
-- the original uploader (or an admin) can update / delete.

create table if not exists public.reference_photos (
  id               uuid primary key default gen_random_uuid(),
  mine_id          uuid not null references public.mines(id) on delete cascade,
  machine_model    text not null,
  item_key         text not null,
  storage_path     text not null,
  caption          text,
  uploaded_by      uuid references public.operators(id) on delete set null,
  uploaded_by_name text,
  created_at       timestamptz not null default now()
);
create index if not exists ref_photos_lookup
  on public.reference_photos (mine_id, machine_model, item_key, created_at desc);

alter table public.reference_photos enable row level security;

drop policy if exists "rp_read"   on public.reference_photos;
drop policy if exists "rp_insert" on public.reference_photos;
drop policy if exists "rp_update" on public.reference_photos;
drop policy if exists "rp_delete" on public.reference_photos;

create policy "rp_read" on public.reference_photos
  for select using (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = reference_photos.mine_id
  ));
create policy "rp_insert" on public.reference_photos
  for insert with check (exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid() and o.mine_id = reference_photos.mine_id
  ));
create policy "rp_update" on public.reference_photos
  for update using (
    exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.id = reference_photos.uploaded_by
    )
    or exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id = reference_photos.mine_id
        and o.role in ('admin','minemanager')
    )
  );
create policy "rp_delete" on public.reference_photos
  for delete using (
    exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.id = reference_photos.uploaded_by
    )
    or exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id = reference_photos.mine_id
        and o.role in ('admin','minemanager')
    )
  );

-- Storage bucket — private, 10 MB limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reference-photos', 'reference-photos', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {mine_id}/{machine_model}/{item_key}/{timestamp}.jpg

drop policy if exists "rp_storage_read"   on storage.objects;
drop policy if exists "rp_storage_insert" on storage.objects;
drop policy if exists "rp_storage_delete" on storage.objects;

create policy "rp_storage_read" on storage.objects
  for select using (
    bucket_id = 'reference-photos'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
create policy "rp_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'reference-photos'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
create policy "rp_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'reference-photos'
    and exists (
      select 1 from public.operators o
      where o.auth_id = auth.uid()
        and o.mine_id::text = (storage.foldername(name))[1]
    )
  );
