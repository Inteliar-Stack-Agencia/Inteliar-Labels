-- CRITICAL FIX: migration 20260717_print_relay.sql did
--   `create table if not exists print_jobs (...)`
-- which was a no-op — the app's real print_jobs table already existed,
-- used by /upload, /jobs, /history, /dashboard, admin stats, plan limits —
-- with a completely different schema (user_id, template_id, name, status,
-- total_labels, printed_labels, source_file, printer_name, error_message).
--
-- But the migration then ran, against that SAME pre-existing table:
--   alter table print_jobs enable row level security;
--   alter publication supabase_realtime add table print_jobs;
-- with zero policies defined. RLS with no policies default-denies all
-- access, silently breaking every insert/select/update on the app's real
-- print_jobs table for every user since 2026-07-17 (job creation from
-- /upload just silently failed — no error surfaced in the UI either,
-- compounding the problem).
--
-- Fix: add the owner-based policy this table always needed (matching the
-- pattern used by print_favorites, saved_lists, etc.), drop it from the
-- realtime publication (never should have been added), and give the
-- relay's own queue tables names that can never collide with the app's
-- tables again.

-- 1) Restore access to the app's real print_jobs table.
create policy "Users manage their own print jobs" on public.print_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Undo the accidental realtime broadcast on the app's real table.
do $$
begin
  alter publication supabase_realtime drop table print_jobs;
exception
  when undefined_object then null;
end $$;

-- 3) Rename the (still-dormant, empty) relay connections table out of the
--    app's namespace so a collision like this can't happen again.
alter table if exists public.agent_connections rename to relay_agent_connections;

-- 4) The relay's own job queue table was never actually created under its
--    own name (step 2 of the original migration was a no-op against the
--    app's table) — create it now, correctly isolated.
create table if not exists public.relay_print_jobs (
  id uuid primary key default gen_random_uuid(),
  license_key text not null references public.licenses(key) on delete cascade,
  printer_id text not null,
  payload jsonb not null,
  status text not null default 'pending',
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_relay_print_jobs_license_status on public.relay_print_jobs(license_key, status);
create index if not exists idx_relay_print_jobs_created on public.relay_print_jobs(created_at);

alter table public.relay_print_jobs enable row level security;
-- No public policies: relay reads/writes go through the service role via
-- app/api/print/relay/*, same isolation model as before, just correctly
-- named this time.

do $$
begin
  alter publication supabase_realtime add table relay_print_jobs;
exception
  when duplicate_object then null;
end $$;

alter table if exists public.relay_agent_connections enable row level security;
