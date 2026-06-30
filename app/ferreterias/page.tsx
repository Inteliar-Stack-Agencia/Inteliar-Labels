import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Ferreterías — Inteliar Labels",
  description: "Imprimí etiquetas de precio y producto para tu ferretería desde Excel. Compatible con Zebra, TSC y Godex. Trial 15 días gratis.",
}

export default function FerreteriasPage() {
  return (
    <RubroPage
      slug="ferreterias"
      subtitle="Para ferreterías, corralones y materiales"
      title="Etiquetas para ferretería: precio y código en segundos"
      description="Miles de artículos, precios que cambian seguido y poco tiempo para etiquetar. Con Inteliar Labels actualizás tu planilla y tenés todas las etiquetas listas en minutos."
      problem="Una ferretería maneja miles de artículos de distintos proveedores con precios que cambian constantemente. Actualizar etiquetas es un trabajo que nunca termina y siempre está atrasado."
      solution="Con Inteliar Labels importás tu lista de precios actualizada desde Excel y reimprimir toda la ferretería es cuestión de minutos. Filtrás por proveedor, categoría o pasillo y solo imprimís lo que cambió."
      benefits={[
        "Importación de catálogos de miles de artículos desde Excel",
        "Filtrado por proveedor, categoría o pasillo",
        "Etiquetas con precio, código y descripción corta",
        "Código de barras EAN y Code 128",
        "Compatible con Zebra, TSC, Godex y Bixolon",
        "Actualización de precios sin rediseñar etiquetas",
        "Etiquetas de góndola y de estante",
        "Trial 15 días gratis — sin tarjeta",
      ]}
      useCases={[
        { icon: "🔧", title: "Lista de precios", desc: "Actualizás el Excel con los nuevos precios y reimprimir toda la ferretería lleva minutos." },
        { icon: "📦", title: "Etiquetas de estante", desc: "Identificación de posición en depósito y góndola con código de producto." },
        { icon: "🏷️", title: "Artículos por proveedor", desc: "Filtrás por proveedor y solo reimprimir los artículos que tuvieron aumento." },
      ]}
      templates={[
        { name: "Precio ferretería", size: "50×30mm", desc: "Descripción corta, precio y código de barras. Ideal para estantes." },
        { name: "Etiqueta grande", size: "80×50mm", desc: "Descripción, precio visible y código. Para artículos de mayor tamaño." },
        { name: "Código de depósito", size: "60×40mm", desc: "Código de producto, ubicación y cantidad mínima de stock." },
      ]}
      cta="Probá gratis para tu ferretería"
    />
  )
}
