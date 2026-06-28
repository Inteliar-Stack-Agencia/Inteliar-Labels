-- Stores manual trial extensions granted by admins
create table if not exists public.trial_extensions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  extra_days integer not null default 7,
  granted_by text,
  granted_at timestamptz not null default now()
);

alter table public.trial_extensions enable row level security;

-- Users can read their own extension (so the hook can pick it up)
create policy "Users read own extension"
  on public.trial_extensions for select
  using (auth.uid() = user_id);

-- Only service role can insert/update
create policy "Admin only write"
  on public.trial_extensions for all
  using (false);
