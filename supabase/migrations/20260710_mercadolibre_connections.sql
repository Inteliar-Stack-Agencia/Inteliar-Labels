-- Stores the OAuth tokens for a seller's Mercado Libre connection, one per
-- app user. Tokens are only ever read/written server-side with the service
-- role key — never exposed to the client.
create table if not exists public.mercadolibre_connections (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  ml_user_id    text not null,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Reuse the shared updated_at trigger function (created in licenses migration)
drop trigger if exists mercadolibre_connections_updated_at on public.mercadolibre_connections;
create trigger mercadolibre_connections_updated_at
  before update on public.mercadolibre_connections
  for each row execute function public.set_updated_at();

alter table public.mercadolibre_connections enable row level security;
create policy "No public access" on public.mercadolibre_connections
  for all using (false);
