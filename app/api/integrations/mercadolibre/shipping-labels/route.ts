import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { fetchShippingLabelsZpl, isMercadolibreConfigured } from "@/lib/mercadolibre"
import { checkRateLimit } from "@/lib/rate-limit"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/integrations/mercadolibre/shipping-labels
// Returns the raw ZPL for Mercado Libre's own official shipping labels
// (Mercado Envíos), ready to send straight to a thermal printer.
export async function POST() {
  if (!isMercadolibreConfigured()) {
    return NextResponse.json({ error: "La integración con Mercado Libre todavía no está disponible." }, { status: 501 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { allowed } = await checkRateLimit(supabaseAdmin, "ml-shipping-labels", user.id, 10, 5 * 60)
  if (!allowed) {
    return NextResponse.json({ error: "Demasiadas sincronizaciones seguidas. Esperá unos minutos." }, { status: 429 })
  }

  try {
    const { zpl, count } = await fetchShippingLabelsZpl(user.id)
    if (count === 0) {
      return NextResponse.json({ error: "No encontramos envíos pendientes en tus órdenes pagas recientes." }, { status: 404 })
    }
    return NextResponse.json({ zpl, count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
