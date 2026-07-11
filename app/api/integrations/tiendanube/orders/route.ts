import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { fetchOrderRows, isTiendanubeConfigured, type ImportMode } from "@/lib/tiendanube"
import { checkRateLimit } from "@/lib/rate-limit"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/integrations/tiendanube/orders
// Body: { mode: "shipping" | "product" }
export async function POST(req: NextRequest) {
  if (!isTiendanubeConfigured()) {
    return NextResponse.json({ error: "La conexión de cuenta con Tiendanube todavía no está disponible." }, { status: 501 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { allowed } = await checkRateLimit(supabaseAdmin, "tn-orders-sync", user.id, 10, 5 * 60)
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas sincronizaciones seguidas. Esperá unos minutos." }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const mode: ImportMode = body.mode === "product" ? "product" : "shipping"

  try {
    const { columns, rows } = await fetchOrderRows(user.id, mode)
    if (rows.length === 0) {
      return NextResponse.json({ error: "No encontramos órdenes pagas recientes." }, { status: 404 })
    }
    return NextResponse.json({ columns, rows, total: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
