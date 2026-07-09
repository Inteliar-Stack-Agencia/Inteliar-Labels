-- Saved "quick print" shortcuts: a template + a fixed set of rows
-- (data + quantity), so a user who prints the same 40 labels every day
-- doesn't have to re-type anything — one click from the dashboard jumps
-- straight to the print confirmation step.
create table if not exists public.print_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid not null references public.templates(id) on delete cascade,
  name         text not null,
  rows         jsonb not null default '[]',  -- [{data: {var: value}, quantity: n}, ...]
  total_labels int not null default 0,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  use_count    int not null default 0
);

create index if not exists print_favorites_user_idx on public.print_favorites (user_id, created_at desc);

alter table public.print_favorites enable row level security;

-- Users can fully manage their own favorites directly (no service-role
-- indirection needed here, same as saved_lists).
create policy "Users manage their own favorites" on public.print_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
