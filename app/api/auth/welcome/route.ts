import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/send-welcome-email"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ ok: false })
  await sendWelcomeEmail(email).catch(() => {})
  return NextResponse.json({ ok: true })
}
