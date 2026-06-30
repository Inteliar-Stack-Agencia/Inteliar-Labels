import { RubroPage } from "@/components/landing/rubro-page"

export const metadata = {
  title: "Etiquetas para Mayoristas y Distribuidoras — Inteliar Labels",
  description: "Imprimí etiquetas de precio y producto para mayoristas y distribuidoras desde Excel. Miles de etiquetas en minutos. Compatible con Zebra y TSC.",
}

export default function MayoristasPage() {
  return (
    <RubroPage
      slug="mayoristas"
      subtitle="Para mayoristas y distribuidoras"
      title="Miles de etiquetas para tu mayorista, en minutos"
      description="Manejás cientos o miles de productos y los precios cambian seguido. Con Inteliar Labels actualizás tu planilla y reimprimir es cuestión de segundos, no de horas."
      problem="Un mayorista con 500 productos que cambia precios semanalmente necesita reimprimir cientos de etiquetas. Hacerlo manualmente o con software caro y complejo cuesta tiempo y plata."
      solution="Con Inteliar Labels subís tu lista de precios actualizada desde Excel y en minutos tenés todas las etiquetas listas para imprimir. Filtrar por categoría, proveedor o línea de productos es simple."
      benefits={[
        "Importación de catálogos completos desde Excel o CSV",
        "Actualización masiva de precios sin rediseñar etiquetas",
        "Filtrado por categoría, proveedor o código de producto",
        "Código de barras EAN-13 y Code 128 en cada etiqueta",
        "Compatible con impresoras Zebra, TSC, Godex y Brother",
        "Hasta 5 sucursales con el plan De por vida",
        "Historial de impresiones para control interno",
        "Trial 15 días gratis — sin tarjeta",
      ]}
      useCases={[
        { icon: "💰", title: "Lista de precios", desc: "Actualizás el Excel con los nuevos precios y reimprimir toda la lista lleva minutos." },
        { icon: "📦", title: "Etiquetas de depósito", desc: "Identificación de cajas, pallets y posiciones de depósito con código de barras." },
        { icon: "🏷️", title: "Etiquetas propias", desc: "Aplicás tu marca y datos en los productos que distribuís antes de entregarlos." },
      ]}
      templates={[
        { name: "Precio mayorista", size: "50×30mm", desc: "Nombre, código, precio mayorista y código de barras." },
        { name: "Etiqueta de caja", size: "100×50mm", desc: "Producto, cantidad, código y lote para identificación de cajas." },
        { name: "Precio con logo", size: "60×40mm", desc: "Logo del distribuidor, nombre del producto y precio." },
      ]}
      cta="Probá gratis para tu mayorista"
    />
  )
}
