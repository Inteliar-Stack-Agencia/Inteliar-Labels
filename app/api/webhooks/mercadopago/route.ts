import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLicense } from "@/lib/create-license"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

function inferPlan(text: string): "monthly" | "pro" | "lifetime" {
  if (/vida|lifetime|por.?vida/i.test(text)) return "lifetime"
  if (/pro/i.test(text)) return "pro"
  return "monthly"
}

export async function POST(req: NextRequest) {
  if (!MP_TOKEN) {
    console.error("[mp-webhook] MERCADOPAGO_ACCESS_TOKEN no configurada")
    return NextResponse.json({ error: "not configured" }, { status: 500 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
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
    const plan = inferPlan(descriptor)

    const { license, created, renewed } = await createLicense({
      plan,
      email,
      notes: `MercadoPago payment ${resourceId}`,
      paymentRef: `mp:${resourceId}`,
      sendEmail: true,
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
