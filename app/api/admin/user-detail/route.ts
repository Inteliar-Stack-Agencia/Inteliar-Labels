import { NextRequest, NextResponse } from "next/server"
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

// GET /api/admin/user-detail?userId=...
// Returns { templates: [...], jobs: [...] } for the given user, so the admin
// can see what a user is actually building and printing (demand insight).
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const userId = req.nextUrl.searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

  const [{ data: templates }, { data: jobs }, { data: events }] = await Promise.all([
    supabaseAdmin
      .from("templates")
      .select("name, width_mm, height_mm, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("print_jobs")
      .select("name, total_labels, status, printer_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    // user_events may not exist until the migration is applied — errors here
    // just yield null and the milestones show as "not done".
    supabaseAdmin
      .from("user_events")
      .select("event, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ])

  const evs = events ?? []
  const firstOf = (name: string) => {
    const matches = evs.filter((e: { event: string }) => e.event === name)
    return matches.length ? matches[matches.length - 1].created_at : null
  }

  return NextResponse.json({
    templates: templates ?? [],
    jobs: jobs ?? [],
    milestones: {
      excelDownloaded: firstOf("excel_downloaded"),
      agentDownloaded: firstOf("agent_downloaded"),
      agentConnected: firstOf("agent_connected"),
    },
  })
}
