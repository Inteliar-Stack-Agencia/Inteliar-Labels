-- Cloud print relay: lets a browser enqueue a print job for an agent that is
-- not on the same machine/network. Agents subscribe to their own jobs via
-- Supabase Realtime and report back the result.

create table if not exists agent_connections (
  id uuid primary key default gen_random_uuid(),
  license_key text not null references licenses(key) on delete cascade,
  printer_id text not null,
  printer_name text not null,
  connection text not null,               -- 'tcp' | 'usb' | 'serial' | 'simulate'
  device_id text,
  last_seen timestamptz not null default now(),
  status text not null default 'online',  -- 'online' | 'offline'
  created_at timestamptz not null default now(),
  unique (license_key, printer_id)
);

create index if not exists idx_agent_connections_license on agent_connections(license_key);

create table if not exists print_jobs (
  id uuid primary key default gen_random_uuid(),
  license_key text not null references licenses(key) on delete cascade,
  printer_id text not null,
  payload jsonb not null,                 -- { type: 'zpl'|'tspl', data: string }
  status text not null default 'pending', -- pending | done | error | timeout
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_print_jobs_license_status on print_jobs(license_key, status);
create index if not exists idx_print_jobs_created on print_jobs(created_at);

-- Realtime: agents subscribe to INSERTs on print_jobs filtered by license_key.
alter publication supabase_realtime add table print_jobs;

-- RLS: access is mediated by the service role (API routes + agent use the
-- service key or an authenticated context). Enable RLS and add no public
-- policies so anon cannot read other tenants' jobs directly.
alter table agent_connections enable row level security;
alter table print_jobs enable row level security;
