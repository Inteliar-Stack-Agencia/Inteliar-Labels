import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"
import { getAuthorizationUrl, isMercadolibreConfigured } from "@/lib/mercadolibre"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

// GET /api/integrations/mercadolibre/authorize
// Kicks off the OAuth flow — redirects the browser to Mercado Libre's
// consent screen. Requires the user to already be logged into the app.
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

  // CSRF protection: bind the ML "state" param to a value only this browser
  // session knows, so an attacker can't trick a victim into linking the
  // attacker's ML account to the victim's Inteliar account (or vice versa).
  const state = crypto.randomBytes(24).toString("hex")
  const res = NextResponse.redirect(getAuthorizationUrl(state))
  res.cookies.set("ml_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  })
  return res
}
