-- Compliance persistence + Stripe billing scaffolding (no live charges).

-- ── Compliance ───────────────────────────────────────────────────────────
create table if not exists public.inductions (
  id              uuid primary key default gen_random_uuid(),
  mine_id         uuid not null references public.mines(id) on delete cascade,
  inductee_name   text not null,
  role            text not null default 'operator',
  checks          jsonb not null default '{}'::jsonb,
  supervisor_name text,
  created_by      uuid references public.operators(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists inductions_mine on public.inductions (mine_id, created_at desc);

create table if not exists public.training_records (
  id           uuid primary key default gen_random_uuid(),
  mine_id      uuid not null references public.mines(id) on delete cascade,
  operator_id  uuid references public.operators(id) on delete set null,
  name         text not null,
  role         text,
  cert_name    text not null,
  issued_on    date,
  expires_on   date,
  photo_on_file boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists training_records_mine on public.training_records (mine_id, name);

create table if not exists public.competent_persons (
  id         uuid primary key default gen_random_uuid(),
  mine_id    uuid not null references public.mines(id) on delete cascade,
  name       text not null,
  role_title text not null,
  cert_name  text,
  expires_on date,
  created_at timestamptz not null default now()
);
create index if not exists competent_persons_mine on public.competent_persons (mine_id);

create table if not exists public.sds_library (
  id         uuid primary key default gen_random_uuid(),
  mine_id    uuid not null references public.mines(id) on delete cascade,
  name       text not null,
  supplier   text,
  hazard     text,
  revised_on date,
  uploaded   boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists sds_library_mine on public.sds_library (mine_id, name);

alter table public.inductions enable row level security;
alter table public.training_records enable row level security;
alter table public.competent_persons enable row level security;
alter table public.sds_library enable row level security;

-- Members read; supervisor+ write.
do $$
declare
  t text;
begin
  foreach t in array array['inductions','training_records','competent_persons','sds_library']
  loop
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_mine_member(mine_id) or public.is_platform_admin())',
      t||'_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_write', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_mine_member(mine_id) or public.is_platform_admin()) with check (public.is_mine_member(mine_id) or public.is_platform_admin())',
      t||'_write', t);
  end loop;
end $$;

-- ── VisionLink credentials (may already exist in prod) ───────────────────
create table if not exists public.visionlink_credentials (
  mine_id       uuid primary key references public.mines(id) on delete cascade,
  client_id     text not null,
  client_secret text not null,
  app_key       text,
  last_poll_at  timestamptz,
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.visionlink_cache (
  id            uuid primary key default gen_random_uuid(),
  mine_id       uuid not null references public.mines(id) on delete cascade,
  machine_id    text not null,
  serial_number text,
  payload       jsonb not null default '{}'::jsonb,
  fetched_at    timestamptz not null default now(),
  unique (machine_id)
);
create index if not exists visionlink_cache_mine on public.visionlink_cache (mine_id);

-- Extra telemetry slots (cycle / payload / fuel) for future VL fetches.
create table if not exists public.visionlink_telemetry (
  id            uuid primary key default gen_random_uuid(),
  mine_id       uuid not null references public.mines(id) on delete cascade,
  machine_id    text not null,
  kind          text not null check (kind in ('assetSummary','cycle','payload','fuel','faults')),
  payload       jsonb not null default '{}'::jsonb,
  fetched_at    timestamptz not null default now()
);
create index if not exists visionlink_telemetry_mine
  on public.visionlink_telemetry (mine_id, kind, fetched_at desc);

alter table public.visionlink_credentials enable row level security;
alter table public.visionlink_cache enable row level security;
alter table public.visionlink_telemetry enable row level security;

drop policy if exists "vl_cred_admin" on public.visionlink_credentials;
create policy "vl_cred_admin" on public.visionlink_credentials
  for all using (public.is_mine_admin(mine_id) or public.is_platform_admin())
  with check (public.is_mine_admin(mine_id) or public.is_platform_admin());

drop policy if exists "vl_cache_read" on public.visionlink_cache;
create policy "vl_cache_read" on public.visionlink_cache
  for select using (public.is_mine_member(mine_id) or public.is_platform_admin());
drop policy if exists "vl_cache_admin" on public.visionlink_cache;
create policy "vl_cache_admin" on public.visionlink_cache
  for all using (public.is_mine_admin(mine_id) or public.is_platform_admin())
  with check (public.is_mine_admin(mine_id) or public.is_platform_admin());

drop policy if exists "vl_tel_read" on public.visionlink_telemetry;
create policy "vl_tel_read" on public.visionlink_telemetry
  for select using (public.is_mine_member(mine_id) or public.is_platform_admin());
drop policy if exists "vl_tel_admin" on public.visionlink_telemetry;
create policy "vl_tel_admin" on public.visionlink_telemetry
  for all using (public.is_mine_admin(mine_id) or public.is_platform_admin())
  with check (public.is_mine_admin(mine_id) or public.is_platform_admin());

-- ── Billing (Stripe scaffolding — not live) ──────────────────────────────
create table if not exists public.billing_customers (
  org_id              uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id  text unique,
  email               text,
  created_at          timestamptz not null default now()
);

create table if not exists public.billing_subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id   text unique,
  status                   text not null default 'incomplete'
                             check (status in ('incomplete','trialing','active','past_due','canceled','unpaid','paused','not_configured')),
  plan                     text not null default 'starter',
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  updated_at               timestamptz not null default now()
);
create index if not exists billing_subs_org on public.billing_subscriptions (org_id);

create table if not exists public.billing_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text unique,
  type             text not null,
  payload          jsonb not null default '{}'::jsonb,
  processed        boolean not null default false,
  error            text,
  created_at       timestamptz not null default now()
);

alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_events enable row level security;

drop policy if exists "bc_read" on public.billing_customers;
create policy "bc_read" on public.billing_customers
  for select using (public.is_org_member(org_id) or public.is_platform_admin());
drop policy if exists "bs_read" on public.billing_subscriptions;
create policy "bs_read" on public.billing_subscriptions
  for select using (public.is_org_member(org_id) or public.is_platform_admin());
-- Events are service-role only (webhook). No client policies for insert.
drop policy if exists "be_admin_read" on public.billing_events;
create policy "be_admin_read" on public.billing_events
  for select using (public.is_platform_admin());
