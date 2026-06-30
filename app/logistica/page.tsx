import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Logística y Envíos — Inteliar Labels",
  description: "Imprimí etiquetas de envío, remito y bulto para tu operación logística desde Excel. Compatible con Zebra, TSC y Honeywell. Trial 15 días gratis.",
}

export default function LogisticaPage() {
  return (
    <RubroPage
      slug="logistica"
      subtitle="Para logística, courier y distribución"
      title="Etiquetas de envío y logística sin errores, desde tu planilla"
      description="Generá etiquetas de envío, bultos y remitos en masa desde tu Excel o sistema de gestión. Sin tipear uno por uno, sin errores, sin demoras."
      problem="Imprimir etiquetas de envío a mano o desde sistemas lentos genera errores, retrasos y reclamos. Cada bulto mal etiquetado es un problema para el cliente y para la operación."
      solution="Con Inteliar Labels exportás el listado de pedidos desde tu sistema, lo subís y en segundos tenés todas las etiquetas listas. Con código QR, número de seguimiento y datos del destinatario."
      benefits={[
        "Importación masiva desde Excel con miles de envíos",
        "Etiquetas con código QR, código de barras y número de seguimiento",
        "Datos del destinatario, origen y bulto en cada etiqueta",
        "Compatible con Zebra, Honeywell, TSC y Bixolon",
        "Múltiples impresoras para distintos puestos de trabajo",
        "Historial completo de trabajos de impresión",
        "Soporte para distintos tamaños de etiqueta",
        "Trial 15 días gratis — sin tarjeta",
      ]}
      useCases={[
        { icon: "📦", title: "Etiquetas de bulto", desc: "Con número de orden, destinatario, origen y código QR para trazabilidad." },
        { icon: "🚚", title: "Envíos de e-commerce", desc: "Integrá tu planilla de pedidos e imprimí todas las etiquetas de envío de una sola vez." },
        { icon: "📋", title: "Remitos y documentación", desc: "Etiquetas de identificación de remito y documentación adjunta a cada bulto." },
      ]}
      templates={[
        { name: "Etiqueta de envío", size: "100×150mm", desc: "Destinatario, origen, número de seguimiento y código de barras." },
        { name: "Bulto con QR", size: "100×100mm", desc: "Número de orden, QR de trazabilidad y datos del bulto." },
        { name: "Etiqueta de depósito", size: "60×40mm", desc: "Código de producto, ubicación y cantidad para control interno." },
      ]}
      cta="Probá gratis para tu operación logística"
    />
  )
}
