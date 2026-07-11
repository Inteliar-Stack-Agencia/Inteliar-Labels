import { NextRequest, NextResponse } from "next/server"

// Tiendanube LGPD/privacy webhook: fired when a shopper asks the store to
// delete their personal data. We never store buyer/customer data — orders
// are fetched on demand and printed or discarded, nothing is persisted
// server-side — so there's nothing to redact. Acknowledge with 200.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    console.log("[tn-webhook] customers/redact", body?.store_id, body?.customer?.id)
  } catch (err) {
    console.error("[tn-webhook] customers/redact failed to parse body:", err)
  }
  return NextResponse.json({ received: true })
}
