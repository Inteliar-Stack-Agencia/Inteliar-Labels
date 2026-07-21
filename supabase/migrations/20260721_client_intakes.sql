-- Formulario de alta de cliente para campañas de marketing (herramienta
-- interna de Inteliar, no específica de este producto). Vive en este
-- proyecto de Supabase para no generar un proyecto pago nuevo, pero el
-- código que la usa está en un repo aparte (inteliar-client-intake).
create table if not exists public.client_intakes (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  client_name               text not null,
  product                   text not null,
  country                   text not null,
  daily_budget              numeric,
  landing_url               text not null,
  objective                 text not null,
  has_google_ads_account    boolean not null default false,
  google_ads_customer_id    text,
  has_ga4                   boolean not null default false,
  has_conversion_tag        boolean not null default false,
  previous_campaigns_notes  text,
  notes                     text
);

-- Sin acceso público — se escribe/lee solo vía service role desde las
-- API routes del formulario (mismo patrón que api_rate_limits).
alter table public.client_intakes enable row level security;
create policy "No public access" on public.client_intakes
  for all using (false);
