import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createLicense } from "@/lib/create-license"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// MercadoPago payment webhook.
// Configure this URL in your MercadoPago app:
//   https://<tu-dominio>/api/webhooks/mercadopago
//
// On an approved payment we look up the payment, infer the plan from the
// item title/external_reference, create a license, and email the key.

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

function inferPlan(text: string): "monthly" | "lifetime" {
  return /vida|lifetime|por.?vida|anual/i.test(text) ? "lifetime" : "monthly"
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
    return NextResponse.json({ ok: true }) // ignore malformed pings
  }

  // MercadoPago sends { type: "payment", data: { id } } (or topic/resource)
  const type = body.type || body.topic
  const paymentId = body.data?.id || body.resource?.toString().split("/").pop()

  if (type !== "payment" || !paymentId) {
    // Acknowledge other event types so MP doesn't retry
    return NextResponse.json({ ok: true })
  }

  try {
    // Fetch the actual payment to verify status (don't trust the webhook body)
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    })
    if (!res.ok) {
      console.error("[mp-webhook] no se pudo leer el pago", paymentId, res.status)
      return NextResponse.json({ ok: true })
    }
    const payment = await res.json()

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const email: string = payment.payer?.email || ""
    const descriptor = `${payment.description ?? ""} ${payment.external_reference ?? ""} ${payment.additional_info?.items?.[0]?.title ?? ""}`
    const plan = inferPlan(descriptor)

    const { license, created } = await createLicense({
      plan,
      email,
      notes: `MercadoPago payment ${paymentId}`,
      paymentRef: `mp:${paymentId}`,
      sendEmail: true,
    })

    // Log payment event (ignore errors — license was already created)
    await supabaseAdmin.from("payment_events").upsert({
      provider: "mercadopago",
      payment_id: paymentId,
      email,
      amount: payment.transaction_amount ?? null,
      currency: payment.currency_id ?? "ARS",
      plan,
      license_key: license.key,
      license_created: created,
      raw: payment,
    }, { onConflict: "provider,payment_id" }).select()

    console.log(`[mp-webhook] licencia ${created ? "creada" : "ya existía"}: ${license.key} → ${email}`)
    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.error("[mp-webhook] error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
