-- ---------------------------------------------------------------------------
-- Grandmaster — Supabase schema
--
-- Run this ONCE in your project's SQL editor (Dashboard → SQL → New query).
-- Then put your project URL + anon key in .env.local:
--   NEXT_PUBLIC_SUPABASE_URL=...
--   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
-- The app stores each tournament as a single JSONB row and listens to realtime
-- changes, so the bracket updates live on every device.
-- This script is idempotent — safe to run more than once.
-- ---------------------------------------------------------------------------

create table if not exists public.tournaments (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_updated_at_idx
  on public.tournaments (updated_at desc);

-- Realtime: broadcast row changes to subscribed clients.
do $$
begin
  alter publication supabase_realtime add table public.tournaments;
exception
  when duplicate_object then null;  -- already added
end $$;

-- Row Level Security.
-- This is a friends' app shared by link, so the default is permissive: anyone
-- with your anon key can read and write. Tighten these policies if you want
-- stricter control (e.g. require auth for writes).
alter table public.tournaments enable row level security;

drop policy if exists "public read"   on public.tournaments;
drop policy if exists "public insert" on public.tournaments;
drop policy if exists "public update" on public.tournaments;
drop policy if exists "public delete" on public.tournaments;

create policy "public read"   on public.tournaments for select using (true);
create policy "public insert" on public.tournaments for insert with check (true);
create policy "public update" on public.tournaments for update using (true) with check (true);
create policy "public delete" on public.tournaments for delete using (true);
