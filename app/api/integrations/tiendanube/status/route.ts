import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isConnected, isTiendanubeConfigured } from "@/lib/tiendanube"

// GET /api/integrations/tiendanube/status
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const configured = isTiendanubeConfigured()
  try {
    const connected = configured ? await isConnected(user.id) : false
    return NextResponse.json({ configured, connected })
  } catch (e: any) {
    console.error("[tn-status] isConnected failed:", e.message)
    return NextResponse.json({ configured, connected: false, error: e.message }, { status: 200 })
  }
}
