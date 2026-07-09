import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  sendTrialDay1,
  sendTrialDay3,
  sendTrialDay7,
  sendTrialDay10,
  sendTrialDay13,
  sendTrialDay14,
} from "@/lib/send-trial-sequence"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TARGET_DAYS = [1, 3, 7, 10, 13, 14]

// Vercel logs the response body of cron invocations. Never put full emails
// in there — mask them so the log is still useful for debugging without
// being a plaintext PII dump.
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  const visible = local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`
}

const SENDERS: Record<number, (email: string) => Promise<void>> = {
  1: sendTrialDay1,
  3: sendTrialDay3,
  7: sendTrialDay7,
  10: sendTrialDay10,
  13: sendTrialDay13,
  14: sendTrialDay14,
}

export async function GET(req: NextRequest) {
  // Verify request comes from Vercel Cron — same convention as
  // /api/cron/license-reminders. Never accept the secret via query string:
  // it would leak into server access logs, browser history and Referer headers.
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const sent: string[] = []
  const errors: string[] = []

  for (const day of TARGET_DAYS) {
    // Find users who registered exactly `day` days ago (±1h window)
    const from = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) - 60 * 60 * 1000)
    const to = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) + 60 * 60 * 1000)

    // Get users in this registration window who are still on trial (no active license)
    const { data: users, error } = await supabase.auth.admin.listUsers()
    if (error) {
      errors.push(`listUsers: ${error.message}`)
      continue
    }

    const targets = (users.users ?? []).filter((u) => {
      const created = new Date(u.created_at)
      return created >= from && created <= to
    })

    for (const user of targets) {
      const email = user.email
      if (!email) continue

      // Skip users who already have an active license
      const { data: license } = await supabase
        .from("licenses")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (license) continue

      // Check if already sent this day's email
      const { data: alreadySent } = await supabase
        .from("trial_emails_sent")
        .select("id")
        .eq("user_id", user.id)
        .eq("day", day)
        .maybeSingle()

      if (alreadySent) continue

      try {
        await SENDERS[day](email)
        await supabase.from("trial_emails_sent").insert({ user_id: user.id, day, sent_at: now.toISOString() })
        sent.push(`day${day}:${maskEmail(email)}`)
      } catch (e: any) {
        errors.push(`day${day}:${maskEmail(email)}: ${e.message}`)
      }
    }
  }

  console.log(`[trial-sequence] enviados: ${sent.length}, errores: ${errors.length}`)
  return NextResponse.json({ ok: true, sent, errors })
}
