import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Indumentaria y Ropa — Inteliar Labels",
  description: "Imprimí etiquetas de precio, talle y código para tu negocio de ropa desde Excel. Compatible con Zebra, TSC y Brother. Trial 15 días gratis.",
}

export default function IndumentariaPage() {
  return (
    <RubroPage
      slug="indumentaria"
      subtitle="Para indumentaria, calzado y accesorios"
      title="Etiquetas para ropa y calzado: talle, precio y código en segundos"
      description="Importás tu colección desde Excel y tenés etiquetas de precio, talle y código para cada artículo listas para imprimir. Sin hacerlas una por una."
      problem="En un negocio de ropa hay cientos de variantes por talle, color y modelo. Etiquetar cada artículo manualmente lleva horas y es difícil mantener los precios actualizados en toda la colección."
      solution="Con Inteliar Labels subís tu planilla con todos los artículos, talles y precios, y en minutos tenés todas las etiquetas listas. Cambiar precios de toda la colección es tan fácil como actualizar el Excel."
      benefits={[
        "Etiquetas por SKU, talle, color y precio",
        "Importación masiva de toda la colección desde Excel",
        "Código de barras por variante de talle y color",
        "Actualización de precios en toda la colección al instante",
        "Compatible con Zebra, Brother, TSC y Godex",
        "Plantillas con logo de tu marca",
        "Etiquetas de liquidación y promoción",
        "Trial 15 días gratis — sin tarjeta",
      ]}
      useCases={[
        { icon: "👕", title: "Etiquetas de precio", desc: "Artículo, talle, color y precio. Con código de barras para escaneo en caja." },
        { icon: "🏪", title: "Temporada nueva", desc: "Cuando entra la nueva colección, importás el Excel y tenés todas las etiquetas listas en minutos." },
        { icon: "🔖", title: "Liquidación", desc: "Etiquetas de descuento y liquidación impresas rápido cuando necesitás mover stock." },
      ]}
      templates={[
        { name: "Etiqueta de prenda", size: "40×60mm", desc: "Nombre del artículo, talle, color, precio y código de barras." },
        { name: "Colgante de precio", size: "50×80mm", desc: "Logo, nombre, precio tachado/nuevo y talle. Ideal para temporada." },
        { name: "Liquidación", size: "50×30mm", desc: "Precio anterior, descuento y precio final en grande." },
      ]}
      cta="Probá gratis para tu negocio de ropa"
    />
  )
}
