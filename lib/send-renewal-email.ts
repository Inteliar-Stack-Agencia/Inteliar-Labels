const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Label <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export async function sendRenewalEmail(
  to: string,
  key: string,
  plan: "monthly" | "pro",
  daysLeft: number,
  checkoutUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[send-renewal-email] RESEND_API_KEY no configurada — email no enviado a", to)
    return
  }

  const urgent = daysLeft <= 1
  const planLabel = plan === "pro" ? "Pro" : "Mensual"
  const subject = urgent
    ? `⚠️ Tu licencia de Inteliar Label vence HOY`
    : `Tu licencia de Inteliar Label vence en ${daysLeft} días`

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: ${urgent ? '#dc2626' : '#1e78dc'}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">Inteliar Label</h1>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px; font-weight: bold;">${urgent ? '⚠️ Tu licencia vence hoy' : `Tu licencia vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`}</p>
      <p>Tu plan <strong>${planLabel}</strong> (clave <code style="background:#f4f6fb;padding:2px 6px;border-radius:4px;">${key}</code>) está por vencer.</p>
      <p>Si no renovás, el agente de impresión dejará de funcionar y no podrás imprimir etiquetas.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${checkoutUrl}" style="background: ${urgent ? '#dc2626' : '#1e78dc'}; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Renovar ahora
        </a>
      </div>
      <p style="font-size: 13px; color: #666;">O ingresá a <a href="${APP_URL}">${APP_URL}</a> y hacé clic en "Renovar plan".</p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">Si ya renovaste, ignorá este mensaje. ¿Preguntas? Respondé este mail.</p>
    </div>
  </div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend ${res.status}: ${text}`)
  }
}
