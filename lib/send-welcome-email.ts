// Sends a welcome email when a user registers via Resend (REST API, no SDK).
// No-ops gracefully if RESEND_API_KEY is not set.

const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Labels <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export async function sendWelcomeEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[send-welcome-email] RESEND_API_KEY no configurada — email no enviado a", to)
    return
  }

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">¡Bienvenido a Inteliar Labels!</h1>
      <p style="color: #cde4f9; margin: 8px 0 0; font-size: 14px;">Tu prueba gratuita de 15 días ya está activa</p>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px;">Hola 👋,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        Tu cuenta fue creada con éxito. Tenés <strong>15 días de prueba gratuita</strong> con hasta
        <strong>500 etiquetas</strong> para explorar todo lo que Inteliar Labels tiene para ofrecerte.
      </p>

      <p style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">¿Por dónde empezar?</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 12px; vertical-align: top; width: 32px;">
            <span style="background: #1e78dc; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-weight: bold;">1</span>
          </td>
          <td style="padding: 10px 0; vertical-align: top;">
            <strong>Crear una plantilla</strong><br>
            <span style="color: #555;">Diseñá tu etiqueta eligiendo campos, fuentes y dimensiones.</span>
          </td>
        </tr>
        <tr style="background: #f8fafd;">
          <td style="padding: 10px 12px; vertical-align: top;">
            <span style="background: #1e78dc; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-weight: bold;">2</span>
          </td>
          <td style="padding: 10px 0; vertical-align: top;">
            <strong>Cargar tu Excel</strong><br>
            <span style="color: #555;">Subí tu planilla y mapeá las columnas a los campos de tu plantilla.</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; vertical-align: top;">
            <span style="background: #1e78dc; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-weight: bold;">3</span>
          </td>
          <td style="padding: 10px 0; vertical-align: top;">
            <strong>Configurar tu impresora</strong><br>
            <span style="color: #555;">Instalá el agente de impresión en tu PC con Windows y vinculala.</span>
          </td>
        </tr>
        <tr style="background: #f8fafd;">
          <td style="padding: 10px 12px; vertical-align: top;">
            <span style="background: #1e78dc; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-weight: bold;">4</span>
          </td>
          <td style="padding: 10px 0; vertical-align: top;">
            <strong>¡Imprimir!</strong><br>
            <span style="color: #555;">Seleccioná filas y enviá a imprimir directo desde el navegador.</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/dashboard" style="background: #1e78dc; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Ir al dashboard →</a>
      </div>

      <p style="font-size: 13px; color: #555; line-height: 1.6;">
        Si tenés dudas o necesitás ayuda con la configuración, respondé este mail y te ayudamos personalmente.
      </p>
      <p style="font-size: 12px; color: #aaa; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">
        Inteliar Labels · inteliarstack.ia@gmail.com<br>
        Recibiste este mensaje porque te registraste en Inteliar Labels.
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
      to,
      subject: "¡Bienvenido a Inteliar Labels! 🏷️",
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[send-welcome-email] Resend ${res.status}: ${text}`)
  }
}
