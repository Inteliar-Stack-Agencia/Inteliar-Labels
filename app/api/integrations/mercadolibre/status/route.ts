import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isConnected, isMercadolibreConfigured } from "@/lib/mercadolibre"

// GET /api/integrations/mercadolibre/status
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const configured = isMercadolibreConfigured()
  const connected = configured ? await isConnected(user.id) : false
  return NextResponse.json({ configured, connected })
}
