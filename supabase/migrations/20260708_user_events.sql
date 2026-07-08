-- Lightweight per-user event log so the admin panel can show engagement
-- milestones (downloaded the Excel template, downloaded the print agent, etc.)
-- that aren't otherwise stored in the database.

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_events_user_id_idx on public.user_events(user_id);
create index if not exists user_events_event_idx on public.user_events(event);

alter table public.user_events enable row level security;

-- A user can log and read their own events. The admin panel reads through the
-- service-role key, which bypasses RLS.
drop policy if exists "user_events insert own" on public.user_events;
create policy "user_events insert own" on public.user_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_events select own" on public.user_events;
create policy "user_events select own" on public.user_events
  for select using (auth.uid() = user_id);
