-- Saved lists: reusable Excel/CSV data the user uploaded.
-- The data is stored so it can be re-loaded and EDITED before printing
-- (prices change, so it is never treated as a frozen template).

create table if not exists public.saved_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  file_name   text,
  columns     jsonb not null default '[]',   -- ["producto","precio",...]
  rows        jsonb not null default '[]',   -- [{producto:"x", precio:"100"}, ...]
  row_count   int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists saved_lists_user_idx on public.saved_lists (user_id);

-- Reuse the shared updated_at trigger function (created in licenses migration)
drop trigger if exists saved_lists_updated_at on public.saved_lists;
create trigger saved_lists_updated_at
  before update on public.saved_lists
  for each row execute function public.set_updated_at();

-- RLS: users only see/manage their own lists
alter table public.saved_lists enable row level security;

drop policy if exists "Users manage own lists" on public.saved_lists;
create policy "Users manage own lists" on public.saved_lists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
