import { NextRequest, NextResponse } from "next/server"

// Mercado Libre requires a live, always-200-responding callback URL to be
// configured on the app before it will let you save the app config at all —
// this just acknowledges delivery. We don't yet act on notifications (the
// /orders route pulls on demand instead), but logging the topic gives us a
// paper trail for when we do wire up push-based sync.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    console.log("[ml-webhook]", body?.topic, body?.resource, body?.user_id)
  } catch (err) {
    console.error("[ml-webhook] failed to parse body:", err)
  }
  // ML expects a fast 200 regardless of payload shape — respond immediately.
  return NextResponse.json({ received: true })
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}
