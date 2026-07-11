import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getAuthorizationUrl, isTiendanubeConfigured } from "@/lib/tiendanube"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

// GET /api/integrations/tiendanube/authorize
// Kicks off the OAuth flow — redirects the browser to Tiendanube's install
// screen. Requires the user to already be logged into the app; the callback
// relies on that same browser session (still logged in) to know who to link
// the store to, since Tiendanube's redirect doesn't round-trip a state param.
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

  return NextResponse.redirect(getAuthorizationUrl())
}
