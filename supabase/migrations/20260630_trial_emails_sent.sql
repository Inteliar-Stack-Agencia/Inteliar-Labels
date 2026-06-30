create table if not exists public.trial_emails_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  day integer not null,
  sent_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists trial_emails_sent_user_id_idx on public.trial_emails_sent (user_id);

alter table public.trial_emails_sent enable row level security;
create policy "No public access" on public.trial_emails_sent for all using (false);
