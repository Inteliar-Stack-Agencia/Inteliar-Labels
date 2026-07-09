import { NextRequest, NextResponse } from "next/server"

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

// One-time, prepaid "Pro" purchases for a fixed term (replaces the old
// unlimited "lifetime" plan — see docs/PRICING.md for the reasoning).
// external_reference/metadata carry "pro:<months>" so the webhooks know
// how long to grant, without needing a new value in the licenses.plan
// column (it stays "pro" — same features, just paid upfront for longer).
const TERM_PLANS = {
  pro1y: { months: 12, label: "Pro · 1 año" },
  pro3y: { months: 36, label: "Pro · 3 años" },
  pro5y: { months: 60, label: "Pro · 5 años" },
} as const

const MP_PLANS_ARS: Record<string, { title: string; unit_price: number; currency_id: string; external_reference: string }> = {
  pro1y: { title: `Inteliar Labels - ${TERM_PLANS.pro1y.label}`, unit_price: 379999, currency_id: "ARS", external_reference: "pro:12" },
  pro3y: { title: `Inteliar Labels - ${TERM_PLANS.pro3y.label}`, unit_price: 899999, currency_id: "ARS", external_reference: "pro:36" },
  pro5y: { title: `Inteliar Labels - ${TERM_PLANS.pro5y.label}`, unit_price: 1199999, currency_id: "ARS", external_reference: "pro:60" },
}

const STRIPE_PLANS_USD: Record<string, { amount: number; name: string; mode: "subscription" | "payment"; months?: number }> = {
  monthly: { amount: 1200, name: "Inteliar Labels - Plan Mensual", mode: "subscription" },
  pro: { amount: 2500, name: "Inteliar Labels - Plan Pro", mode: "subscription" },
  pro1y: { amount: 25000, name: `Inteliar Labels - ${TERM_PLANS.pro1y.label}`, mode: "payment", months: 12 },
  pro3y: { amount: 60000, name: `Inteliar Labels - ${TERM_PLANS.pro3y.label}`, mode: "payment", months: 36 },
  pro5y: { amount: 80000, name: `Inteliar Labels - ${TERM_PLANS.pro5y.label}`, mode: "payment", months: 60 },
}

// ── MercadoPago ───────────────────────────────────────────────────────────────

async function createMPSubscription(plan: string, payerEmail?: string) {
  const amountMap: Record<string, number> = { monthly: 17999, pro: 39999 }
  const nameMap: Record<string, string> = {
    monthly: "Inteliar Labels - Plan Mensual",
    pro: "Inteliar Labels - Plan Pro",
  }

  const body: Record<string, any> = {
    reason: nameMap[plan] || "Inteliar Labels",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: amountMap[plan],
      currency_id: "ARS",
    },
    back_url: `${APP_URL}/pago/exito`,
    external_reference: plan,
    notification_url: `${APP_URL}/api/webhooks/mercadopago`,
  }

  if (payerEmail) body.payer_email = payerEmail

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[checkout/mp] subscription error", res.status, err)
    throw new Error(`MP subscription error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.init_point as string
}

async function createMPPreference(plan: keyof typeof MP_PLANS_ARS) {
  const planData = MP_PLANS_ARS[plan]

  const preference = {
    items: [{ title: planData.title, quantity: 1, unit_price: planData.unit_price, currency_id: planData.currency_id }],
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
    headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(preference),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[checkout/mp] preference error", res.status, err)
    throw new Error(`MP preference error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.init_point as string
}

// ── Stripe ────────────────────────────────────────────────────────────────────

async function createStripeSession(plan: string, email?: string) {
  if (!STRIPE_SECRET_KEY) throw new Error("Stripe no configurado")

  const planData = STRIPE_PLANS_USD[plan]
  if (!planData) throw new Error("Plan inválido")

  const isSubscription = planData.mode === "subscription"

  // Term plans (pro1y/pro3y/pro5y) are prepaid one-time purchases of the
  // "pro" plan for N months — the webhook reads metadata.months to know
  // how far out to set expires_at, since licenses.plan itself stays "pro".
  const metadata: Record<string, string> = { plan: planData.months ? "pro" : plan }
  if (planData.months) metadata.months = String(planData.months)

  const body: Record<string, any> = {
    mode: planData.mode,
    success_url: `${APP_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/#pricing`,
    metadata,
  }

  if (email) body.customer_email = email

  if (isSubscription) {
    body.line_items = [{ price_data: { currency: "usd", unit_amount: planData.amount, product_data: { name: planData.name }, recurring: { interval: "month" } }, quantity: 1 }]
  } else {
    body.line_items = [{ price_data: { currency: "usd", unit_amount: planData.amount, product_data: { name: planData.name } }, quantity: 1 }]
  }

  const params = new URLSearchParams()
  function flattenToParams(obj: Record<string, any>, prefix = "") {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        flattenToParams(v, key)
      } else if (Array.isArray(v)) {
        v.forEach((item, i) => {
          if (typeof item === "object") flattenToParams(item, `${key}[${i}]`)
          else params.append(`${key}[${i}]`, String(item))
        })
      } else {
        params.append(key, String(v))
      }
    }
  }
  flattenToParams(body)

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[checkout/stripe] error", res.status, err)
    throw new Error(`Stripe error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.url as string
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { plan, currency, email } = await req.json()

  if (!plan) return NextResponse.json({ error: "Plan requerido" }, { status: 400 })

  try {
    // USD → Stripe
    if (currency === "USD") {
      const url = await createStripeSession(plan, email)
      return NextResponse.json({ url })
    }

    // ARS → MercadoPago
    if (!MP_TOKEN) return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 500 })

    if (plan === "monthly" || plan === "pro") {
      const url = await createMPSubscription(plan, email)
      return NextResponse.json({ url })
    }

    if (plan in MP_PLANS_ARS) {
      const url = await createMPPreference(plan as keyof typeof MP_PLANS_ARS)
      return NextResponse.json({ url })
    }

    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })

  } catch (e: any) {
    console.error("[checkout/create] error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
