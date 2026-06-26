import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { generateLicenseKey, maxDevicesForPlan } from "@/lib/license-utils"

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

// GET /api/admin/licenses — list all licenses
export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q") ?? ""

  let query = supabaseAdmin.from("licenses").select("*").order("created_at", { ascending: false })
  if (search) {
    query = query.or(`key.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/licenses — create a new license
export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const plan: "monthly" | "lifetime" = body.plan ?? "monthly"
  const email: string = body.email ?? ""
  const notes: string = body.notes ?? ""

  // Monthly: expires in 30 days from now; lifetime: no expiry
  const expires_at = plan === "monthly"
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabaseAdmin.from("licenses").insert({
    key: generateLicenseKey(),
    plan,
    email,
    notes,
    max_devices: maxDevicesForPlan(plan),
    expires_at,
    activations: [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
