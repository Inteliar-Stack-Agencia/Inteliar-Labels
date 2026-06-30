import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Dietéticas — Inteliar Labels",
  description: "Imprimí etiquetas de precio, vencimiento y producto para tu dietética desde Excel. Compatible con Zebra, TSC y Godex. Trial 15 días gratis.",
}

export default function DieteticasPage() {
  return (
    <RubroPage
      slug="dieteticas"
      subtitle="Para dietéticas y casas de nutrición"
      title="Etiquetas para dietéticas en segundos, desde tu planilla"
      description="Actualizá precios, imprimí etiquetas de granel, vencimiento y producto sin perder tiempo. Subí tu Excel y tenés todo listo para imprimir al instante."
      problem="En una dietética los precios cambian todo el tiempo y hay cientos de productos a granel que necesitan etiqueta. Hacerlas una por una lleva horas, y los errores de precio son costosos."
      solution="Con Inteliar Labels subís tu planilla de productos, elegís el template y en minutos tenés todas las etiquetas listas para imprimir en tu impresora térmica. Actualizás el Excel y reimprimir es cuestión de segundos."
      benefits={[
        "Importación masiva desde Excel o CSV con todos tus productos",
        "Etiquetas de precio, granel, vencimiento y código de barras",
        "Actualización de precios sin rediseñar la etiqueta",
        "Compatible con Zebra, TSC, Godex y Bixolon",
        "Plantillas personalizables con tu logo y colores",
        "Trial 15 días gratis — sin tarjeta de crédito",
        "Soporte en español incluido",
        "Listo para imprimir en menos de 10 minutos",
      ]}
      useCases={[
        { icon: "🏷️", title: "Etiquetas de precio", desc: "Con nombre, precio y código de barras. Actualizás el Excel y reimprimir tarda segundos." },
        { icon: "⚖️", title: "Productos a granel", desc: "Etiquetas con peso, precio por kilo y vencimiento para frutas secas, cereales, legumbres y más." },
        { icon: "📅", title: "Fecha de vencimiento", desc: "Etiquetas con fecha de elaboración y vencimiento para productos fraccionados." },
      ]}
      templates={[
        { name: "Precio básico", size: "50×30mm", desc: "Nombre del producto, precio y código de barras. Ideal para góndolas." },
        { name: "Granel con peso", size: "60×40mm", desc: "Nombre, precio/kg, peso y vencimiento para productos fraccionados." },
        { name: "Precio grande", size: "80×50mm", desc: "Etiqueta de góndola con precio grande y visible." },
      ]}
      cta="Probá gratis para tu dietética"
    />
  )
}
