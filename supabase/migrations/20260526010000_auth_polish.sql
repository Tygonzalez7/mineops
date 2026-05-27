-- Auth + multi-mine polish.
--
-- is_active: admin can soft-remove an operator from a mine without
--   destroying their historical sign-offs.
-- last_active_at: powers the mine picker's "last accessed" timestamp
--   and a future "who's been quiet" supervisor view.
-- operators_auth: needed for the loadProfile query that lists every
--   mine a single auth.uid() belongs to.

alter table public.operators
  add column if not exists is_active boolean not null default true;

alter table public.operators
  add column if not exists last_active_at timestamptz;

create index if not exists operators_auth
  on public.operators (auth_id);

create index if not exists operators_mine_active
  on public.operators (mine_id, is_active);
