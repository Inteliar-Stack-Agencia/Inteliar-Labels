-- Add payment_ref to licenses for payment webhook idempotency
-- (MercadoPago / Stripe). Prevents creating duplicate licenses if a
-- webhook is delivered more than once.

alter table public.licenses
  add column if not exists payment_ref text;

create unique index if not exists licenses_payment_ref_idx
  on public.licenses (payment_ref)
  where payment_ref is not null;
