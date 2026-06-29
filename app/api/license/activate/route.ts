import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

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

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "Clave requerida" }, { status: 400 })

  const normalizedKey = key.trim().toUpperCase()

  // Buscar la licencia por clave
  const { data: license } = await supabaseAdmin
    .from("licenses")
    .select("id, user_id, status, expires_at")
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

  // Vincular la licencia al usuario
  await supabaseAdmin
    .from("licenses")
    .update({ user_id: user.id })
    .eq("id", license.id)

  return NextResponse.json({ ok: true })
}
