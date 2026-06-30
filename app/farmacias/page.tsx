import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Farmacias — Inteliar Labels",
  description: "Imprimí etiquetas de precio, medicamentos y productos OTC para tu farmacia desde Excel. Compatible con Zebra, TSC y Brother. Trial 15 días gratis.",
}

export default function FarmaciasPage() {
  return (
    <RubroPage
      slug="farmacias"
      subtitle="Para farmacias y perfumerías"
      title="Etiquetas para farmacia: precio, producto y vencimiento al instante"
      description="Desde medicamentos hasta perfumería y cosmética. Actualizás tu lista de precios y tenés todas las etiquetas listas para imprimir sin demoras."
      problem="Una farmacia maneja cientos de productos con precios que cambian frecuentemente. Actualizar etiquetas manualmente es lento, propenso a errores y roba tiempo que debería estar dedicado al cliente."
      solution="Con Inteliar Labels cargás tu planilla de productos actualizada y en minutos tenés las etiquetas listas. Precio, nombre, código de barras y vencimiento en cada etiqueta, sin errores."
      benefits={[
        "Etiquetas con precio, vencimiento y número de lote",
        "Código de barras para escaneo en caja",
        "Importación desde Excel con toda la lista de productos",
        "Actualización de precios sin rediseñar la etiqueta",
        "Compatible con Zebra, Brother y TSC",
        "Etiquetas de góndola y de producto",
        "Soporte en español incluido",
        "Trial 15 días gratis — sin tarjeta",
      ]}
      useCases={[
        { icon: "💊", title: "Medicamentos y OTC", desc: "Etiquetas con nombre, precio, vencimiento y código de barras para control de stock." },
        { icon: "🧴", title: "Perfumería y cosmética", desc: "Etiquetas de precio para góndolas de perfumería, dermocosméticos y cuidado personal." },
        { icon: "🏷️", title: "Promociones", desc: "Etiquetas de precio especial o promoción impresas rápido cuando llega una oferta de proveedor." },
      ]}
      templates={[
        { name: "Precio con vencimiento", size: "50×30mm", desc: "Nombre, precio, fecha de vencimiento y código de barras." },
        { name: "Etiqueta de góndola", size: "80×30mm", desc: "Nombre del producto, laboratorio y precio visible en góndola." },
        { name: "Promoción", size: "60×40mm", desc: "Precio tachado, precio nuevo y descripción de la promo." },
      ]}
      cta="Probá gratis para tu farmacia"
    />
  )
}
