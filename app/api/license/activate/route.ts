import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Rate limit per user (not just IP) — this is an authenticated endpoint,
  // so a single account is the natural abuse unit for brute-forcing keys.
  const ip = getClientIp(req)
  const { allowed } = await checkRateLimit(supabaseAdmin, "license-activate", user.id, 5, 15 * 60)
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Probá de nuevo en unos minutos." }, { status: 429 })
  }
  await checkRateLimit(supabaseAdmin, "license-activate-ip", ip, 10, 15 * 60)

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "Clave requerida" }, { status: 400 })

  const normalizedKey = key.trim().toUpperCase()

  // Buscar la licencia por clave
  const { data: license } = await supabaseAdmin
    .from("licenses")
    .select("id, user_id, email, status, expires_at")
    .eq("key", normalizedKey)
    .maybeSingle()

  if (!license) return NextResponse.json({ error: "Clave inválida" }, { status: 404 })
  if (license.status !== "active") return NextResponse.json({ error: "Licencia inactiva o vencida" }, { status: 400 })
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return NextResponse.json({ error: "Licencia vencida" }, { status: 400 })
  }
  if (license.user_id && license.user_id !== user.id) {
    return NextResponse.json({ error: "Esta clave ya está activada en otra cuenta" }, { status: 409 })
  }

  // A license created from a payment carries the buyer's email but no user_id
  // until claimed here. Without this check, any logged-in account that gets
  // hold of the key (leaked, screenshotted, guessed) could claim someone
  // else's paid license. Only enforce the match when the license actually
  // has an email on file — admin-issued keys without one stay claimable by
  // whoever the admin hands the key to.
  if (!license.user_id && license.email && license.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json(
      { error: "Esta clave pertenece a otra cuenta. Iniciá sesión con el email con el que compraste." },
      { status: 403 }
    )
  }

  // Vincular la licencia al usuario
  await supabaseAdmin
    .from("licenses")
    .update({ user_id: user.id })
    .eq("id", license.id)

  return NextResponse.json({ ok: true })
}
