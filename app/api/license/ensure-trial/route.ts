import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createLicense } from "@/lib/create-license"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Must match TRIAL_DAYS in lib/use-plan-limits.ts
const TRIAL_DAYS = 15

// POST /api/license/ensure-trial
// Gives a user still inside the free trial a license key, so the printer
// agent can be activated with a code. The key expires with the trial: after
// that the agent refuses to start and tells the user to subscribe.
// Idempotent — users who already have any license get nothing new.
export async function POST() {
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
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  // Already has a license (by account or by purchase email)? Nothing to create.
  const { data: existing } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .or(`user_id.eq.${user.id}${user.email ? `,email.eq.${user.email}` : ""}`)
    .limit(1)
  if (existing && existing.length > 0) return NextResponse.json({ ok: true, created: false })

  const { data: extension } = await supabaseAdmin
    .from("trial_extensions")
    .select("extra_days")
    .eq("user_id", user.id)
    .maybeSingle()

  const trialEnd = new Date(
    new Date(user.created_at).getTime() + (TRIAL_DAYS + (extension?.extra_days ?? 0)) * 24 * 60 * 60 * 1000
  )
  if (trialEnd <= new Date()) {
    return NextResponse.json({ ok: true, created: false, reason: "trial_expired" })
  }

  try {
    const { license } = await createLicense({
      plan: "trial",
      email: user.email ?? "",
      notes: "Prueba gratis (automática)",
      expiresAt: trialEnd.toISOString(),
    })
    await supabaseAdmin.from("licenses").update({ user_id: user.id }).eq("id", license.id)
    return NextResponse.json({ ok: true, created: true })
  } catch (err) {
    console.error("[license/ensure-trial]", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
