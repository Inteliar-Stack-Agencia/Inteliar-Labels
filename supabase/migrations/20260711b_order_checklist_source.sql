-- Extends ml_order_checklist to also cover Tiendanube orders: order numbers
-- aren't globally unique across marketplaces, so we tag each row with its
-- source and scope the uniqueness constraint accordingly.
alter table public.ml_order_checklist add column if not exists source text not null default 'ml';

alter table public.ml_order_checklist drop constraint if exists ml_order_checklist_user_id_order_id_key;
alter table public.ml_order_checklist add constraint ml_order_checklist_user_source_order_key
  unique (user_id, source, order_id);
