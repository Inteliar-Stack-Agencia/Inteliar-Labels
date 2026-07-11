-- Manual checklist state for the "Datos de comprador" screen in
-- /integraciones: lets a user mark a Mercado Libre order as prepared/shipped
-- without printing anything, and keep that state across visits. Rows are
-- archived or deleted manually — there's no automatic expiry.
create table if not exists public.ml_order_checklist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  order_id     text not null,
  preparado    boolean not null default false,
  despachado   boolean not null default false,
  archivado    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, order_id)
);

create index if not exists ml_order_checklist_user_idx on public.ml_order_checklist (user_id, archivado);

drop trigger if exists ml_order_checklist_updated_at on public.ml_order_checklist;
create trigger ml_order_checklist_updated_at
  before update on public.ml_order_checklist
  for each row execute function public.set_updated_at();

alter table public.ml_order_checklist enable row level security;

create policy "Users manage their own checklist" on public.ml_order_checklist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
