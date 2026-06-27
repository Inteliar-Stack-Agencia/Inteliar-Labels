import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { createLicense } from "@/lib/create-license"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe payment webhook (no SDK — signature verified with native crypto).
// Configure this URL in your Stripe dashboard → Webhooks:
//   https://<tu-dominio>/api/webhooks/stripe
// Listen for: checkout.session.completed
//
// Set the plan via the Checkout metadata { plan: "monthly" | "lifetime" }
// or the price/product name (falls back to "monthly").

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// We need the raw body for signature verification
export const runtime = "nodejs"

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  // Header format: t=timestamp,v1=signature
  const parts = Object.fromEntries(
    sigHeader.split(",").map((p) => p.split("=") as [string, string])
  )
  const timestamp = parts["t"]
  const expectedSig = parts["v1"]
  if (!timestamp || !expectedSig) return false

  const signedPayload = `${timestamp}.${payload}`
  const computed = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

function inferPlan(text: string): "monthly" | "lifetime" {
  return /vida|lifetime|por.?vida|anual/i.test(text) ? "lifetime" : "monthly"
}

export async function POST(req: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET no configurada")
    return NextResponse.json({ error: "not configured" }, { status: 500 })
  }

  const payload = await req.text()
  const sig = req.headers.get("stripe-signature") || ""

  if (!verifyStripeSignature(payload, sig, STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true }) // ignore other events
  }

  try {
    const session = event.data.object
    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: true, status: session.payment_status })
    }

    const email: string =
      session.customer_details?.email || session.customer_email || ""
    const descriptor = `${session.metadata?.plan ?? ""} ${session.metadata?.product ?? ""}`
    const plan = inferPlan(descriptor)

    const { license, created } = await createLicense({
      plan,
      email,
      notes: `Stripe checkout ${session.id}`,
      paymentRef: `stripe:${session.id}`,
      sendEmail: true,
    })

    await supabaseAdmin.from("payment_events").upsert({
      provider: "stripe",
      payment_id: session.id,
      email,
      amount: session.amount_total ? session.amount_total / 100 : null,
      currency: (session.currency ?? "usd").toUpperCase(),
      plan,
      license_key: license.key,
      license_created: created,
      raw: session,
    }, { onConflict: "provider,payment_id" }).select()

    console.log(`[stripe-webhook] licencia ${created ? "creada" : "ya existía"}: ${license.key} → ${email}`)
    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.error("[stripe-webhook] error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
