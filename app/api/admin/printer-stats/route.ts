import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) return null
  return user
}

// GET /api/admin/printer-stats
// Aggregates printer usage across all users, grouped by full model and by
// brand — useful to spot the most common hardware (compatibility priorities,
// commercial partnerships).
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data } = await supabaseAdmin
    .from("print_jobs")
    .select("printer_name, user_id")
    .not("printer_name", "is", null)

  const rows = (data ?? []) as { printer_name: string | null; user_id: string }[]

  const models = new Map<string, { jobs: number; users: Set<string> }>()
  const brands = new Map<string, { jobs: number; users: Set<string> }>()

  for (const r of rows) {
    const name = (r.printer_name ?? "").trim()
    if (!name) continue
    // brand = first word (Zebra, Honeywell, TSC, Citizen, Sato...)
    const brand = name.split(/[\s(]/)[0] || name

    if (!models.has(name)) models.set(name, { jobs: 0, users: new Set() })
    const m = models.get(name)!
    m.jobs++; m.users.add(r.user_id)

    if (!brands.has(brand)) brands.set(brand, { jobs: 0, users: new Set() })
    const b = brands.get(brand)!
    b.jobs++; b.users.add(r.user_id)
  }

  const toSorted = (map: Map<string, { jobs: number; users: Set<string> }>) =>
    Array.from(map.entries())
      .map(([name, v]) => ({ name, jobs: v.jobs, users: v.users.size }))
      .sort((a, b) => b.users - a.users || b.jobs - a.jobs)

  return NextResponse.json({
    models: toSorted(models),
    brands: toSorted(brands),
  })
}
