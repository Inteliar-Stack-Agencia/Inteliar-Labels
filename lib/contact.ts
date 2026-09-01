/**
 * Datos de contacto de la empresa, en un solo lugar.
 *
 * Antes el número de WhatsApp estaba repetido en 15 lugares distintos, así que
 * cambiarlo implicaba buscarlo archivo por archivo con el riesgo de dejar
 * alguno viejo. Todo lo que muestre el contacto debe importarlo de acá.
 */

/** Email de soporte y contacto. */
export const SUPPORT_EMAIL = "inteliarstack.ia@gmail.com"

/** Link mailto al soporte, con asunto opcional. */
export function supportMailto(subject?: string): string {
  const base = `mailto:${SUPPORT_EMAIL}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}

/** Número de WhatsApp en formato internacional, sin + ni separadores. */
export const SUPPORT_WHATSAPP = "5491133649730"

/** Base del link a WhatsApp, sin mensaje. */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP}`

/**
 * Link a WhatsApp con un mensaje inicial ya escrito.
 * El texto se codifica acá, así que se pasa en castellano y sin escapar.
 */
export function whatsappLink(message?: string): string {
  if (!message) return SUPPORT_WHATSAPP_URL
  return `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}
