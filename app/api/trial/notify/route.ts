import { NextRequest, NextResponse } from "next/server"

const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Labels <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export async function POST(req: NextRequest) {
  const { email, daysLeft, labelsLeft } = await req.json()

  if (!email) return NextResponse.json({ ok: false }, { status: 400 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[trial/notify] RESEND_API_KEY no configurada — email no enviado")
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Determine which limit is closer to expiring
  const daysExhausted = typeof daysLeft === "number" && daysLeft <= 3
  const labelsExhausted = typeof labelsLeft === "number" && labelsLeft <= 50

  let limitWarning: string
  if (daysExhausted && labelsExhausted) {
    limitWarning = `Tu período de prueba vence en <strong>${daysLeft} día${daysLeft === 1 ? "" : "s"}</strong> y solo te quedan <strong>${labelsLeft} etiquetas</strong> disponibles.`
  } else if (daysExhausted) {
    limitWarning = `Tu período de prueba vence en <strong>${daysLeft} día${daysLeft === 1 ? "" : "s"}</strong>.`
  } else if (labelsExhausted) {
    limitWarning = `Solo te quedan <strong>${labelsLeft} etiqueta${labelsLeft === 1 ? "" : "s"}</strong> disponibles en tu prueba gratuita.`
  } else {
    limitWarning = `Tu prueba gratuita vence en <strong>${daysLeft} día${daysLeft === 1 ? "" : "s"}</strong> y te quedan <strong>${labelsLeft} etiquetas</strong>.`
  }

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">Inteliar Labels</h1>
      <p style="color: #cde4f9; margin: 8px 0 0; font-size: 14px;">Tu prueba gratuita está por vencer</p>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 15px; line-height: 1.6;">
        ${limitWarning}
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #444;">
        Para seguir imprimiendo sin interrupciones, elegí el plan que mejor se adapte a tu negocio.
      </p>

      <div style="background: #f4f6fb; border-left: 4px solid #1e78dc; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px;">
        <strong>¿Qué incluye el plan pago?</strong>
        <ul style="margin: 8px 0 0; padding-left: 18px; line-height: 1.8; color: #444;">
          <li>Etiquetas ilimitadas</li>
          <li>Todas las plantillas disponibles</li>
          <li>Soporte prioritario</li>
          <li>Actualizaciones incluidas</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/#pricing" style="background: #1e78dc; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Ver planes y precios →</a>
      </div>

      <p style="font-size: 13px; color: #555;">
        Si tenés preguntas sobre los planes o necesitás ayuda, respondé este mail y te contactamos.
      </p>
      <p style="font-size: 12px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
        Inteliar Labels · inteliarstack.ia@gmail.com
      </p>
    </div>
  </div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: "Tu trial de Inteliar Labels está por vencer",
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[trial/notify] Resend ${res.status}: ${text}`)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
