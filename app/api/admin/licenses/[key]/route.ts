import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { maxDevicesForPlan } from "@/lib/license-utils"
import type { LicenseActivation } from "@/lib/license-utils"
import { logAdminAction } from "@/lib/admin-audit-log"

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

// PATCH /api/admin/licenses/[key] — update status, plan, email, notes, or remove a device
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { key } = await params
  const body = await req.json()

  const { data: license, error: fetchErr } = await supabaseAdmin
    .from("licenses").select("*").eq("key", key).single()
  if (fetchErr || !license) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const updates: Record<string, unknown> = {}

  if (body.status !== undefined) updates.status = body.status
  if (body.email !== undefined) updates.email = body.email
  if (body.notes !== undefined) updates.notes = body.notes

  if (body.plan !== undefined) {
    updates.plan = body.plan
    updates.max_devices = maxDevicesForPlan(body.plan)
    if (body.plan === "lifetime") {
      updates.expires_at = null
    } else if (!license.expires_at) {
      updates.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  // Remove a specific device activation
  if (body.remove_device_id) {
    const activations: LicenseActivation[] = license.activations ?? []
    updates.activations = activations.filter((a) => a.device_id !== body.remove_device_id)
  }

  // Extend monthly subscription by 30 days from today (or from current expiry if future)
  if (body.extend_days) {
    const base = license.expires_at && new Date(license.expires_at) > new Date()
      ? new Date(license.expires_at)
      : new Date()
    updates.expires_at = new Date(base.getTime() + body.extend_days * 24 * 60 * 60 * 1000).toISOString()
    if (license.status === "expired") updates.status = "active"
  }

  const { data, error } = await supabaseAdmin.from("licenses").update(updates).eq("key", key).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction(supabaseAdmin, user.email ?? "unknown", "license.update", key, updates)
  return NextResponse.json(data)
}

// DELETE /api/admin/licenses/[key] — permanently delete a license
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { key } = await params
  const { error } = await supabaseAdmin.from("licenses").delete().eq("key", key)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAdminAction(supabaseAdmin, user.email ?? "unknown", "license.delete", key)
  return NextResponse.json({ success: true })
}
