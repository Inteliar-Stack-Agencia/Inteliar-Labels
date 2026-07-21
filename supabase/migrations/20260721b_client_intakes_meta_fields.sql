-- Sumar verificación de datos para campañas de Meta Ads (Business Manager,
-- Pixel, cuenta publicitaria) al formulario de alta de cliente.
alter table public.client_intakes
  add column if not exists has_meta_business_manager    boolean not null default false,
  add column if not exists has_meta_pixel                boolean not null default false,
  add column if not exists has_meta_ad_account_linked    boolean not null default false;
