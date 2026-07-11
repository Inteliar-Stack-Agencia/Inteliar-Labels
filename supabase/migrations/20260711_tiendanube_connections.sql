-- Stores the OAuth token for a seller's Tiendanube store connection, one per
-- app user. Unlike Mercado Libre, Tiendanube access tokens don't expire, so
-- there's no refresh_token to keep. Tokens are only ever read/written
-- server-side with the service role key — never exposed to the client.
create table if not exists public.tiendanube_connections (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  store_id     text not null,
  access_token text not null,
  scope        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists tiendanube_connections_updated_at on public.tiendanube_connections;
create trigger tiendanube_connections_updated_at
  before update on public.tiendanube_connections
  for each row execute function public.set_updated_at();

alter table public.tiendanube_connections enable row level security;
create policy "No public access" on public.tiendanube_connections
  for all using (false);
