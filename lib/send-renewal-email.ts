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

  const grace = daysLeft < 0
  const planLabel = plan === "pro" ? "Pro" : "Mensual"
  const graceRemaining = grace ? 2 + daysLeft : null

  const subject = grace
    ? `Recordatorio de renovación — Inteliar Label`
    : daysLeft === 1
    ? `Tu suscripción de Inteliar Label vence mañana`
    : `Tu suscripción de Inteliar Label vence en ${daysLeft} días`

  const heading = grace
    ? `Recordatorio de renovación`
    : daysLeft === 1
    ? `Tu suscripción vence mañana`
    : `Tu suscripción vence en ${daysLeft} días`

  const body = grace
    ? `Tu plan <strong>${planLabel}</strong> ya venció, pero todavía tenés <strong>${graceRemaining} día${graceRemaining === 1 ? '' : 's'} para renovar</strong> y seguir imprimiendo sin interrupciones.`
    : `Tu plan <strong>${planLabel}</strong> (clave <code style="background:#f4f6fb;padding:2px 6px;border-radius:4px;font-size:13px;">${key}</code>) está por renovarse. Para seguir imprimiendo sin interrupciones, podés renovar cuando quieras.`

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">Inteliar Label</h1>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 17px; font-weight: bold; margin-top: 0;">${heading}</p>
      <p style="line-height: 1.6;">${body}</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${checkoutUrl}" style="background: #1e78dc; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
          Renovar suscripción
        </a>
      </div>
      <p style="font-size: 13px; color: #666;">También podés ingresar a <a href="${APP_URL}" style="color:#1e78dc;">${APP_URL}</a> y renovar desde ahí.</p>
      <p style="font-size: 12px; color: #aaa; margin-top: 24px;">Si ya renovaste, ignorá este mensaje. ¿Preguntas? Respondé este mail.</p>
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
