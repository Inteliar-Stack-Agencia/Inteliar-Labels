import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { requireAdmin } from "@/lib/require-admin"
import { logAdminAction } from "@/lib/admin-audit-log"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/user-view?userId=...
// Read-only snapshot of a user's account for support: profile, license and
// devices, printers seen by the agent, templates (with their design) and
// recent print jobs (with the first row's data). Never mutates anything.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

  const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userErr || !userRes?.user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  const u = userRes.user

  const [{ data: licenses }, { data: templates }, { data: jobs }, { data: extension }] = await Promise.all([
    supabaseAdmin
      .from("licenses")
      .select("key, plan, status, expires_at, max_devices, activations, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("templates")
      .select("id, name, width_mm, height_mm, variables, canvas_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("print_jobs")
      .select("id, name, total_labels, printed_labels, status, printer_name, error_message, source_file, template_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin.from("trial_extensions").select("extra_days").eq("user_id", userId).maybeSingle(),
  ])

  const keys = (licenses ?? []).map((l) => l.key)
  const jobIds = (jobs ?? []).map((j) => j.id)

  const [{ data: printers }, { data: firstRows }] = await Promise.all([
    keys.length
      ? supabaseAdmin
          .from("agent_connections")
          .select("printer_name, connection, status, last_seen")
          .in("license_key", keys)
      : Promise.resolve({ data: [] as { printer_name: string; connection: string; status: string; last_seen: string }[] }),
    jobIds.length
      ? supabaseAdmin.from("print_job_rows").select("job_id, row_data").in("job_id", jobIds).eq("row_index", 0)
      : Promise.resolve({ data: [] as { job_id: string; row_data: Record<string, string> }[] }),
  ])

  const firstRowByJob: Record<string, Record<string, string>> = {}
  for (const r of firstRows ?? []) firstRowByJob[r.job_id] = r.row_data

  await logAdminAction(supabaseAdmin, admin.email ?? "unknown", "user.view", u.email ?? userId)

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      name: ((u.user_metadata?.full_name as string | undefined)
        ?? [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ")).trim() || null,
      whatsapp: (u.user_metadata?.whatsapp as string | undefined) ?? u.phone ?? null,
      trialExtraDays: extension?.extra_days ?? 0,
    },
    licenses: licenses ?? [],
    printers: printers ?? [],
    templates: templates ?? [],
    jobs: (jobs ?? []).map((j) => ({ ...j, firstRow: firstRowByJob[j.id] ?? null })),
  })
}
