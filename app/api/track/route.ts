import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/track  Body: { event: string, metadata?: object }
// Records a lightweight engagement event for the authenticated user. Anonymous
// callers (e.g. landing page) are a no-op. Never throws to the client.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false })

    const { event, metadata } = await req.json().catch(() => ({ event: null }))
    if (!event || typeof event !== "string") {
      return NextResponse.json({ ok: false })
    }

    await supabase.from("user_events").insert({
      user_id: user.id,
      event: event.slice(0, 64),
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Missing table / any error: don't break the user's action.
    return NextResponse.json({ ok: false })
  }
}
