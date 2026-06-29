-- Add user_id to licenses table for linking licenses to registered users
alter table public.licenses
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists licenses_user_id_idx on public.licenses (user_id);
create index if not exists licenses_email_idx on public.licenses (email);
