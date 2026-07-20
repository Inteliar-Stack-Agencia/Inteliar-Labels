-- CRITICAL FIX for a two-part incident. Run this whole file as one script.
--
-- Part 1 — what the 2026-07-17 print relay migration broke:
--   It ran `create table if not exists print_jobs (...)` with the relay's
--   own schema (license_key, printer_id, payload, status, result, error,
--   created_at, completed_at). Checking information_schema in prod showed
--   this was NOT a no-op — the app's real print_jobs table (user_id,
--   template_id, name, status, total_labels, printed_labels, printer_name,
--   error_message, source_file, created_at, completed_at), used everywhere
--   (/upload, /imprimir, /jobs, /jobs/[id], /history, /dashboard, admin
--   stats, plan limits), never existed as an actual Postgres table before
--   that migration. So the relay migration's CREATE TABLE actually created
--   print_jobs for the first time — with the wrong (relay) schema — turning
--   a pre-existing "table missing" bug into a "column missing" bug and
--   masking it further by also enabling RLS with zero policies on it.
--
-- Part 2 — the fix:
--   1. Rename the relay-schema table (created 07-17) to relay_print_jobs,
--      where it always should have lived, and give it its own RLS (no
--      public policies — relay access goes through the service role).
--   2. Create the app's real print_jobs table with the schema every page
--      already assumes, with an owner-based RLS policy (auth.uid() =
--      user_id), matching the pattern used by print_favorites/saved_lists.
--   3. Re-point print_job_rows.job_id (which already existed correctly) at
--      the new print_jobs, since the rename in step 1 carried its old FK
--      along to relay_print_jobs.
--   4. Lock down print_job_rows with RLS too (ownership via the parent
--      job's user_id, since rows have no user_id column of their own) —
--      it was never confirmed to have RLS before.
--   5. Rename the relay's connections table so this exact collision can't
--      recur, and give it RLS too.

-- 1) Take print_jobs (still the relay-schema table at this point) out of
--    the realtime publication BEFORE renaming it — dropping it from the
--    publication by its post-rename name would fail with "relation does
--    not exist" instead of the expected "not in publication" error.
do $$
begin
  alter publication supabase_realtime drop table public.print_jobs;
exception
  when others then null; -- not in the publication, or table already renamed — fine either way
end $$;

-- 2) Move the relay-schema table out of the app's namespace.
alter table if exists public.print_jobs rename to relay_print_jobs;

alter table if exists public.relay_print_jobs
  add column if not exists license_key text,
  add column if not exists printer_id text,
  add column if not exists payload jsonb,
  add column if not exists result jsonb,
  add column if not exists error text;

do $$
begin
  alter table public.relay_print_jobs
    add constraint relay_print_jobs_license_key_fkey
    foreign key (license_key) references public.licenses(key) on delete cascade;
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_relay_print_jobs_license_status on public.relay_print_jobs(license_key, status);
create index if not exists idx_relay_print_jobs_created on public.relay_print_jobs(created_at);

alter table public.relay_print_jobs enable row level security;
-- No public policies: relay reads/writes go through the service role via
-- app/api/print/relay/*.

do $$
begin
  alter publication supabase_realtime add table public.relay_print_jobs;
exception
  when duplicate_object then null;
end $$;

-- 3) Create the app's real print_jobs table with the schema every page
--    already assumes.
create table public.print_jobs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  template_id    uuid references public.templates(id) on delete set null,
  name           text not null,
  status         text not null default 'pending', -- pending | completed | error
  total_labels   int not null default 0,
  printed_labels int not null default 0,
  printer_name   text,
  error_message  text,
  source_file    text,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index print_jobs_user_idx on public.print_jobs (user_id, created_at desc);

alter table public.print_jobs enable row level security;

create policy "Users manage their own print jobs" on public.print_jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Re-point print_job_rows.job_id at the new print_jobs (it currently
--    references relay_print_jobs after the rename in step 2).
do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
  where tc.table_schema = 'public'
    and tc.table_name = 'print_job_rows'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'job_id'
  limit 1;

  if fk_name is not null then
    execute format('alter table public.print_job_rows drop constraint %I', fk_name);
  end if;
end $$;

-- print_jobs is freshly (re)created and empty, so every existing
-- print_job_rows row is an orphan pointing at a job id from whatever table
-- used to occupy the print_jobs name — safe to discard, they were never
-- reachable through the app (every read joins through print_jobs anyway).
delete from public.print_job_rows
where job_id not in (select id from public.print_jobs);

alter table public.print_job_rows
  add constraint print_job_rows_job_id_fkey
  foreign key (job_id) references public.print_jobs(id) on delete cascade;

-- 5) print_job_rows was never confirmed to have RLS — lock it down too.
alter table public.print_job_rows enable row level security;

drop policy if exists "Users manage their own print job rows" on public.print_job_rows;
create policy "Users manage their own print job rows" on public.print_job_rows
  for all using (
    exists (
      select 1 from public.print_jobs pj
      where pj.id = print_job_rows.job_id and pj.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.print_jobs pj
      where pj.id = print_job_rows.job_id and pj.user_id = auth.uid()
    )
  );

-- 6) Rename the relay's connections table so a bare "agent_connections"
--    collision can't happen again either.
alter table if exists public.agent_connections rename to relay_agent_connections;
alter table if exists public.relay_agent_connections enable row level security;
