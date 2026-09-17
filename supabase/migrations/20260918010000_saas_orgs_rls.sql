-- Multi-company SaaS foundation: organizations, platform admins, feature flags,
-- shared RLS helpers, and org/mine signup RPC.
-- Existing mine-member policies stay in place; this adds org + super-admin.

-- ── helpers ──────────────────────────────────────────────────────────────
create or replace function public.is_mine_member(p_mine_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = p_mine_id
      and coalesce(o.is_active, true) = true
  );
$$;

create or replace function public.is_mine_admin(p_mine_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.operators o
    where o.auth_id = auth.uid()
      and o.mine_id = p_mine_id
      and coalesce(o.is_active, true) = true
      and o.role in ('admin','minemanager')
  );
$$;

create table if not exists public.platform_admins (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid unique,
  email      text not null unique,
  name       text,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins p
    where p.auth_id = auth.uid()
       or lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Platform admins can read the table; anyone can see their own row.
drop policy if exists "pa_self_or_admin" on public.platform_admins;
create policy "pa_self_or_admin" on public.platform_admins
  for select using (
    auth.uid() = auth_id
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_platform_admin()
  );
drop policy if exists "pa_admin_write" on public.platform_admins;
create policy "pa_admin_write" on public.platform_admins
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── organizations ────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text,
  owner_id   uuid,
  plan       text not null default 'starter',
  created_at timestamptz not null default now()
);
create unique index if not exists organizations_slug
  on public.organizations (lower(slug)) where slug is not null;

create table if not exists public.org_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  auth_id    uuid not null,
  role       text not null default 'owner'
               check (role in ('owner','billing','admin','member')),
  created_at timestamptz not null default now()
);
create unique index if not exists org_members_unique
  on public.org_members (org_id, auth_id);
create index if not exists org_members_auth on public.org_members (auth_id);

alter table public.mines
  add column if not exists org_id uuid references public.organizations(id) on delete set null;
create index if not exists mines_org on public.mines (org_id);

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.auth_id = auth.uid()
  ) or public.is_platform_admin();
$$;

drop policy if exists "org_read" on public.organizations;
create policy "org_read" on public.organizations
  for select using (public.is_org_member(id) or public.is_platform_admin());
drop policy if exists "org_insert_auth" on public.organizations;
create policy "org_insert_auth" on public.organizations
  for insert with check (auth.uid() is not null);
drop policy if exists "org_update" on public.organizations;
create policy "org_update" on public.organizations
  for update using (public.is_org_member(id) or public.is_platform_admin());

drop policy if exists "om_read" on public.org_members;
create policy "om_read" on public.org_members
  for select using (auth.uid() = auth_id or public.is_org_member(org_id) or public.is_platform_admin());
drop policy if exists "om_insert" on public.org_members;
create policy "om_insert" on public.org_members
  for insert with check (auth.uid() is not null);
drop policy if exists "om_admin" on public.org_members;
create policy "om_admin" on public.org_members
  for all using (public.is_org_member(org_id) or public.is_platform_admin());

-- Feature flags (per org, optional mine override)
create table if not exists public.feature_flags (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations(id) on delete cascade,
  mine_id    uuid references public.mines(id) on delete cascade,
  flag_key   text not null,
  enabled    boolean not null default false,
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create unique index if not exists feature_flags_scope
  on public.feature_flags (coalesce(org_id, '00000000-0000-0000-0000-000000000000'::uuid),
                           coalesce(mine_id, '00000000-0000-0000-0000-000000000000'::uuid),
                           flag_key);
alter table public.feature_flags enable row level security;

drop policy if exists "ff_read" on public.feature_flags;
create policy "ff_read" on public.feature_flags
  for select using (
    public.is_platform_admin()
    or (org_id is not null and public.is_org_member(org_id))
    or (mine_id is not null and public.is_mine_member(mine_id))
  );
drop policy if exists "ff_admin" on public.feature_flags;
create policy "ff_admin" on public.feature_flags
  for all using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Atomic org + mine + admin operator. Avoids client-side RLS chicken/egg.
create or replace function public.create_org_and_mine(
  p_org_name  text,
  p_mine_name text,
  p_location  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
  v_mine public.mines;
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  if coalesce(trim(p_org_name), '') = '' or coalesce(trim(p_mine_name), '') = '' then
    raise exception 'Company and mine name are required';
  end if;

  v_code := '';
  for i in 1..6 loop
    v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  end loop;

  insert into public.organizations (name, owner_id, plan)
  values (trim(p_org_name), v_uid, 'starter')
  returning * into v_org;

  insert into public.org_members (org_id, auth_id, role)
  values (v_org.id, v_uid, 'owner');

  insert into public.mines (name, location, code, plan, owner_id, org_id)
  values (trim(p_mine_name), nullif(trim(p_location), ''), v_code, 'starter', v_uid, v_org.id)
  returning * into v_mine;

  insert into public.operators (auth_id, mine_id, name, role, status)
  values (
    v_uid,
    v_mine.id,
    coalesce(auth.jwt() -> 'user_metadata' ->> 'name', split_part(coalesce(auth.jwt() ->> 'email', 'Admin'), '@', 1)),
    'admin',
    'active'
  );

  return jsonb_build_object(
    'org', to_jsonb(v_org),
    'mine', to_jsonb(v_mine)
  );
end;
$$;

grant execute on function public.create_org_and_mine(text, text, text) to authenticated;
grant execute on function public.is_mine_member(uuid) to authenticated;
grant execute on function public.is_mine_admin(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;

-- Platform admin can read mines / operators across tenants.
drop policy if exists "mines_platform_read" on public.mines;
create policy "mines_platform_read" on public.mines
  for select using (public.is_platform_admin());
drop policy if exists "operators_platform_read" on public.operators;
create policy "operators_platform_read" on public.operators
  for select using (public.is_platform_admin());
drop policy if exists "mines_platform_update" on public.mines;
create policy "mines_platform_update" on public.mines
  for update using (public.is_platform_admin());
drop policy if exists "operators_platform_update" on public.operators;
create policy "operators_platform_update" on public.operators
  for update using (public.is_platform_admin());
