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

  const [{ data: templates }, { data: jobs }] = await Promise.all([
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
  ])

  return NextResponse.json({
    templates: templates ?? [],
    jobs: jobs ?? [],
  })
}
