-- Audit trail for admin actions (license edits, announcements, trial
-- extensions, etc). Lets us answer "who changed what and when" — there was
-- no record of this before.
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action      text not null,          -- e.g. "license.update", "announcement.delete"
  target      text,                   -- e.g. license key, announcement id
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

-- No public access — only accessed via service role from API routes.
alter table public.admin_audit_log enable row level security;
create policy "No public access" on public.admin_audit_log
  for all using (false);
