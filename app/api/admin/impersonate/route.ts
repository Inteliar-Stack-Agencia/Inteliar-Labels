import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { requireAdmin, isAdminEmail } from "@/lib/require-admin"
import { logAdminAction } from "@/lib/admin-audit-log"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/impersonate  { userId }
// Returns a one-time URL that opens a session AS that user (support mode).
// The admin is expected to open it in an incognito window so their own admin
// session isn't replaced. Every use is recorded in admin_audit_log.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { userId } = await req.json().catch(() => ({}))
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 })

  const { data: target, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error || !target?.user?.email) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  // Never impersonate another admin account.
  if (isAdminEmail(target.user.email)) {
    return NextResponse.json({ error: "No se puede entrar como otro administrador" }, { status: 403 })
  }

  const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: target.user.email,
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkErr || !tokenHash) {
    console.error("[admin/impersonate] generateLink failed:", linkErr?.message)
    return NextResponse.json({ error: "No se pudo generar el acceso" }, { status: 500 })
  }

  await logAdminAction(supabaseAdmin, admin.email ?? "unknown", "user.impersonate", target.user.email)

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
  return NextResponse.json({
    url: `${origin}/auth/impersonate?token_hash=${encodeURIComponent(tokenHash)}`,
    email: target.user.email,
  })
}
