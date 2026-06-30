const FROM = process.env.LICENSE_EMAIL_FROM || "Inteliar Labels <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://etiquetar.app"
const RESEND_API_KEY = process.env.RESEND_API_KEY

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`[trial-sequence] Resend ${res.status}: ${text}`)
  }
}

function wrap(content: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #1e78dc; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <h2 style="color: #fff; margin: 0; font-size: 18px;">Inteliar Labels</h2>
    </div>
    <div style="border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px;">
      ${content}
      <p style="font-size: 12px; color: #aaa; margin-top: 28px; border-top: 1px solid #eee; padding-top: 16px;">
        Inteliar Labels · <a href="mailto:inteliarstack.ia@gmail.com" style="color:#aaa;">inteliarstack.ia@gmail.com</a><br>
        Si no querés recibir más emails, respondé con "cancelar suscripción".
      </p>
    </div>
  </div>`
}

function btn(label: string, url: string) {
  return `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="background:#1e78dc;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">${label}</a></div>`
}

// ── Day 1 ─────────────────────────────────────────────────────────────────────
export async function sendTrialDay1(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">¿Ya imprimiste tu primera etiqueta?</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Si todavía no lo hiciste, te cuento los pasos para que estés listo en menos de 10 minutos:
    </p>
    <ol style="font-size:14px;line-height:2;color:#333;padding-left:20px;">
      <li><strong>Descargá el agente</strong> e instalalo en tu PC con Windows.</li>
      <li><strong>Creá una plantilla</strong> con el diseñador visual (o usá una predeterminada).</li>
      <li><strong>Subí tu Excel o CSV</strong> con los datos de tus productos.</li>
      <li>¡Imprimí! Seleccioná las filas y hacé clic en "Imprimir".</li>
    </ol>
    ${btn("Ir al dashboard →", `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#555;line-height:1.6;">
      ¿Tenés alguna duda con la instalación? Respondé este email y te ayudamos en el día.
    </p>`)
  await sendEmail(to, "¿Ya imprimiste tu primera etiqueta? — Inteliar Labels", html)
}

// ── Day 3 ─────────────────────────────────────────────────────────────────────
export async function sendTrialDay3(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">3 funciones que quizás no conocés</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">Ya llevás 3 días en Inteliar Labels. Te contamos algunas funciones que hacen la diferencia:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:12px;vertical-align:top;width:28px;font-size:20px;">🤖</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Plantillas con IA</strong><br>
          <span style="color:#555;">Describí qué necesitás y la IA diseña la plantilla por vos. Ideal para empezar sin saber de diseño.</span>
        </td>
      </tr>
      <tr style="background:#f8fafd;">
        <td style="padding:12px;vertical-align:top;font-size:20px;">📊</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Importación masiva</strong><br>
          <span style="color:#555;">Subí tu planilla con 500 productos y elegí cuáles imprimir. Filtrá, seleccioná y enviá a la impresora en segundos.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;vertical-align:top;font-size:20px;">🔲</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Códigos QR y barras</strong><br>
          <span style="color:#555;">Agregá códigos QR o de barras a tus etiquetas vinculados a cualquier columna de tu planilla.</span>
        </td>
      </tr>
    </table>
    ${btn("Explorar el diseñador →", `${APP_URL}/dashboard`)}`)
  await sendEmail(to, "3 funciones de Inteliar Labels que te ahorran tiempo", html)
}

// ── Day 7 ─────────────────────────────────────────────────────────────────────
export async function sendTrialDay7(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">Funciones avanzadas para negocios que imprimen en serio</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Si ya estás usando Inteliar Labels a diario, te pueden interesar estas funciones más avanzadas:
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:12px;vertical-align:top;width:28px;font-size:20px;">🖨️</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Múltiples impresoras</strong><br>
          <span style="color:#555;">Configurá varias impresoras (depósito, mostrador, recepción) y elegí a cuál enviar cada trabajo.</span>
        </td>
      </tr>
      <tr style="background:#f8fafd;">
        <td style="padding:12px;vertical-align:top;font-size:20px;">📋</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Historial de trabajos</strong><br>
          <span style="color:#555;">Revisá todos los trabajos de impresión: cuántas etiquetas, cuándo, en qué impresora. Útil para auditoría y control.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px;vertical-align:top;font-size:20px;">🏢</td>
        <td style="padding:12px 0;vertical-align:top;">
          <strong>Múltiples sucursales</strong><br>
          <span style="color:#555;">El plan Pro permite hasta 3 sucursales con impresoras independientes. El plan De por vida hasta 5.</span>
        </td>
      </tr>
    </table>
    ${btn("Ver todos los planes →", `${APP_URL}/#pricing`)}`)
  await sendEmail(to, "Funciones avanzadas de Inteliar Labels", html)
}

// ── Day 10 ────────────────────────────────────────────────────────────────────
export async function sendTrialDay10(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">Por qué empresas como la tuya eligen Inteliar Labels</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Inteliar Labels está pensado para negocios que necesitan imprimir etiquetas todos los días:
    </p>
    <ul style="font-size:14px;line-height:2;color:#333;padding-left:20px;">
      <li>Distribuidoras y mayoristas con cientos de productos</li>
      <li>Dietéticas, farmacias y comercios que actualizan precios seguido</li>
      <li>Depósitos logísticos que necesitan etiquetas de envío</li>
      <li>E-commerce con alto volumen de pedidos</li>
      <li>Cualquier negocio que hoy pierde tiempo imprimiendo etiqueta por etiqueta</li>
    </ul>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Con Inteliar Labels, lo que antes llevaba horas hoy se hace en minutos.
    </p>
    ${btn("Seguir usando el trial →", `${APP_URL}/dashboard`)}
    <p style="font-size:13px;color:#555;">
      ¿Tenés alguna pregunta sobre si Inteliar Labels se adapta a tu operación? Respondé este mail.
    </p>`)
  await sendEmail(to, "¿Inteliar Labels es para tu negocio?", html)
}

// ── Day 13 ────────────────────────────────────────────────────────────────────
export async function sendTrialDay13(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">Tu prueba termina mañana</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Mañana se termina tu período de prueba gratuita de Inteliar Labels.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Si activás un plan hoy, <strong>todas tus plantillas y configuraciones se conservan</strong>.
      No tenés que volver a configurar nada.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
      <tr style="background:#f8fafd;">
        <td style="padding:12px;font-weight:bold;">Plan Mensual</td>
        <td style="padding:12px;color:#555;">$14.999/mes · 1 sucursal · 2.000 impresiones/mes</td>
      </tr>
      <tr>
        <td style="padding:12px;font-weight:bold;">Plan Pro</td>
        <td style="padding:12px;color:#555;">$29.999/mes · 3 sucursales · impresiones ilimitadas</td>
      </tr>
      <tr style="background:#f8fafd;">
        <td style="padding:12px;font-weight:bold;">De por vida</td>
        <td style="padding:12px;color:#555;">$449.999 único · 5 sucursales · todas las actualizaciones</td>
      </tr>
    </table>
    ${btn("Ver planes y suscribirme →", `${APP_URL}/#pricing`)}
    <p style="font-size:13px;color:#555;">
      ¿Todavía tenés dudas? Respondé este mail o escribinos por
      <a href="https://wa.me/5491165689145" style="color:#1e78dc;">WhatsApp</a> y te ayudamos a elegir el plan.
    </p>`)
  await sendEmail(to, "Tu prueba de Inteliar Labels termina mañana", html)
}

// ── Day 14 ────────────────────────────────────────────────────────────────────
export async function sendTrialDay14(to: string) {
  const html = wrap(`
    <p style="font-size:15px;font-weight:bold;margin-bottom:4px;">Último día de prueba gratuita</p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Hoy es el último día de tu prueba gratuita en Inteliar Labels.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Si decidís seguir, <strong>tus plantillas y datos no se borran</strong>.
      Activás el plan y seguís imprimiendo sin interrupciones.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#333;">
      Si hoy no es el momento, no hay problema. Podés volver cuando quieras — tu cuenta sigue activa.
    </p>
    ${btn("Activar mi plan ahora →", `${APP_URL}/#pricing`)}
    <p style="font-size:13px;color:#555;line-height:1.6;">
      ¿Querés hablarlo antes de decidir? Escribinos por
      <a href="https://wa.me/5491165689145" style="color:#1e78dc;">WhatsApp</a>
      o respondé este mail. Respondemos siempre.
    </p>`)
  await sendEmail(to, "Último día de prueba — Inteliar Labels", html)
}
