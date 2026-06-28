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
    await sendLicenseEmail(email, data.key, plan).catch((e) =>
      console.error("[create-license] email failed:", e.message)
    )
  }

  return { license: data, created: true }
}
