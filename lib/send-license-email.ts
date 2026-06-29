// Sends the license key to the customer via Resend (REST API, no SDK).
// No-ops gracefully if RESEND_API_KEY is not set.

const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Label <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export async function sendLicenseEmail(
  to: string,
  key: string,
  plan: "monthly" | "pro" | "lifetime",
  renewed = false
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[send-license-email] RESEND_API_KEY no configurada — email no enviado a", to)
    return
  }

  const planLabel = plan === "lifetime" ? "De por vida" : plan === "pro" ? "Pro" : "Mensual"
  const deviceLabel = plan === "lifetime" ? "hasta 5 dispositivos" : plan === "pro" ? "hasta 3 dispositivos" : "1 dispositivo"

  const subject = renewed
    ? `✅ Licencia renovada — Inteliar Label`
    : `Tu licencia de Inteliar Label 🏷️`

  const intro = renewed
    ? `<p style="font-size: 16px;">¡Tu licencia fue renovada exitosamente! ✅</p>
       <p>Tu plan <strong>${planLabel}</strong> está activo por 30 días más. Tu misma clave sigue funcionando:</p>`
    : `<p style="font-size: 16px;">¡Gracias por tu compra! 🎉</p>
       <p>Tu licencia <strong>${planLabel}</strong> está lista (válida para <strong>${deviceLabel}</strong>). Esta es tu clave de activación:</p>`

  const footer = renewed
    ? `<p style="font-size: 14px; color: #555;">No necesitás hacer nada — el agente ya reconoce la renovación automáticamente.</p>`
    : `<p style="font-size: 14px;"><strong>¿Cómo la uso?</strong></p>
       <ol style="font-size: 14px; line-height: 1.6;">
         <li>Descargá e instalá <strong>Inteliar Label</strong> en tu PC con Windows.</li>
         <li>Al abrirlo, pegá esta clave en la pantalla de activación.</li>
         <li>¡Listo! El agente queda corriendo y podés imprimir desde la web.</li>
       </ol>`

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">Inteliar Label</h1>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      ${intro}
      <div style="background: #f4f6fb; border: 2px dashed #1e78dc; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
        <code style="font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #1e78dc;">${key}</code>
      </div>
      ${footer}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${APP_URL}" style="background: #1e78dc; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ir a la app</a>
      </div>
      <p style="font-size: 12px; color: #888; margin-top: 28px;">Si tenés algún problema, respondé este mail y te ayudamos.</p>
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
