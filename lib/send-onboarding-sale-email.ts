// Combined welcome email for a sale made outside the normal web checkout
// (Mercado Libre, transferencia, etc.): login credentials + license key in
// one message, since the admin panel creates both at once for these.
// Sent via Resend (REST API, no SDK). No-ops gracefully if RESEND_API_KEY
// is not set.

const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Labels <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"

export async function sendOnboardingSaleEmail(
  to: string,
  password: string,
  licenseKey: string,
  plan: "monthly" | "pro" | "lifetime"
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[send-onboarding-sale-email] RESEND_API_KEY no configurada — email no enviado a", to)
    return
  }

  const planLabel = plan === "lifetime" ? "De por vida" : plan === "pro" ? "Pro" : "Mensual"

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">¡Bienvenido a Inteliar Labels! 🏷️</h1>
      <p style="color: #cde4f9; margin: 8px 0 0; font-size: 14px;">Tu cuenta ya está lista para usar</p>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      <p style="font-size: 16px;">¡Hola! 👋</p>
      <p style="font-size: 14px; line-height: 1.6;">
        Gracias por tu compra. Ya te creamos tu cuenta y activamos tu <strong>Plan ${planLabel}</strong> —
        acá tenés todo lo que necesitás para arrancar:
      </p>

      <div style="background: #f4f6fb; border: 1px solid #dbe3f0; border-radius: 10px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin:0 0 6px; font-size:13px; color:#555;">Tu acceso a la web</p>
        <p style="margin:0; font-size:14px;">Email: <strong>${to}</strong></p>
        <p style="margin:4px 0 0; font-size:14px;">Contraseña temporal: <code style="background:#fff;border:1px solid #dbe3f0;border-radius:4px;padding:2px 6px;">${password}</code></p>
      </div>

      <div style="background: #f4f6fb; border: 2px dashed #1e78dc; border-radius: 10px; padding: 16px 18px; text-align: center; margin: 18px 0;">
        <p style="margin:0 0 6px; font-size:13px; color:#555;">Tu clave de licencia</p>
        <code style="font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #1e78dc;">${licenseKey}</code>
      </div>

      <p style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">¿Cómo empezar?</p>
      <ol style="font-size: 14px; line-height: 1.8; padding-left: 18px;">
        <li>Iniciá sesión con el email y la contraseña de arriba (te va a pedir cambiarla).</li>
        <li>Descargá e instalá el agente de impresión en tu PC con Windows.</li>
        <li>Pegá tu clave de licencia para activarlo.</li>
        <li>Creá tu primera plantilla y subí tu Excel — ¡listo para imprimir!</li>
      </ol>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${APP_URL}/auth/login" style="background: #1e78dc; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Iniciar sesión →</a>
      </div>

      <p style="font-size: 13px; color: #555; line-height: 1.6;">
        Cualquier duda, respondé este mail y te ayudamos personalmente.
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
      to,
      subject: "¡Bienvenido a Inteliar Labels! 🏷️",
      html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend ${res.status}: ${text}`)
  }
}
