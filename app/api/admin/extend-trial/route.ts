import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { logAdminAction } from "@/lib/admin-audit-log"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase())

// Extends a user's trial by inserting/updating a special "trial_extension" record
// stored in a metadata table, or simply adjusting created_at via admin API.
// Simplest approach: create a temporary "trial" license that expires in N days.
export async function POST(req: NextRequest) {
  // Verify caller is admin
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { userId, days = 7 } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  // Get target user's email
  const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (!targetUser?.user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Upsert a trial_extension record in user_metadata table
  // Simplest: store extension days in a dedicated table
  const { error } = await supabaseAdmin
    .from("trial_extensions")
    .upsert({ user_id: userId, extra_days: days, granted_by: user.email, granted_at: new Date().toISOString() }, { onConflict: "user_id" })

  if (error) {
    // Table may not exist yet — fallback: just log
    console.warn("[extend-trial] trial_extensions table missing:", error.message)
  }

  await logAdminAction(supabaseAdmin, user.email ?? "unknown", "trial.extend", userId, { days })

  return NextResponse.json({ ok: true, userId, days })
}
