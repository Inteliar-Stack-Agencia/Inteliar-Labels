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
    title: "Cómo funciona el sistema",
    emoji: "🧭",
    items: [
      {
        q: "¿Cómo funciona todo, de principio a fin?",
        a: (
          <div className="space-y-3">
            <p>El sistema separa dos cosas: el <strong>diseño</strong> (la plantilla) y los <strong>datos</strong> (tu Excel). El nexo entre los dos son los nombres de las variables.</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li><strong>Diseñás la plantilla</strong> con variables como <code>{"{{empresa}}"}</code>, <code>{"{{plato}}"}</code>, <code>{"{{comensal}}"}</code>.</li>
              <li><strong>Descargás el Excel</strong> (botón "Descargar Excel" en el editor): sale con una columna por cada variable.</li>
              <li><strong>Llenás el Excel</strong> con tus datos reales, una fila por etiqueta.</li>
              <li><strong>Subís el Excel</strong> en "Cargar datos" y <strong>elegís qué plantilla usar</strong> (paso 2).</li>
              <li><strong>El sistema cruza</strong> cada columna con su variable: la columna <code>empresa</code> rellena <code>{"{{empresa}}"}</code>, etc.</li>
              <li><strong>Imprime</strong> una etiqueta por fila, con el diseño de la plantilla.</li>
            </ol>
          </div>
        ),
      },
      {
        q: "¿Cómo sabe el sistema qué plantilla usar con mi Excel?",
        a: "No lo adivina: vos lo elegís. Al subir el Excel, en el paso 2 ('Configurar') hay una sección 'Plantilla de etiqueta' donde seleccionás cuál usar. Ahí es donde unís los datos con el diseño.",
      },
      {
        q: "¿Cómo se conectan las columnas del Excel con la plantilla?",
        a: "Por el nombre exacto. Si la plantilla tiene {{empresa}}, el sistema busca una columna llamada 'empresa' en el Excel. Por eso conviene usar el botón 'Descargar Excel' del editor: te da las columnas con los nombres correctos y evitás errores de tipeo (ej: 'Empresa' con mayúscula no matchea con {{empresa}}).",
      },
      {
        q: "¿El logo o las imágenes van en el Excel?",
        a: "No. El logo es parte del diseño de la plantilla, no un dato. Queda guardado dentro de la plantilla y se imprime automáticamente en todas las etiquetas. El Excel es solo para lo que cambia fila por fila (nombre, plato, precio). El logo es fijo y vive en el diseño.",
      },
      {
        q: "¿Para qué sirve cada sección del menú?",
        a: (
          <div className="space-y-1.5">
            <p><strong>Templates</strong>: diseñás y guardás tus plantillas (los moldes).</p>
            <p><strong>Cargar datos</strong>: subís el Excel/CSV, elegís la plantilla y generás un lote.</p>
            <p><strong>Imprimir</strong>: cargás datos a mano (sin Excel) para lotes chicos.</p>
            <p><strong>Trabajos / Historial</strong>: ves lo que imprimiste y podés reimprimir.</p>
            <p><strong>Configuración</strong>: conectás y administrás tus impresoras.</p>
          </div>
        ),
      },
    ],
  },
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
    title: "Código QR",
    emoji: "📱",
    items: [
      {
        q: "¿Qué información puedo poner en un QR?",
        a: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Un QR puede contener cualquier texto. Al escanearlo con el celular, muestra o abre ese contenido. Las opciones más comunes:</p>
            <div className="space-y-1.5 mt-2">
              {[
                ["🌐 URL de tu web o menú", "https://turestaurante.com/menu"],
                ["💬 Link directo a WhatsApp", "https://wa.me/5491112345678"],
                ["📋 Ficha del producto", "https://tutienda.com/producto/{{codigo}}"],
                ["📸 Redes sociales", "https://instagram.com/tuempresa"],
                ["📝 Formulario de pedidos", "https://forms.google.com/..."],
                ["🔍 Info de trazabilidad", "Lote: {{lote}} - Fecha: {{hoy}}"],
              ].map(([label, example]) => (
                <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="font-medium text-foreground">{label}</p>
                  <code className="text-[10px] text-primary">{example}</code>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        q: "¿Cómo combino el QR con datos del Excel?",
        a: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Usá variables dentro del contenido del QR. Ejemplos:</p>
            <div className="space-y-1 mt-1">
              <div className="rounded bg-muted px-3 py-1.5">
                <code className="text-primary">{"https://miempresa.com/plato/{{codigo_plato}}"}</code>
                <p className="mt-0.5">→ Cada etiqueta abre la página de ese plato específico</p>
              </div>
              <div className="rounded bg-muted px-3 py-1.5">
                <code className="text-primary">{"https://wa.me/549{{telefono}}"}</code>
                <p className="mt-0.5">→ Abre WhatsApp con el número del cliente</p>
              </div>
              <div className="rounded bg-muted px-3 py-1.5">
                <code className="text-primary">{"Pedido: {{numero_pedido}} - {{hoy}}"}</code>
                <p className="mt-0.5">→ Texto con número de pedido y fecha</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        q: "¿Para qué sirve el QR en etiquetas de catering o food service?",
        a: (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Es muy útil para que el cliente final escanee la etiqueta y acceda a:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Información nutricional y alérgenos del plato</li>
              <li>Menú completo del día o de la semana</li>
              <li>Formulario para hacer el próximo pedido</li>
              <li>Contacto directo por WhatsApp para consultas</li>
              <li>Redes sociales del negocio</li>
            </ul>
            <p className="mt-2">Solo necesitás tener una página web, un Google Form, o incluso un link de Instagram. Lo ponés en el campo de contenido del elemento QR y listo.</p>
          </div>
        ),
      },
      {
        q: "¿Cómo agrego un QR a mi plantilla?",
        a: "En el editor de plantilla, hacé click en el botón 'QR' de la barra de herramientas. Se agrega un elemento QR al canvas. Selecciónalo y en el panel de propiedades escribí el contenido: una URL, un texto, o una variable como {{url_producto}}. El QR se genera automáticamente en cada etiqueta al imprimir.",
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
  const _cn = cn
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
