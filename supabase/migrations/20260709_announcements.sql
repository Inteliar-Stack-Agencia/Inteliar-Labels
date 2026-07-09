-- Admin-authored announcements shown as a dismissible banner in the dashboard
-- (promos, "we improved X", etc.). Users see the latest active one and can
-- dismiss it; a new announcement reappears.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  cta_label text,
  cta_url text,
  variant text not null default 'info', -- info | promo | success
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements(active, created_at desc);

alter table public.announcements enable row level security;

-- Any authenticated user can read active announcements. Writes go through the
-- service-role key (admin API), which bypasses RLS.
drop policy if exists "announcements read active" on public.announcements;
create policy "announcements read active" on public.announcements
  for select using (active = true);
