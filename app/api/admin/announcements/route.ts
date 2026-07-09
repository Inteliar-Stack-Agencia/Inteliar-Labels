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

// GET — list all announcements (admin)
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { data } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
  return NextResponse.json(data ?? [])
}

// POST — create a new announcement (and optionally deactivate the rest)
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ error: "Falta el título" }, { status: 400 })

  // Only one active at a time by default: deactivate others when creating active.
  if (body.active !== false) {
    await supabaseAdmin.from("announcements").update({ active: false }).eq("active", true)
  }

  const { data, error } = await supabaseAdmin
    .from("announcements")
    .insert({
      title: String(body.title).slice(0, 120),
      body: body.body ? String(body.body).slice(0, 500) : null,
      cta_label: body.cta_label ? String(body.cta_label).slice(0, 40) : null,
      cta_url: body.cta_url ? String(body.cta_url).slice(0, 500) : null,
      variant: ["info", "promo", "success"].includes(body.variant) ? body.variant : "info",
      active: body.active !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — toggle active { id, active }
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id, active } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 })
  if (active) {
    await supabaseAdmin.from("announcements").update({ active: false }).eq("active", true)
  }
  await supabaseAdmin.from("announcements").update({ active: !!active }).eq("id", id)
  return NextResponse.json({ ok: true })
}

// DELETE ?id=...
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 })
  await supabaseAdmin.from("announcements").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
