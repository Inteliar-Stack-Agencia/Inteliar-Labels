-- Licenses table for Inteliar Labels
create table if not exists public.licenses (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,           -- "INTELIAR-XXXX-XXXX-XXXX"
  plan          text not null default 'monthly' check (plan in ('monthly','lifetime')),
  status        text not null default 'active'  check (status in ('active','suspended','expired')),
  email         text,                            -- owner email (informational)
  notes         text,                            -- admin notes
  max_devices   int  not null default 1,
  activations   jsonb not null default '[]',    -- [{device_id, hostname, activated_at, last_seen}]
  expires_at    timestamptz,                     -- null = lifetime
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast key lookup (used by .exe on every start)
create index if not exists licenses_key_idx on public.licenses (key);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists licenses_updated_at on public.licenses;
create trigger licenses_updated_at
  before update on public.licenses
  for each row execute function public.set_updated_at();

-- RLS: only service role can read/write (admin API uses service role key)
alter table public.licenses enable row level security;

-- No public access — all operations go through server-side API routes
create policy "No public access" on public.licenses
  for all using (false);
