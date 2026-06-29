import { NextRequest, NextResponse } from "next/server"

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

const PLANS = {
  monthly: {
    title: "Inteliar Labels - Plan Mensual",
    unit_price: 10,
    currency_id: "USD",
    external_reference: "monthly",
  },
  pro: {
    title: "Inteliar Labels - Plan Pro",
    unit_price: 19,
    currency_id: "USD",
    external_reference: "pro",
  },
  lifetime: {
    title: "Inteliar Labels - Plan De por vida",
    unit_price: 300,
    currency_id: "USD",
    external_reference: "lifetime",
  },
}

export async function POST(req: NextRequest) {
  if (!MP_TOKEN) {
    return NextResponse.json({ error: "MP not configured" }, { status: 500 })
  }

  const { plan, email } = await req.json()
  const planData = PLANS[plan as keyof typeof PLANS]
  if (!planData) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
  }

  const preference = {
    items: [
      {
        title: planData.title,
        quantity: 1,
        unit_price: planData.unit_price,
        currency_id: planData.currency_id,
      },
    ],
    payer: email ? { email } : undefined,
    external_reference: planData.external_reference,
    back_urls: {
      success: `${APP_URL}/pago/exito`,
      failure: `${APP_URL}/pago/error`,
      pending: `${APP_URL}/pago/exito`,
    },
    auto_return: "approved",
    statement_descriptor: "INTELIAR LABELS",
    notification_url: `${APP_URL}/api/webhooks/mercadopago`,
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[checkout/create]", res.status, err)
    return NextResponse.json({ error: "Error creando preferencia" }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ url: data.init_point })
}
