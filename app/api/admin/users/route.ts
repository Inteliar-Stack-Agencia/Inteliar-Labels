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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  // List all auth users via admin API
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all licenses (to join)
  const { data: licenses } = await supabaseAdmin
    .from("licenses")
    .select("user_id, key, plan, status, expires_at")

  const licenseByUser: Record<string, { key: string; plan: string; status: string; expires_at: string | null }> = {}
  for (const l of licenses ?? []) {
    if (l.user_id) licenseByUser[l.user_id] = l
  }

  const result = users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    whatsapp: (u.user_metadata?.whatsapp as string | undefined) ?? u.phone ?? null,
    name: ((u.user_metadata?.full_name as string | undefined)
      ?? [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ")).trim() || null,
    license: licenseByUser[u.id] ?? null,
  }))

  return NextResponse.json(result)
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// POST /api/admin/users — manually create a user, exactly like a landing
// signup (same metadata shape as app/auth/register), so the 15-day trial
// (computed from auth.users.created_at) kicks in the same way.
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { firstName, lastName, email, countryCode, phone } = await req.json()
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const whatsapp = `${countryCode || "+54"}${String(phone).replace(/\D/g, "")}`
  const password = generatePassword()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true, // admin-created: skip the confirmation email step
    user_metadata: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      whatsapp,
      created_by_admin: true,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Fire-and-forget welcome email, same as a real landing signup
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://etiquetar.app"}/api/auth/welcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  }).catch(() => {})

  return NextResponse.json({ id: data.user.id, email: data.user.email, password })
}
