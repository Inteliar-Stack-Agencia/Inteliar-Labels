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

// POST /api/admin/user-stats
// Body: { userIds: string[] }
// Returns: Record<userId, { templates: number, labelsMonth: number, jobsMonth: number, lastActive: string | null }>
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { userIds } = await req.json()
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({})
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { data: templates },
    { data: jobs },
  ] = await Promise.all([
    supabaseAdmin
      .from("templates")
      .select("user_id")
      .in("user_id", userIds),
    supabaseAdmin
      .from("print_jobs")
      .select("user_id, total_labels, status, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
  ])

  const result: Record<string, {
    templates: number
    labelsMonth: number
    jobsMonth: number
    lastActive: string | null
  }> = {}

  for (const uid of userIds) {
    const userTemplates = (templates ?? []).filter((t: { user_id: string }) => t.user_id === uid)
    const userJobs = (jobs ?? []).filter((j: { user_id: string }) => j.user_id === uid)
    const monthJobs = userJobs.filter(
      (j: { created_at: string; status: string }) =>
        j.status === "completed" && new Date(j.created_at) >= startOfMonth
    )
    const labelsMonth = monthJobs.reduce(
      (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
      0
    )
    const lastJob = userJobs[0] as { created_at: string } | undefined

    result[uid] = {
      templates: userTemplates.length,
      labelsMonth,
      jobsMonth: monthJobs.length,
      lastActive: lastJob?.created_at ?? null,
    }
  }

  return NextResponse.json(result)
}
