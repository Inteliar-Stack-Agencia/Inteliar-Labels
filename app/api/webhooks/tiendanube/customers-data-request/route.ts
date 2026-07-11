import { NextRequest, NextResponse } from "next/server"

// Tiendanube LGPD/privacy webhook: fired when a shopper asks to see what
// personal data the app holds about them. We don't persist buyer data
// anywhere, so there's nothing to report back. Acknowledge with 200.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    console.log("[tn-webhook] customers/data_request", body?.store_id, body?.customer?.id)
  } catch (err) {
    console.error("[tn-webhook] customers/data_request failed to parse body:", err)
  }
  return NextResponse.json({ received: true })
}
