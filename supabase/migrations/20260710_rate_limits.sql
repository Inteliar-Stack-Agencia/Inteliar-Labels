-- Generic sliding-window rate limiter backed by Postgres, used by
-- security-sensitive public API routes (license validate/activate, etc).
create table if not exists public.api_rate_limits (
  id            text primary key,        -- `${bucket}:${identifier}`
  count         int not null default 1,
  window_start  timestamptz not null default now()
);

-- No public access — only accessed via service role from API routes.
alter table public.api_rate_limits enable row level security;
create policy "No public access" on public.api_rate_limits
  for all using (false);
