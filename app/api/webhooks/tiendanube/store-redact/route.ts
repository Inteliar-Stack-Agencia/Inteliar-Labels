import { NextRequest, NextResponse } from "next/server"

// Tiendanube LGPD/privacy webhook: fired when a store owner requests full
// deletion of their data after uninstalling the app. We don't persist any
// Tiendanube-specific store data beyond the OAuth connection itself (product
// imports are one-shot, not stored), so this just needs to delete that
// connection row once it exists. Acknowledge with 200 regardless.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    console.log("[tn-webhook] store/redact", body?.store_id)
    // TODO: once tiendanube_connections exists, delete the row for body.store_id here.
  } catch (err) {
    console.error("[tn-webhook] store/redact failed to parse body:", err)
  }
  return NextResponse.json({ received: true })
}
