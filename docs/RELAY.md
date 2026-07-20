# Cloud print relay (cross-network Multipunto)

Status: **built, not activated**. Marked "Próximamente" on the landing (plan
Empresa). Do not enable for a real client without resolving the auth gap
below first.

## What it does

Lets a browser send a print job to an agent on a different network (e.g.
office → a store's printer in another city). See `components/landing/multipoint-section.tsx`
for the user-facing explanation and `printer-agent/src/relay.js` for the
agent-side implementation.

## Pieces already in place

- Migration `supabase/migrations/20260717_print_relay.sql` — original schema
  (see incident note below for why it needed a follow-up fix).
- Migration `supabase/migrations/20260719_fix_print_jobs_rls_and_relay_table_names.sql`
  — renamed the relay's tables to `relay_agent_connections` and
  `relay_print_jobs`, RLS enabled on both, no public policies.
- `printer-agent/src/relay.js` — agent connects outbound to Supabase using the
  anon key, registers its printers, subscribes to Realtime, prints and
  reports back. Only starts for `pro`/`lifetime` plans, and only if
  `SUPABASE_URL`/`SUPABASE_ANON_KEY` are present (env var or
  `agent-config.json`).
- `app/api/print/relay/route.ts` (+ `[id]/route.ts`) — browser-facing API to
  list remote printers and enqueue/poll jobs. Gated to pro/lifetime licenses.
- `lib/printer-agent-client.ts` — `listRemotePrinters()` / `sendViaCloudRelay()`.

## ⚠️ Incident: table name collision broke job creation app-wide (2026-07-17 → 2026-07-19)

The original migration used `create table if not exists print_jobs (...)` —
`print_jobs` was already the app's real, actively-used job-tracking table
(used by `/upload`, `/jobs`, `/history`, `/dashboard`, admin stats, plan
limits), so the `CREATE TABLE` was a silent no-op. The migration then ran
`alter table print_jobs enable row level security` with **zero policies**
against that same real table — RLS with no policies default-denies
everything, so every job creation (`/upload` → "Crear trabajo") silently
failed for every user for two days, with no error shown in the UI either.

Fixed in `20260719_fix_print_jobs_rls_and_relay_table_names.sql`: added the
missing owner policy on the app's `print_jobs`, and renamed the relay's own
tables to `relay_agent_connections` / `relay_print_jobs` so this specific
collision can't happen again. **Lesson for future migrations touching
shared-sounding table names**: check `\dt` / existing migrations for a name
collision before `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — `CREATE TABLE
IF NOT EXISTS` failing silently to warn you is the trap.

## The unresolved gap: agent auth vs RLS

`relay_agent_connections` and `relay_print_jobs` have RLS **enabled with no
policies**. The agent currently connects with the Supabase **anon key**. With
RLS on and no policies, anon can't read/write those tables — so as shipped,
the agent's `upsert`/`update` calls in `relay.js` will fail silently (caught
and logged, not fatal) once you actually try to use this.

Before turning this on for a real customer, pick one:

1. **(Recommended) Route agent writes through your own API instead of talking
   to Supabase directly.** The agent calls an authenticated endpoint (e.g.
   `POST /api/agent/heartbeat`, `POST /api/agent/jobs/:id/complete`) using its
   license key as the credential; the API uses the service role key
   server-side. More work up front, but no secrets/broad access ever ship
   inside the distributed agent binary.
2. **Add RLS policies scoped by license_key** and give the agent a scoped
   Supabase JWT (not the plain anon key) so anon key alone still can't read
   other tenants' rows. More complex to get right, avoid unless you have a
   specific reason to keep the agent talking to Supabase directly.

Nothing else needs to change to activate the feature once this is decided —
the DB schema and API routes already assume per-license isolation.

## Activation checklist (when a client needs it)

1. Resolve the auth gap above.
2. Confirm the migration ran in prod (it has, as of 2026-07-17).
3. Put `SUPABASE_URL` + `SUPABASE_ANON_KEY` in the agent's `agent-config.json`
   for that client's install, or set as env vars.
4. `cd printer-agent && npm install` to pull in `@supabase/supabase-js`.
5. Wire `sendViaCloudRelay` into `/imprimir` printer selection (currently the
   picker only talks to `localhost:9638`) — gate it behind "this printer is
   remote" so local printing is unaffected if the relay has issues.
6. Remove the "Próximamente" badge from `multipoint-section.tsx` and the FAQ
   entry once it's live for at least one paying customer.
