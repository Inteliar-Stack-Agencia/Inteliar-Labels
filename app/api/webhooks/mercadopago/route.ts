import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"
import { createLicense } from "@/lib/create-license"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
const MP_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET

// We need the raw query params + headers for signature verification
export const runtime = "nodejs"

function inferPlan(text: string): "monthly" | "pro" | "lifetime" {
  if (/vida|lifetime|por.?vida/i.test(text)) return "lifetime"
  if (/pro/i.test(text)) return "pro"
  return "monthly"
}

// Prepaid multi-year Pro purchases (1/3/5 años) encode their term in
// external_reference as "pro:<months>" (see app/api/checkout/create).
// Falls back to inferPlan()'s text-matching for older-style preferences.
function inferPlanAndTerm(externalRef: string, descriptor: string): { plan: "monthly" | "pro" | "lifetime"; months: number } {
  const match = /^pro:(\d+)$/.exec((externalRef || "").trim())
  if (match) return { plan: "pro", months: Number(match[1]) }
  return { plan: inferPlan(descriptor), months: 1 }
}

// MercadoPago signature scheme:
//   header x-signature: "ts=<timestamp>,v1=<hmac>"
//   header x-request-id: "<request id>"
//   manifest = `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
//   hmac = HMAC-SHA256(manifest, secret)
// https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
function verifyMercadopagoSignature(req: NextRequest, dataId: string, secret: string): boolean {
  const xSignature = req.headers.get("x-signature") || ""
  const xRequestId = req.headers.get("x-request-id") || ""
  if (!xSignature || !xRequestId || !dataId) return false

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.trim().split("=") as [string, string])
  )
  const ts = parts["ts"]
  const expectedSig = parts["v1"]
  if (!ts || !expectedSig) return false

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex")

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedSig))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!MP_TOKEN) {
    console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN no configurada")
    return NextResponse.json({ error: "not configured" }, { status: 500 })
  }
  if (!MP_WEBHOOK_SECRET) {
    console.error("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurada")
    return NextResponse.json({ error: "not configured" }, { status: 500 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  // data.id used in the notification body doubles as the value signed in x-signature
  const signedDataId: string = body.data?.id ?? req.nextUrl.searchParams.get("data.id") ?? ""
  if (!verifyMercadopagoSignature(req, signedDataId, MP_WEBHOOK_SECRET)) {
    console.error("[mp-webhook] firma inválida")
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  const type = body.type || body.topic
  const resourceId = body.data?.id || body.resource?.toString().split("/").pop()

  // ── Subscription cancelled ────────────────────────────────────────────────
  if (type === "subscription_preapproval") {
    try {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      })
      if (!res.ok) return NextResponse.json({ ok: true })
      const sub = await res.json()

      if (sub.status === "cancelled") {
        const email: string = sub.payer_email || ""
        console.log(`[mp-webhook] suscripción cancelada: ${resourceId} → ${email}`)
        // Don't suspend immediately — let the license expire naturally at expires_at
        // Just log it so the admin can see it
        await supabaseAdmin.from("payment_events").upsert({
          provider: "mercadopago",
          payment_id: `sub_cancelled:${resourceId}`,
          email,
          amount: null,
          currency: "USD",
          plan: "monthly",
          license_key: null,
          license_created: false,
          raw: sub,
        }, { onConflict: "provider,payment_id" })
      }
    } catch (e: any) {
      console.error("[mp-webhook] subscription error:", e.message)
    }
    return NextResponse.json({ ok: true })
  }

  // ── One-time payment or subscription monthly charge ───────────────────────
  if (type !== "payment" || !resourceId) {
    return NextResponse.json({ ok: true })
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    })
    if (!res.ok) {
      console.error("[mp-webhook] no se pudo leer el pago", resourceId, res.status)
      return NextResponse.json({ ok: true })
    }
    const payment = await res.json()

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const email: string = payment.payer?.email || ""
    const descriptor = `${payment.description ?? ""} ${payment.external_reference ?? ""} ${payment.additional_info?.items?.[0]?.title ?? ""}`
    const { plan, months } = inferPlanAndTerm(payment.external_reference ?? "", descriptor)

    const { license, created, renewed } = await createLicense({
      plan,
      email,
      notes: `MercadoPago payment ${resourceId}`,
      paymentRef: `mp:${resourceId}`,
      sendEmail: true,
      termMonths: months,
    })

    await supabaseAdmin.from("payment_events").upsert({
      provider: "mercadopago",
      payment_id: resourceId,
      email,
      amount: payment.transaction_amount ?? null,
      currency: payment.currency_id ?? "ARS",
      plan,
      license_key: license.key,
      license_created: created,
      raw: payment,
    }, { onConflict: "provider,payment_id" })

    console.log(`[mp-webhook] licencia ${renewed ? "renovada" : created ? "creada" : "ya existía"}: ${license.key} → ${email}`)
    return NextResponse.json({ ok: true, created, renewed })
  } catch (e: any) {
    console.error("[mp-webhook] error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
