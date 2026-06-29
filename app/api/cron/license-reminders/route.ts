import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendRenewalEmail } from "@/lib/send-renewal-email"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CHECKOUT_URL = `${process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"}/#pricing`

// Called daily by Vercel Cron. Sends renewal reminders at 7d, 1d before expiry and during 2-day grace period.
export async function GET(req: NextRequest) {
  // Verify request comes from Vercel Cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Reminders: 7 days before, 1 day before, and each day of the 2-day grace period after expiry
  // Each window is ±2h around the target time to avoid double-sending across cron runs
  const targets = [
    { daysLeft: 7,  from: addDays(now, 6, 22),  to: addDays(now, 7, 2),  grace: false },
    { daysLeft: 1,  from: addDays(now, 0, 22),  to: addDays(now, 1, 2),  grace: false },
    { daysLeft: -1, from: addDays(now, -2, 2),  to: addDays(now, -1, 2), grace: true  },
    { daysLeft: -2, from: addDays(now, -3, 2),  to: addDays(now, -2, 2), grace: true  },
  ]

  const results: { email: string; daysLeft: number; ok: boolean; error?: string }[] = []

  for (const { daysLeft, from, to, grace } of targets) {
    const { data: licenses, error } = await supabaseAdmin
      .from("licenses")
      .select("key, plan, email")
      .in("status", grace ? ["active", "expired"] : ["active"])
      .in("plan", ["monthly", "pro"])
      .gte("expires_at", from.toISOString())
      .lt("expires_at", to.toISOString())

    if (error) {
      console.error("[cron/license-reminders] DB error:", error.message)
      continue
    }

    for (const license of licenses ?? []) {
      if (!license.email) continue
      try {
        await sendRenewalEmail(license.email, license.key, license.plan, daysLeft, CHECKOUT_URL)
        results.push({ email: license.email, daysLeft, ok: true })
        console.log(`[cron/license-reminders] Sent ${daysLeft}d reminder → ${license.email}`)
      } catch (e: any) {
        results.push({ email: license.email, daysLeft, ok: false, error: e.message })
        console.error(`[cron/license-reminders] Failed ${license.email}:`, e.message)
      }
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, results })
}

function addDays(date: Date, days: number, hours = 0): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + hours - d.getHours() % 24)
  return d
}
