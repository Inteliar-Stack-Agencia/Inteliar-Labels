import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { exchangeCodeForToken, saveConnection, isTiendanubeConfigured } from "@/lib/tiendanube"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

// GET /api/integrations/tiendanube/callback — Tiendanube redirects here
// after the store owner approves (or denies) the install.
export async function GET(req: NextRequest) {
  if (!isTiendanubeConfigured()) {
    return NextResponse.redirect(`${APP_URL}/integraciones?tn_error=not_configured`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const code = req.nextUrl.searchParams.get("code")
  if (!code) {
    return NextResponse.redirect(`${APP_URL}/integraciones?tn_error=missing_code`)
  }

  try {
    const token = await exchangeCodeForToken(code)
    await saveConnection(user.id, token)
  } catch (e: any) {
    console.error("[tn-callback] token exchange failed:", e.message)
    return NextResponse.redirect(`${APP_URL}/integraciones?tn_error=token_exchange_failed`)
  }

  return NextResponse.redirect(`${APP_URL}/integraciones?tn_connected=1`)
}
