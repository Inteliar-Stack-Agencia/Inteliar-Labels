-- Payment events log: one row per approved payment webhook received.
create table if not exists public.payment_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,               -- 'mercadopago' | 'stripe'
  payment_id    text not null,               -- provider's payment/session id
  email         text,
  amount        numeric,                     -- in provider currency
  currency      text default 'ARS',
  plan          text not null,               -- 'monthly' | 'lifetime'
  license_key   text,                        -- key that was created/returned
  license_created boolean not null default false,
  raw           jsonb,                       -- full provider payload (for debugging)
  created_at    timestamptz not null default now()
);

create unique index if not exists payment_events_payment_id_idx
  on public.payment_events (provider, payment_id);

create index if not exists payment_events_email_idx on public.payment_events (email);
create index if not exists payment_events_created_at_idx on public.payment_events (created_at desc);

-- Only service role / admin can access (no RLS user access needed)
alter table public.payment_events enable row level security;

drop policy if exists "Admin only" on public.payment_events;
create policy "Admin only" on public.payment_events
  for all using (false);  -- blocked for all anon/auth users; only service role bypasses RLS
