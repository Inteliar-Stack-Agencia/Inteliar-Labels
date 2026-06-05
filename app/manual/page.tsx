"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  BookOpen,
  LayoutTemplate,
  Calendar,
  QrCode,
  Barcode,
  FileSpreadsheet,
  Hash,
  Printer,
  RotateCcw,
  Scissors,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  ClipboardList,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// ─────────────────────────────────────────────
// Table of contents definition
// ─────────────────────────────────────────────

const TOC = [
  { id: "introduccion", label: "Introducción", icon: BookOpen },
  { id: "crear-plantilla", label: "Crear una plantilla", icon: LayoutTemplate },
  { id: "variables-dinamicas", label: "Variables dinámicas", icon: Calendar },
  { id: "codigo-qr", label: "Código QR", icon: QrCode },
  { id: "codigo-barras", label: "Código de barras", icon: Barcode },
  { id: "imprimir-sin-excel", label: "Imprimir sin Excel", icon: ClipboardList },
  { id: "imprimir-con-excel", label: "Imprimir con Excel", icon: FileSpreadsheet },
  { id: "numeracion-automatica", label: "Numeración automática", icon: Hash },
  { id: "zpl-impresora", label: "Imprimir y enviar a la impresora", icon: Printer },
  { id: "retomar-impresion", label: "Retomar impresión", icon: RotateCcw },
  { id: "corte-automatico", label: "Corte automático", icon: Scissors },
]

// ─────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-3 scroll-mt-6 text-xl font-bold text-foreground border-b border-border pb-3 mb-5"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      {children}
    </h2>
  )
}

function Step({
  number,
  children,
}: {
  number: number
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
        {number}
      </span>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

function Steps({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 my-4">{children}</div>
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 my-4">
      <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{children}</p>
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 my-4">
      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{children}</p>
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-lg border border-border bg-muted px-4 py-3 text-xs font-mono text-foreground leading-relaxed">
      {children}
    </pre>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">
      {children}
    </code>
  )
}

function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border even:bg-muted/20">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-muted-foreground">
                  {j === 0 ? (
                    <InlineCode>{cell}</InlineCode>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sidebar TOC
// ─────────────────────────────────────────────

function TocSidebar({ activeId }: { activeId: string }) {
  return (
    <aside className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-6 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">
          Contenido
        </p>
        <nav className="space-y-0.5">
          {TOC.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors",
                activeId === id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="leading-tight">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function ManualPage() {
  const [activeId, setActiveId] = useState("introduccion")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    )

    TOC.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <DashboardLayout>
      <Header
        title="Manual de usuario"
        description="Guía completa de Inteliar Labels"
        actions={
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al Panel
          </Link>
        }
      />

      <div className="flex gap-8 p-6 max-w-6xl">
        {/* ── Sidebar TOC ── */}
        <TocSidebar activeId={activeId} />

        {/* ── Content ── */}
        <article className="min-w-0 flex-1 space-y-14">

          {/* ══════════════════════════════════════
              1. INTRODUCCIÓN
          ══════════════════════════════════════ */}
          <section id="introduccion">
            <SectionHeading id="introduccion" icon={BookOpen}>
              Introducción
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">Inteliar Labels</strong> es una plataforma SaaS para diseñar e imprimir
              etiquetas térmicas sin necesidad de software especializado. Diseñás tus plantillas desde el navegador,
              cargás los datos desde un Excel o completás un formulario, y descargás un archivo ZPL listo para enviarlo
              a cualquier impresora térmica compatible (Zebra, Honeywell, Sato, Citizen y otras marcas que hablen ZPL).
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">¿Para quién es?</strong> Para negocios gastronómicos (catering,
              restaurantes, food service), comercios (retail, depósito, logística) y cualquier empresa que necesite
              generar etiquetas con datos variables: fechas de vencimiento, lotes, códigos de barras, QR, numeración
              automática y más.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              <strong className="text-foreground">Flujo resumido:</strong>
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Diseñá la plantilla",
                  desc: "Creá el molde de tu etiqueta con textos, QR, barcode, imagen y numeración.",
                },
                {
                  step: "2",
                  title: "Cargá los datos",
                  desc: "Completá el formulario manual o subí tu Excel con todos los productos.",
                },
                {
                  step: "3",
                  title: "Imprimí",
                  desc: "Descargá el archivo ZPL y envialo a tu impresora térmica.",
                },
              ].map(({ step, title, desc }) => (
                <div
                  key={step}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {step}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <Tip>
              Si es tu primera vez, te recomendamos empezar con un preset ya configurado (por ejemplo,
              &quot;Etiqueta de catering&quot;) para entender cómo funciona la herramienta antes de crear
              una plantilla en blanco.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              2. CREAR UNA PLANTILLA
          ══════════════════════════════════════ */}
          <section id="crear-plantilla">
            <SectionHeading id="crear-plantilla" icon={LayoutTemplate}>
              Crear una plantilla
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Una <strong className="text-foreground">plantilla</strong> es el molde de tu etiqueta: define el tamaño
              del papel, la posición de cada elemento (texto, código de barras, QR, imagen, número de serie) y las
              variables que se rellenarán con datos reales al imprimir.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Crear desde cero o desde un preset</h3>
            <Steps>
              <Step number={1}>
                Andá a <strong>Templates</strong> en el sidebar y hacé click en{" "}
                <strong>Nueva plantilla</strong>.
              </Step>
              <Step number={2}>
                En el diálogo que aparece, elegí un <strong>preset</strong> (plantilla preconfigurada) o
                seleccioná <strong>En blanco</strong>. Los presets disponibles incluyen modelos para
                catering, retail, envíos, almacén y más.
              </Step>
              <Step number={3}>
                Ingresá un nombre descriptivo para la plantilla (por ejemplo, &quot;Etiqueta vianda
                almuerzo&quot;) y hacé click en <strong>Crear</strong>.
              </Step>
              <Step number={4}>
                Se abre el <strong>editor visual</strong>. Desde acá configurás todo el diseño.
              </Step>
            </Steps>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Configurar el tamaño de la etiqueta</h3>
            <Steps>
              <Step number={1}>
                En el editor, hacé click en el botón <strong>Tamaño</strong> (arriba a la derecha del canvas).
              </Step>
              <Step number={2}>
                Ingresá el <strong>ancho</strong> y <strong>alto</strong> en milímetros. Los tamaños más
                comunes son 100×50 mm y 57×32 mm.
              </Step>
              <Step number={3}>
                También podés configurar la opción de <strong>corte automático</strong> (ver sección{" "}
                <a href="#corte-automatico" className="text-primary hover:underline">Corte automático</a>).
              </Step>
            </Steps>

            <Warning>
              El tamaño debe coincidir exactamente con el papel que cargás en la impresora. Si no coincide,
              las etiquetas van a quedar mal posicionadas o cortadas.
            </Warning>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Agregar elementos al canvas</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              La barra de herramientas del editor tiene los siguientes elementos que podés arrastrar o
              agregar al canvas:
            </p>

            <div className="space-y-3">
              {[
                {
                  name: "Texto",
                  desc: "Muestra cualquier texto fijo o variable. Podés poner el nombre del producto, la fecha de elaboración, instrucciones de uso, etc. Soporta variables como {{producto}} o {{hoy}}.",
                },
                {
                  name: "Código de barras",
                  desc: "Genera un código de barras lineal (Code 128, EAN-13, EAN-8, Code 39, Data Matrix). El contenido puede ser fijo o provenir de una columna del Excel.",
                },
                {
                  name: "Código QR",
                  desc: "Genera un QR bidimensional. Podés poner una URL, un mensaje de WhatsApp, un formulario de pedidos o cualquier texto. También soporta variables del Excel.",
                },
                {
                  name: "Imagen",
                  desc: "Cargá el logo de tu empresa o cualquier imagen estática para incluirla en la etiqueta.",
                },
                {
                  name: "Numeración",
                  desc: "Imprime un número diferente en cada etiqueta, incrementándose automáticamente. Configurás inicio, incremento, dígitos, prefijo y sufijo.",
                },
              ].map(({ name, desc }) => (
                <div key={name} className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Editar propiedades de un elemento</h3>
            <Steps>
              <Step number={1}>
                Hacé click sobre el elemento en el canvas para seleccionarlo.
              </Step>
              <Step number={2}>
                En el panel de la derecha aparecen las propiedades: contenido, tamaño de fuente, posición
                (X, Y), ancho, alto, y otras opciones específicas de cada tipo.
              </Step>
              <Step number={3}>
                Podés mover los elementos arrastrándolos, o ingresar los valores exactos de posición en
                el panel de propiedades.
              </Step>
              <Step number={4}>
                Para eliminar un elemento, seleccionalo y presioná <InlineCode>Supr</InlineCode> o hacé
                click en el ícono de papelera del panel.
              </Step>
            </Steps>

            <Tip>
              Guardá frecuentemente con el botón <strong>Guardar</strong>. Los cambios no guardados se
              pierden si cerrás la pestaña.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              3. VARIABLES DINÁMICAS
          ══════════════════════════════════════ */}
          <section id="variables-dinamicas">
            <SectionHeading id="variables-dinamicas" icon={Calendar}>
              Variables dinámicas
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Una <strong className="text-foreground">variable dinámica</strong> es un marcador de posición
              que se reemplaza por un valor real al momento de generar el archivo ZPL. Se escriben entre
              dobles llaves: <InlineCode>{"{{nombre_variable}}"}</InlineCode>.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Hay dos tipos de variables:
            </p>

            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Variables del Excel o formulario</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Corresponden a los encabezados de tu Excel. Si tu planilla tiene una columna
                  &quot;producto&quot;, podés usar <InlineCode>{"{{producto}}"}</InlineCode> en cualquier
                  elemento de texto o QR.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Variables de fecha y hora</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Se calculan automáticamente al momento de imprimir, sin necesidad de tenerlas en el Excel.
                  Son ideales para fechas de elaboración, vencimiento y hora de producción.
                </p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Tabla completa de variables de fecha</h3>

            <Table
              headers={["Variable", "Descripción", "Ejemplo de salida"]}
              rows={[
                ["{{hoy}}", "Fecha de hoy", "05/06/2026"],
                ["{{hoy+1d}}", "Mañana", "06/06/2026"],
                ["{{hoy+2d}}", "Hoy + 2 días", "07/06/2026"],
                ["{{hoy+3d}}", "Hoy + 3 días (vto. corto)", "08/06/2026"],
                ["{{hoy+5d}}", "Hoy + 5 días", "10/06/2026"],
                ["{{hoy+7d}}", "Hoy + 7 días (una semana)", "12/06/2026"],
                ["{{hoy+15d}}", "Hoy + 15 días (quincena)", "20/06/2026"],
                ["{{hoy+30d}}", "Hoy + 30 días (un mes)", "05/07/2026"],
                ["{{hoy+60d}}", "Hoy + 60 días", "04/08/2026"],
                ["{{hoy+90d}}", "Hoy + 90 días (trimestre)", "03/09/2026"],
                ["{{mañana}}", "Fecha de mañana (alias)", "06/06/2026"],
                ["{{hora}}", "Hora actual (24 h)", "14:30"],
                ["{{hora_ampm}}", "Hora en formato 12 h", "02:30 PM"],
                ["{{fecha_larga}}", "Fecha con nombre del mes", "05 de junio de 2026"],
                ["{{dia}}", "Solo el día", "05"],
                ["{{mes}}", "Solo el mes (número)", "06"],
                ["{{año}}", "Solo el año", "2026"],
              ]}
            />

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Cómo usar variables en la plantilla</h3>
            <Steps>
              <Step number={1}>
                En el editor de plantilla, seleccioná un elemento de <strong>Texto</strong>.
              </Step>
              <Step number={2}>
                En el campo de contenido del panel de propiedades, escribí el texto y la variable.
                Por ejemplo: <InlineCode>{"Elaborado: {{hoy}}"}</InlineCode>.
              </Step>
              <Step number={3}>
                Para las variables de fecha, también podés usar los <strong>botones de fecha rápida</strong>{" "}
                del panel de propiedades (Hoy, +3 días, +7 días, etc.) para insertarlas sin tipear.
              </Step>
              <Step number={4}>
                Al generar el ZPL, todas las variables se reemplazan por sus valores reales del momento.
              </Step>
            </Steps>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Combinar variables</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Podés mezclar texto fijo, variables del Excel y variables de fecha en el mismo elemento:
            </p>

            <CodeBlock>
              {`Producto: {{producto}}\nElaborado: {{hoy}}\nVencimiento: {{hoy+3d}}\nLote: {{lote}} - {{hora}}`}
            </CodeBlock>

            <Tip>
              Las variables distinguen mayúsculas y minúsculas. Si tu columna en el Excel se llama
              &quot;Producto&quot; (con P mayúscula), la variable debe ser <InlineCode>{"{{Producto}}"}</InlineCode>.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              4. CÓDIGO QR
          ══════════════════════════════════════ */}
          <section id="codigo-qr">
            <SectionHeading id="codigo-qr" icon={QrCode}>
              Código QR
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              El elemento <strong className="text-foreground">Código QR</strong> genera un código bidimensional
              que puede contener cualquier texto o URL. Al escanearlo con un celular, el usuario puede abrir
              un sitio web, enviar un mensaje de WhatsApp, ver información del producto y mucho más.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Agregar un QR a la plantilla</h3>
            <Steps>
              <Step number={1}>
                En el editor de plantilla, hacé click en el botón <strong>QR</strong> de la barra de herramientas.
                Se agrega un elemento QR al canvas.
              </Step>
              <Step number={2}>
                Seleccioná el elemento y, en el panel de propiedades, ingresá el contenido del QR.
                Puede ser una URL, un texto, o una combinación con variables.
              </Step>
              <Step number={3}>
                Ajustá el tamaño del QR arrastrando sus bordes o ingresando los valores en el panel.
                Asegurate de que quede suficientemente grande para ser escaneado (mínimo 15 mm).
              </Step>
              <Step number={4}>
                Guardá la plantilla. El QR real se genera al imprimir con los datos.
              </Step>
            </Steps>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Qué podés poner en un QR</h3>

            <div className="space-y-2 my-4">
              {[
                {
                  tipo: "URL de tu web o menú",
                  ejemplo: "https://turestaurante.com/menu",
                  desc: "El cliente escanea y accede directo al menú del día.",
                },
                {
                  tipo: "Link directo a WhatsApp",
                  ejemplo: "https://wa.me/5491112345678",
                  desc: "Abre una conversación de WhatsApp con tu número.",
                },
                {
                  tipo: "Ficha del producto (dinámica)",
                  ejemplo: "https://tutienda.com/producto/{{codigo}}",
                  desc: "Cada etiqueta abre la página del producto específico.",
                },
                {
                  tipo: "Redes sociales",
                  ejemplo: "https://instagram.com/tuempresa",
                  desc: "Lleva al cliente a tu perfil de Instagram.",
                },
                {
                  tipo: "Formulario de pedidos",
                  ejemplo: "https://forms.gle/abc123",
                  desc: "El cliente completa el próximo pedido escaneando la etiqueta.",
                },
                {
                  tipo: "Info de trazabilidad",
                  ejemplo: "Lote: {{lote}} - Fecha: {{hoy}} - Prod: {{producto}}",
                  desc: "Texto con datos de origen para control interno.",
                },
              ].map(({ tipo, ejemplo, desc }) => (
                <div key={tipo} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{tipo}</p>
                  <CodeBlock>{ejemplo}</CodeBlock>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">
              Combinar el QR con columnas del Excel
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Cualquier columna de tu Excel puede usarse dentro del contenido del QR. Ejemplo: si tu
              planilla tiene una columna &quot;codigo_plato&quot;, podés poner en el QR:
            </p>
            <CodeBlock>{"https://mirestaurante.com/plato/{{codigo_plato}}"}</CodeBlock>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al generar las etiquetas, cada QR apuntará a la URL específica de ese plato.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Casos de uso por industria</h3>

            <div className="grid gap-3 sm:grid-cols-3 my-4">
              {[
                {
                  industria: "Catering / Food Service",
                  usos: [
                    "Información nutricional y alérgenos",
                    "Menú del día o de la semana",
                    "Formulario para el próximo pedido",
                    "Contacto directo por WhatsApp",
                  ],
                },
                {
                  industria: "Retail / E-commerce",
                  usos: [
                    "Ficha de producto con precio actualizado",
                    "Reseñas y valoraciones del producto",
                    "Programa de fidelización",
                    "Instrucciones de uso o instalación",
                  ],
                },
                {
                  industria: "Logística / Envíos",
                  usos: [
                    "Tracking del envío en tiempo real",
                    "Datos del destinatario ampliados",
                    "Confirmación de entrega",
                    "Datos de trazabilidad del lote",
                  ],
                },
              ].map(({ industria, usos }) => (
                <div key={industria} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">{industria}</p>
                  <ul className="space-y-1">
                    {usos.map((u) => (
                      <li key={u} className="flex items-start gap-1.5">
                        <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Warning>
              El tamaño del QR influye en su legibilidad. Cuanto más información contiene, más denso se
              vuelve el código. Para URLs largas o texto extenso, usá un QR de al menos 20×20 mm.
            </Warning>
          </section>

          {/* ══════════════════════════════════════
              5. CÓDIGO DE BARRAS
          ══════════════════════════════════════ */}
          <section id="codigo-barras">
            <SectionHeading id="codigo-barras" icon={Barcode}>
              Código de barras
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              El elemento <strong className="text-foreground">Código de barras</strong> genera códigos
              lineales o matriciales para escanear con lectores industriales, terminales de punto de venta,
              o apps de celular. El contenido puede ser un valor fijo o una variable del Excel.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Tipos de código disponibles</h3>

            <Table
              headers={["Tipo", "Uso recomendado", "Longitud del dato"]}
              rows={[
                ["Code 128", "Uso general, almacén, logística, identificación interna", "Variable (letras y números)"],
                ["EAN-13", "Productos de consumo masivo, góndola de supermercado", "13 dígitos exactos"],
                ["EAN-8", "Productos pequeños donde no entra el EAN-13", "8 dígitos exactos"],
                ["Code 39", "Industria, documentos, partes de equipos (solo alfanumérico)", "Variable (A-Z, 0-9)"],
                ["Data Matrix", "Espacios reducidos, piezas industriales, farmacéutica", "Variable (alta densidad)"],
              ]}
            />

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">¿Cuándo usar cada uno?</h3>

            <div className="space-y-3 my-4">
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Code 128 — El más versátil</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Soporta letras, números y caracteres especiales de cualquier longitud. Ideal para
                  códigos internos, número de pedido, código de lote o cualquier identificador propio.
                  Si no sabés cuál usar, usá este.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-semibold text-foreground">EAN-13 y EAN-8 — Estándar de retail</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Son los códigos de barra que aparecen en los productos del supermercado. Requieren un
                  número GS1 registrado. Usalos solo si tus productos se venden en grandes superficies
                  o necesitás cumplir estándares GS1.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Code 39 — Industria y documentos</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Solo acepta letras mayúsculas (A–Z), números (0–9) y algunos caracteres especiales.
                  Es más grande que Code 128 para la misma cantidad de datos. Usalo si tu sistema de
                  gestión requiere específicamente Code 39.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Data Matrix — Alta densidad</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Código bidimensional que almacena mucha información en poco espacio. Ideal para piezas
                  industriales pequeñas, farmacéutica, electrónica. Requiere un lector 2D para escanearlo
                  (no funciona con lectores de barras lineales comunes).
                </p>
              </div>
            </div>

            <Tip>
              Para etiquetas de catering o almacén con datos internos, <strong>Code 128</strong> es
              siempre la mejor opción. Es compatible con todos los lectores de códigos de barras del mercado.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              6. IMPRIMIR SIN EXCEL
          ══════════════════════════════════════ */}
          <section id="imprimir-sin-excel">
            <SectionHeading id="imprimir-sin-excel" icon={ClipboardList}>
              Imprimir sin Excel
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Si tenés pocos productos o querés imprimir de forma rápida sin preparar una planilla,
              usá el <strong className="text-foreground">formulario manual</strong>. Es la forma más
              directa de generar etiquetas.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Flujo paso a paso</h3>
            <Steps>
              <Step number={1}>
                Andá a <strong>Imprimir</strong> en el sidebar (o ingresá directamente a{" "}
                <InlineCode>/imprimir</InlineCode>).
              </Step>
              <Step number={2}>
                En el selector de plantilla, elegí la plantilla que querés usar.
              </Step>
              <Step number={3}>
                Se muestra una tabla con una fila por producto. Cada columna corresponde a una
                variable de la plantilla (por ejemplo: &quot;producto&quot;, &quot;peso&quot;,
                &quot;lote&quot;).
              </Step>
              <Step number={4}>
                Completá los datos en cada celda. Hacé click en <strong>+ Agregar fila</strong>
                para sumar más productos.
              </Step>
              <Step number={5}>
                En la columna <strong>Cantidad</strong>, ingresá cuántas etiquetas iguales querés
                de cada fila. Por ejemplo: si ponés 20, se generan 20 etiquetas idénticas para ese
                producto.
              </Step>
              <Step number={6}>
                Hacé click en <strong>Generar ZPL</strong>. Se crea un trabajo de impresión y podés
                descargar el archivo ZPL.
              </Step>
            </Steps>

            <Warning>
              Las variables de fecha (<InlineCode>{"{{hoy}}"}</InlineCode>,{" "}
              <InlineCode>{"{{hoy+3d}}"}</InlineCode>, etc.) se calculan automáticamente y
              <strong> no aparecen como columnas en el formulario</strong>. No necesitás ingresarlas
              a mano.
            </Warning>

            <Tip>
              Si vas a imprimir los mismos productos todos los días (por ejemplo, viandas de catering),
              el formulario manual es la forma más rápida: completás los datos en segundos y descargás
              el ZPL en el acto.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              7. IMPRIMIR CON EXCEL
          ══════════════════════════════════════ */}
          <section id="imprimir-con-excel">
            <SectionHeading id="imprimir-con-excel" icon={FileSpreadsheet}>
              Imprimir con Excel
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Cuando tenés muchos productos o ya tenés la información organizada en una planilla,
              podés cargar un archivo <strong className="text-foreground">Excel (.xlsx) o CSV (.csv)</strong>{" "}
              para generar todas las etiquetas de una sola vez.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Formato del archivo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Las reglas básicas para que el archivo sea reconocido correctamente:
            </p>
            <div className="space-y-2 mb-4">
              {[
                "La primera fila debe ser el encabezado con los nombres de las columnas.",
                "Los nombres de columna deben coincidir exactamente con las variables de tu plantilla (respetando mayúsculas/minúsculas).",
                "Cada fila a partir de la segunda es una etiqueta distinta.",
                "No dejes filas en blanco entre datos.",
                "El archivo puede tener columnas extra que la plantilla no use — se ignoran.",
              ].map((regla, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{regla}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-2">Ejemplo de archivo Excel:</p>
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    {["producto", "peso", "lote", "cantidad"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Milanesas napolitanas", "500 g", "L240605", "20"],
                    ["Pollo al limón", "350 g", "L240605", "15"],
                    ["Tarta de verdura", "400 g", "L240605", "10"],
                    ["Ensalada César", "250 g", "L240605", "8"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-border even:bg-muted/20">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-muted-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Columna de cantidad</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Si tu Excel tiene una columna que indica cuántas etiquetas imprimir por producto
              (por ejemplo &quot;cantidad&quot;), podés seleccionarla al cargar el archivo. La app
              generará esa cantidad de copias idénticas por cada fila automáticamente.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Si no seleccionás ninguna columna de cantidad, se imprime <strong>1 etiqueta por fila</strong>.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">
              Descargar la plantilla de Excel de ejemplo
            </h3>
            <Steps>
              <Step number={1}>
                Andá a <strong>Cargar Excel</strong> en el sidebar.
              </Step>
              <Step number={2}>
                Seleccioná la plantilla de etiqueta que vas a usar en el selector superior.
              </Step>
              <Step number={3}>
                Hacé click en <strong>Descargar plantilla Excel</strong>. Se descarga un archivo
                <InlineCode>.xlsx</InlineCode> con los encabezados correctos y una fila de ejemplo.
              </Step>
              <Step number={4}>
                Abrí el archivo, completá tus datos y guardalo.
              </Step>
              <Step number={5}>
                Volvé a la página de carga y arrastrá o seleccioná el archivo.
              </Step>
            </Steps>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Flujo completo de impresión con Excel</h3>
            <Steps>
              <Step number={1}>
                Cargá el archivo Excel en la sección <strong>Cargar Excel</strong>.
              </Step>
              <Step number={2}>
                La app muestra una preview de los datos detectados. Verificá que las columnas
                coincidan con las variables de la plantilla.
              </Step>
              <Step number={3}>
                Seleccioná la <strong>columna de cantidad</strong> si la tenés.
              </Step>
              <Step number={4}>
                Elegí la <strong>plantilla</strong> que querés usar.
              </Step>
              <Step number={5}>
                Hacé click en <strong>Generar ZPL</strong>. La app crea el trabajo y lo guarda en el
                historial.
              </Step>
              <Step number={6}>
                Descargá el archivo ZPL y envialo a tu impresora.
              </Step>
            </Steps>

            <Tip>
              Si necesitás imprimir etiquetas para distintas fechas de vencimiento según el tipo de
              producto, podés agregar una columna &quot;dias_vencimiento&quot; al Excel y usar
              <InlineCode>{"{{hoy+{{dias_vencimiento}}d}}"}</InlineCode>... aunque lo más simple
              es definir la variable de vencimiento directamente en la plantilla y usar solo una
              plantilla por tipo de producto.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              8. NUMERACIÓN AUTOMÁTICA
          ══════════════════════════════════════ */}
          <section id="numeracion-automatica">
            <SectionHeading id="numeracion-automatica" icon={Hash}>
              Numeración automática
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              El elemento <strong className="text-foreground">Numeración</strong> (también llamado
              &quot;Serial&quot;) imprime un número diferente en cada etiqueta, incrementándose
              de forma automática. Es ideal para tickets numerados, lotes, órdenes de producción,
              pulseras de eventos, y cualquier caso donde cada etiqueta deba ser única.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Opciones de configuración</h3>

            <Table
              headers={["Parámetro", "Qué hace", "Ejemplo"]}
              rows={[
                ["Inicio", "Número desde el que arranca el contador", "1 o 1000"],
                ["Incremento", "Cuánto sube el número en cada etiqueta", "1 (correlativo) o 5 (de a 5)"],
                ["Dígitos", "Longitud mínima del número (se rellena con ceros)", "4 → 0001, 0002..."],
                ["Prefijo", "Texto que se agrega antes del número", "TICKET- o ORD-"],
                ["Sufijo", "Texto que se agrega después del número", "-A o /2026"],
              ]}
            />

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Ejemplo práctico</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Configuración para tickets de un evento:
            </p>
            <CodeBlock>
              {`Inicio:      1\nIncremento:  1\nDígitos:     4\nPrefijo:     "EVENTO-"\nSufijo:      ""\n\nResultado:\n  Etiqueta 1  →  EVENTO-0001\n  Etiqueta 2  →  EVENTO-0002\n  Etiqueta 3  →  EVENTO-0003\n  ...`}
            </CodeBlock>

            <p className="text-sm text-muted-foreground leading-relaxed mb-2 mt-4">
              Configuración para numeración de cajas de un lote:
            </p>
            <CodeBlock>
              {`Inicio:      1\nIncremento:  1\nDígitos:     3\nPrefijo:     "CAJA "\nSufijo:      " / LOTE-L240605"\n\nResultado:\n  Etiqueta 1  →  CAJA 001 / LOTE-L240605\n  Etiqueta 2  →  CAJA 002 / LOTE-L240605\n  ...`}
            </CodeBlock>

            <Tip>
              Si retomás la impresión desde el label #N (ver sección{" "}
              <a href="#retomar-impresion" className="text-primary hover:underline">Retomar impresión</a>),
              la numeración automática también arranca desde el número correcto, así que no hay
              riesgo de duplicados.
            </Tip>

            <Warning>
              La numeración automática es por <em>sesión de impresión</em>. Cada vez que generás un
              nuevo ZPL, el contador empieza desde el valor &quot;Inicio&quot; que configuraste. Si
              querés continuar la secuencia de un trabajo anterior, usá la función{" "}
              <strong>Retomar impresión</strong>.
            </Warning>
          </section>

          {/* ══════════════════════════════════════
              9. ZPL E IMPRESORA
          ══════════════════════════════════════ */}
          <section id="zpl-impresora">
            <SectionHeading id="zpl-impresora" icon={Printer}>
              Imprimir y enviar a la impresora
            </SectionHeading>

            <h3 className="text-base font-semibold text-foreground mt-0 mb-3">¿Qué es el ZPL?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">ZPL (Zebra Programming Language)</strong> es el lenguaje
              que entienden la mayoría de las impresoras térmicas industriales. Es un archivo de texto con
              comandos que le indican a la impresora exactamente qué imprimir, en qué posición, con qué
              fuente, y con qué tamaño.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Inteliar Labels genera este archivo automáticamente. Vos no necesitás saber ZPL — solo
              descargás el archivo y lo enviás a la impresora.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              ZPL es compatible con impresoras de las marcas:{" "}
              <strong className="text-foreground">Zebra, Honeywell, Sato, Citizen</strong>, y otras
              marcas que implementan el estándar ZPL II.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Cómo enviar el ZPL a la impresora</h3>

            <div className="space-y-3 my-4">
              <div className="rounded-lg border border-border bg-card px-4 py-4">
                <p className="text-sm font-semibold text-foreground mb-2">Opción 1 — Conexión USB</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Conectá la impresora por USB a tu computadora. Según el sistema operativo:
                </p>
                <ul className="space-y-1.5">
                  <li className="flex gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">Windows:</strong> Abrí un símbolo del sistema
                      y ejecutá{" "}
                      <InlineCode>{"copy /b etiquetas.zpl COM1"}</InlineCode> (reemplazá COM1
                      con el puerto de tu impresora).
                    </span>
                  </li>
                  <li className="flex gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">macOS / Linux:</strong>{" "}
                      <InlineCode>{"cat etiquetas.zpl > /dev/usb/lp0"}</InlineCode>
                    </span>
                  </li>
                  <li className="flex gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 mt_0.5" />
                    <span>
                      <strong className="text-foreground">Software del fabricante:</strong> Con
                      ZebraDesigner, BarTender o el administrador de impresión de Zebra podés abrir
                      el archivo ZPL directamente.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-card px-4 py-4">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Opción 2 — Red TCP/IP (puerto 9100)
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  La mayoría de las impresoras térmicas de red aceptan archivos ZPL enviados directamente
                  por TCP al puerto 9100. Desde una terminal:
                </p>
                <CodeBlock>{"# Linux / macOS\ncat etiquetas.zpl | nc 192.168.1.50 9100\n\n# Windows (PowerShell)\n$tcp = New-Object System.Net.Sockets.TcpClient('192.168.1.50', 9100)\n$stream = $tcp.GetStream()\n$bytes = [System.IO.File]::ReadAllBytes('etiquetas.zpl')\n$stream.Write($bytes, 0, $bytes.Length)\n$stream.Close(); $tcp.Close()"}</CodeBlock>
                <p className="text-xs text-muted-foreground">
                  Reemplazá <InlineCode>192.168.1.50</InlineCode> con la IP de tu impresora.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card px-4 py-4">
                <p className="text-sm font-semibold text-foreground mb-2">Opción 3 — Software de impresión</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Podés usar programas como <strong className="text-foreground">ZebraDesigner</strong>{" "}
                  (gratuito, de Zebra),{" "}
                  <strong className="text-foreground">BarTender</strong> o el administrador de impresión
                  de tu marca. Abrís el archivo <InlineCode>.zpl</InlineCode> desde el programa y
                  lo mandás a la impresora con un solo click.
                </p>
              </div>
            </div>

            <Tip>
              Si tu impresora está en red (conectada por Ethernet o WiFi), la opción más simple es el
              envío por TCP/IP al puerto 9100. Solo necesitás saber la IP de la impresora, que podés
              verla en el menú de configuración de la impresora o en el router.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              10. RETOMAR IMPRESIÓN
          ══════════════════════════════════════ */}
          <section id="retomar-impresion">
            <SectionHeading id="retomar-impresion" icon={RotateCcw}>
              Retomar impresión
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Si la impresora se cortó o quedó sin papel a mitad de un trabajo, no hace falta volver
              a imprimir todo desde el principio. Inteliar Labels te permite generar el ZPL{" "}
              <strong className="text-foreground">a partir de la etiqueta N</strong> del trabajo.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Cómo retomar un trabajo</h3>
            <Steps>
              <Step number={1}>
                Andá a <strong>Trabajos</strong> en el sidebar. Se muestra el historial de todos
                los trabajos de impresión.
              </Step>
              <Step number={2}>
                Hacé click en el trabajo que fue interrumpido para ver su detalle.
              </Step>
              <Step number={3}>
                En la sección de descarga, vas a ver un campo{" "}
                <strong>&quot;Desde etiqueta #&quot;</strong>. Ingresá el número de la primera
                etiqueta que no se imprimió.
              </Step>
              <Step number={4}>
                Hacé click en <strong>Generar ZPL desde esa etiqueta</strong>. La app genera un
                nuevo archivo ZPL que empieza exactamente desde ese punto.
              </Step>
              <Step number={5}>
                Descargá y envialo a la impresora. Solo se imprimen las etiquetas faltantes.
              </Step>
            </Steps>

            <Warning>
              Acordate de contar bien las etiquetas que ya salieron. Si imprimiste 47 de 100, el
              campo debe decir 48 (no 47), ya que 47 ya fue impresa.
            </Warning>

            <Tip>
              Si usás numeración automática, al retomar desde la etiqueta #N, el número de serie
              también arranca desde el valor correcto. Por ejemplo, si el serial llegó a TICKET-0047,
              al retomar desde la etiqueta 48 el próximo serial va a ser TICKET-0048.
            </Tip>
          </section>

          {/* ══════════════════════════════════════
              11. CORTE AUTOMÁTICO
          ══════════════════════════════════════ */}
          <section id="corte-automatico">
            <SectionHeading id="corte-automatico" icon={Scissors}>
              Corte automático
            </SectionHeading>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Algunas impresoras térmicas tienen un <strong className="text-foreground">cortador automático</strong>{" "}
              de papel incorporado. La opción &quot;Cortar cada N etiquetas&quot; le indica a la
              impresora cada cuántas etiquetas debe activar el cuchillo de corte.
            </p>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">Cómo configurarlo</h3>
            <Steps>
              <Step number={1}>
                En el editor de plantilla, hacé click en el botón <strong>Tamaño</strong> (arriba
                a la derecha del canvas).
              </Step>
              <Step number={2}>
                Buscá la opción <strong>&quot;Corte automático&quot;</strong> y habilitala.
              </Step>
              <Step number={3}>
                En el campo <strong>&quot;Cortar cada N etiquetas&quot;</strong>, ingresá la
                frecuencia de corte deseada.
              </Step>
              <Step number={4}>
                Guardá la plantilla. El comando de corte quedará incluido en todos los ZPL que
                generes con esta plantilla.
              </Step>
            </Steps>

            <h3 className="text-base font-semibold text-foreground mt-6 mb-3">¿Cuándo usar cada valor?</h3>

            <Table
              headers={["Valor", "Caso de uso"]}
              rows={[
                ["1", "Cortá después de cada etiqueta (ideal para etiquetas individuales o de diferentes productos)"],
                ["5", "Grupos de 5 etiquetas (ej: packs de 5 viandas del mismo menú)"],
                ["10", "Grupos de 10 (ej: cajas de 10 unidades)"],
                ["0 / desactivado", "Sin corte automático (papel continuo, vos cortás a mano)"],
              ]}
            />

            <Warning>
              Esta función solo tiene efecto si tu impresora tiene cortador físico. Si la impresora
              no lo tiene, el comando de corte en el ZPL se ignora sin causar errores. Revisá las
              especificaciones de tu modelo para saber si incluye cortador.
            </Warning>

            <Tip>
              En operaciones de catering donde cada pedido tiene varios ítems distintos, configurá
              el corte en 1 etiqueta. Así podés separar fácilmente las etiquetas de cada plato
              a medida que salen de la impresora.
            </Tip>
          </section>

          {/* ── Footer ── */}
          <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3 mt-10">
            <Mail className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">¿Tenés dudas?</p>
            <p className="text-sm text-muted-foreground">
              Escribinos a{" "}
              <a
                href="mailto:soporte@inteliar.com"
                className="text-primary font-medium hover:underline"
              >
                soporte@inteliar.com
              </a>{" "}
              y te respondemos a la brevedad.
            </p>
            <p className="text-xs text-muted-foreground">
              También podés consultar la{" "}
              <Link href="/ayuda" className="text-primary hover:underline">
                sección de Ayuda rápida
              </Link>{" "}
              con las preguntas más frecuentes.
            </p>
          </div>
        </article>
      </div>
    </DashboardLayout>
  )
}
