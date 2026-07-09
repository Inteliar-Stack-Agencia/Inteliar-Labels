import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { exchangeCodeForToken, saveConnection, isMercadolibreConfigured } from "@/lib/mercadolibre"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

// GET /api/integrations/mercadolibre/callback — Mercado Libre redirects here
// after the seller approves (or denies) the connection.
export async function GET(req: NextRequest) {
  if (!isMercadolibreConfigured()) {
    return NextResponse.redirect(`${APP_URL}/upload?ml_error=not_configured`)
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
  const state = req.nextUrl.searchParams.get("state")
  const expectedState = cookieStore.get("ml_oauth_state")?.value

  const res = NextResponse.redirect(
    code && state && expectedState && state === expectedState
      ? `${APP_URL}/upload?ml_connected=1`
      : `${APP_URL}/upload?ml_error=state_mismatch`
  )
  res.cookies.delete("ml_oauth_state")

  if (!code || !state || !expectedState || state !== expectedState) {
    return res
  }

  try {
    const token = await exchangeCodeForToken(code)
    await saveConnection(user.id, token)
  } catch (e: any) {
    console.error("[ml-callback] token exchange failed:", e.message)
    return NextResponse.redirect(`${APP_URL}/upload?ml_error=token_exchange_failed`)
  }

  return res
}
