import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createLicense } from "@/lib/create-license"
import { sendOnboardingSaleEmail } from "@/lib/send-onboarding-sale-email"
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

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// POST /api/admin/onboard-sale — for a sale made outside the normal web
// checkout (Mercado Libre, transferencia, etc.): creates the user account,
// creates + links a license for the chosen plan, and sends ONE combined
// welcome email with login credentials + license key. Replaces manually
// copy-pasting those into a mail client after using "Crear usuario" +
// "Nueva licencia" separately.
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { firstName, lastName, email, countryCode, phone, plan } = await req.json()
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }
  if (plan !== "monthly" && plan !== "pro" && plan !== "lifetime") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
  }

  const whatsapp = `${countryCode || "+54"}${String(phone).replace(/\D/g, "")}`
  const password = generatePassword()
  const trimmedEmail = email.trim()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      whatsapp,
      created_by_admin: true,
    },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  let licenseKey: string
  try {
    const { license } = await createLicense({ plan, email: trimmedEmail, notes: "Venta externa (Mercado Libre / manual)", sendEmail: false })
    licenseKey = license.key
  } catch (e: any) {
    return NextResponse.json({ error: `Usuario creado pero falló la licencia: ${e.message}` }, { status: 500 })
  }

  try {
    await sendOnboardingSaleEmail(trimmedEmail, password, licenseKey, plan)
  } catch (e: any) {
    console.error("[onboard-sale] email failed:", e.message)
    // don't fail the request — admin still gets the credentials back to send manually
  }

  await logAdminAction(supabaseAdmin, admin.email ?? "unknown", "user.onboard_sale", trimmedEmail, { plan, licenseKey })

  return NextResponse.json({ id: data.user.id, email: data.user.email, password, licenseKey, plan })
}
