"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  q: string
  a: string | React.ReactNode
}

interface Section {
  title: string
  emoji: string
  items: FAQItem[]
}

const SECTIONS: Section[] = [
  {
    title: "Primeros pasos",
    emoji: "🚀",
    items: [
      {
        q: "¿Cómo creo mi primera etiqueta?",
        a: "Andá a Templates → Nueva plantilla. Elegí un preset (por ejemplo, 'Etiqueta de catering') o empezá en blanco. Agregá texto, códigos de barra o imágenes arrastrándolos al canvas. Guardá y listo.",
      },
      {
        q: "¿Qué es una plantilla?",
        a: "Una plantilla define el diseño de tu etiqueta: tamaño, posición de los elementos, tipografía y variables. Es el molde que se rellena con tus datos.",
      },
      {
        q: "¿Qué significa {{variable}}?",
        a: "Es un campo dinámico. Si ponés {{producto}} en un elemento de texto, la app reemplaza eso con el valor real de cada fila de tu Excel o del formulario manual. Por ejemplo: {{producto}} → 'Milanesas con papas'.",
      },
    ],
  },
  {
    title: "Imprimir sin Excel",
    emoji: "✏️",
    items: [
      {
        q: "¿Cómo imprimo sin cargar un Excel?",
        a: "Usá el menú 'Imprimir' del sidebar. Elegís la plantilla, completás los datos en la tabla directamente (uno por fila), ponés la cantidad de copias de cada uno, y descargás el archivo ZPL listo para enviar a la impresora.",
      },
      {
        q: "¿Qué es la columna 'Cantidad' en el formulario manual?",
        a: "Indica cuántas copias de esa etiqueta querés imprimir. Si tenés 'Milanesas con papas' con cantidad 20, se generan 20 etiquetas iguales seguidas.",
      },
    ],
  },
  {
    title: "Cargar Excel",
    emoji: "📊",
    items: [
      {
        q: "¿Qué formato debe tener el Excel?",
        a: (
          <span>
            La primera fila debe ser el encabezado con los nombres de las columnas. Cada fila siguiente es una etiqueta distinta.
            Ejemplo:
            <div className="mt-2 overflow-x-auto rounded-lg border border-border">
              <table className="text-xs w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">producto</th>
                    <th className="px-3 py-2 text-left">peso</th>
                    <th className="px-3 py-2 text-left">cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">Milanesas</td>
                    <td className="px-3 py-2">500g</td>
                    <td className="px-3 py-2">10</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2">Pollo</td>
                    <td className="px-3 py-2">1kg</td>
                    <td className="px-3 py-2">5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </span>
        ),
      },
      {
        q: "¿Qué es la 'Columna de cantidad'?",
        a: "Si tu Excel tiene una columna que dice cuántas etiquetas imprimir por producto (ej: 'cantidad'), seleccionala acá. Así si una fila dice 'cantidad = 10', la app genera 10 etiquetas iguales para ese producto. Si no tenés esa columna, se imprime 1 etiqueta por fila.",
      },
      {
        q: "¿Puedo descargar una plantilla de Excel de ejemplo?",
        a: "Sí. En la página 'Cargar Excel', abajo del área de subida, hay un botón 'Descargar plantilla Excel'. Elegís tu plantilla y descargás un .xlsx con las columnas correctas y una fila de ejemplo.",
      },
    ],
  },
  {
    title: "Variables de fecha",
    emoji: "📅",
    items: [
      {
        q: "¿Cómo pongo la fecha de hoy automáticamente?",
        a: "En el editor de plantilla, en el panel de propiedades de un elemento de texto, usá los botones de fecha rápida: 'Hoy', '+3 días', '+7 días', etc. Esto inserta {{hoy}}, {{hoy+3d}}, etc. Al generar el ZPL, se reemplaza con la fecha real del día.",
      },
      {
        q: "¿Qué variables de fecha están disponibles?",
        a: (
          <div className="space-y-1">
            {[
              ["{{hoy}}", "Fecha de hoy (ej: 05/06/2026)"],
              ["{{hoy+3d}}", "Hoy + 3 días (vencimiento corto)"],
              ["{{hoy+7d}}", "Hoy + 7 días"],
              ["{{hoy+30d}}", "Hoy + 30 días"],
              ["{{hora}}", "Hora actual (ej: 14:30)"],
              ["{{mañana}}", "Fecha de mañana"],
            ].map(([v, d]) => (
              <div key={v} className="flex items-center gap-3">
                <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-primary">{v}</code>
                <span className="text-xs text-muted-foreground">{d}</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    title: "Imprimir y ZPL",
    emoji: "🖨️",
    items: [
      {
        q: "¿Qué es un archivo ZPL?",
        a: "ZPL (Zebra Programming Language) es el lenguaje que entienden las impresoras térmicas. Es un archivo de texto que le dice a la impresora exactamente qué imprimir y dónde. Es compatible con Zebra, Honeywell, Sato, Citizen y otras marcas.",
      },
      {
        q: "¿Cómo envío el ZPL a la impresora?",
        a: "Depende de la impresora. Las opciones más comunes: (1) Conectar por USB y enviar el archivo desde el panel de la impresora o el software del fabricante. (2) Si la impresora está en red, enviar el archivo por TCP/IP al puerto 9100. (3) Usar el software ZebraDesigner o BarTender para abrir e imprimir el .zpl.",
      },
      {
        q: "¿Qué es 'Cortar cada N etiquetas'?",
        a: "Si tu impresora tiene cortador automático, podés configurar cada cuántas etiquetas corta el papel. Por ejemplo, si ponés 10, la impresora corta después de cada grupo de 10 etiquetas. Configuralo en el editor de plantilla → botón 'Tamaño'.",
      },
      {
        q: "¿Puedo retomar la impresión si hubo un error?",
        a: "Sí. En el detalle del trabajo (menú 'Trabajos' → click en el trabajo), podés indicar 'Desde etiqueta #N' antes de descargar el ZPL. Así genera solo las etiquetas a partir de ese número, sin repetir las que ya imprimiste.",
      },
    ],
  },
  {
    title: "Numeración automática (Serial)",
    emoji: "🔢",
    items: [
      {
        q: "¿Qué es el elemento 'Numeración'?",
        a: "Es un elemento especial que imprime un número diferente en cada etiqueta, incrementándose automáticamente. Útil para tickets numerados, lotes, etc. Configurás desde qué número empieza, de cuánto en cuánto sube, cuántos dígitos mostrar y un prefijo/sufijo.",
      },
      {
        q: "Ejemplo de numeración",
        a: (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Inicio: 1 · Incremento: 1 · Dígitos: 4 · Prefijo: &quot;TICKET-&quot;</p>
            <p>→ Etiqueta 1: <code className="text-primary">TICKET-0001</code></p>
            <p>→ Etiqueta 2: <code className="text-primary">TICKET-0002</code></p>
            <p>→ Etiqueta 3: <code className="text-primary">TICKET-0003</code></p>
          </div>
        ),
      },
    ],
  },
]

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-foreground pr-4">{item.q}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  )
}

export default function AyudaPage() {
  const _cn = cn // suppress unused import warning
  void _cn
  return (
    <DashboardLayout>
      <Header title="Ayuda" description="Guía de uso de Inteliar Labels" />
      <div className="p-6 space-y-6 max-w-3xl">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <span className="text-lg">{section.emoji}</span>
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <FAQRow key={item.q} item={item} />
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
          <p className="text-sm text-muted-foreground">¿Tenés una pregunta que no está acá?</p>
          <p className="text-xs text-muted-foreground">Contactanos en <span className="text-primary">soporte@inteliar.com</span></p>
        </div>
      </div>
    </DashboardLayout>
  )
}
