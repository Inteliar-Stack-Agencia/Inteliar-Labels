import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/announcements — latest active announcement for the logged-in user.
// Returns null if none. Never throws (missing table -> null).
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ announcement: null })

    const { data } = await supabase
      .from("announcements")
      .select("id, title, body, cta_label, cta_url, variant, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ announcement: data ?? null })
  } catch {
    return NextResponse.json({ announcement: null })
  }
}
