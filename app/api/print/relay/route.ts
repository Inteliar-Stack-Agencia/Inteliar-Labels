import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser() {
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
  return user
}

async function proLicenseFor(userId: string) {
  const { data } = await supabaseAdmin
    .from("licenses")
    .select("key, plan, status")
    .eq("user_id", userId)
    .in("plan", ["pro", "lifetime"])
    .eq("status", "active")
    .limit(1)
    .maybeSingle()
  return data
}

// GET /api/print/relay — list this account's remote printers + online status
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const license = await proLicenseFor(user.id)
  if (!license) return NextResponse.json({ printers: [] })

  const { data: conns } = await supabaseAdmin
    .from("agent_connections")
    .select("printer_id, printer_name, connection, status, last_seen")
    .eq("license_key", license.key)
    .order("printer_name")

  const now = Date.now()
  const printers = (conns ?? []).map((c) => ({
    id: c.printer_id,
    name: c.printer_name,
    connection: c.connection,
    online: c.status === "online" && now - new Date(c.last_seen).getTime() <= 120000,
    lastSeen: c.last_seen,
  }))
  return NextResponse.json({ printers })
}

// POST /api/print/relay — enqueue a cloud print job for a remote agent.
// Body: { printerId, type?: 'zpl'|'tspl', data: string }
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { printerId, type, data } = await req.json()
  if (!printerId || !data) {
    return NextResponse.json({ error: "Faltan campos: printerId, data" }, { status: 400 })
  }

  const license = await proLicenseFor(user.id)
  if (!license) {
    return NextResponse.json(
      { error: "La impresión remota vía nube requiere plan Pro o Empresa." },
      { status: 403 }
    )
  }

  const { data: conn } = await supabaseAdmin
    .from("agent_connections")
    .select("status, last_seen, printer_name")
    .eq("license_key", license.key)
    .eq("printer_id", printerId)
    .maybeSingle()

  if (!conn) {
    return NextResponse.json({ error: "Impresora no encontrada en tu cuenta" }, { status: 404 })
  }
  const staleMs = Date.now() - new Date(conn.last_seen).getTime()
  if (conn.status !== "online" || staleMs > 120000) {
    return NextResponse.json(
      { error: `La impresora "${conn.printer_name}" está desconectada.` },
      { status: 409 }
    )
  }

  const { data: job, error } = await supabaseAdmin
    .from("print_jobs")
    .insert({
      license_key: license.key,
      printer_id: printerId,
      payload: { type: type ?? "zpl", data },
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobId: job.id })
}
