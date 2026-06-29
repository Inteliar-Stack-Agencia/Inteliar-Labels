// Shared license creation — used by admin panel and payment webhooks
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { generateLicenseKey, maxDevicesForPlan } from "@/lib/license-utils"
import { sendLicenseEmail } from "@/lib/send-license-email"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CreateLicenseInput {
  plan: "monthly" | "pro" | "lifetime"
  email?: string
  notes?: string
  /** External payment reference (MercadoPago/Stripe id) to avoid duplicates */
  paymentRef?: string
  /** Whether to email the key to the customer */
  sendEmail?: boolean
}

export async function createLicense(input: CreateLicenseInput) {
  const { plan, email = "", notes = "", paymentRef, sendEmail = false } = input

  // Idempotency: if a license already exists for this payment, return it
  if (paymentRef) {
    const { data: existing } = await supabaseAdmin
      .from("licenses")
      .select("*")
      .eq("payment_ref", paymentRef)
      .maybeSingle()
    if (existing) return { license: existing, created: false }
  }

  // Renewal: if the customer already has a monthly/pro license (active, grace, or recently expired),
  // extend it by 30 days instead of creating a new key.
  if (email && (plan === "monthly" || plan === "pro")) {
    const graceCutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const { data: renewTarget } = await supabaseAdmin
      .from("licenses")
      .select("id, key, expires_at, status")
      .eq("email", email)
      .eq("plan", plan)
      .in("status", ["active", "expired"])
      .gte("expires_at", graceCutoff)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (renewTarget) {
      // Extend from current expiry (or now if already past) by 30 days
      const base = renewTarget.expires_at && new Date(renewTarget.expires_at) > new Date()
        ? new Date(renewTarget.expires_at)
        : new Date()
      const newExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: renewed, error } = await supabaseAdmin
        .from("licenses")
        .update({
          expires_at: newExpiry,
          status: "active",
          payment_ref: paymentRef ?? null,
          notes: notes || `Renovado — pago ${paymentRef}`,
        })
        .eq("id", renewTarget.id)
        .select()
        .single()

      if (error) throw new Error(error.message)

      if (sendEmail && email) {
        await sendLicenseEmail(email, renewed.key, plan, true).catch((e) =>
          console.error("[create-license] renewal email failed:", e.message)
        )
      }

      return { license: renewed, created: false, renewed: true }
    }
  }

  const expires_at = (plan === "monthly" || plan === "pro")
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabaseAdmin.from("licenses").insert({
    key: generateLicenseKey(),
    plan,
    email,
    notes,
    max_devices: maxDevicesForPlan(plan),
    expires_at,
    activations: [],
    payment_ref: paymentRef ?? null,
  }).select().single()

  if (error) throw new Error(error.message)

  if (sendEmail && email) {
    await sendLicenseEmail(email, data.key, plan, false).catch((e) =>
      console.error("[create-license] email failed:", e.message)
    )
  }

  return { license: data, created: true, renewed: false }
}
