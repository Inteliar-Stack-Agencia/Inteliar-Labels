"use client"

import { useState } from "react"
import { Sparkles, MessageCircle, Wand2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

interface MiniElement {
  id: string
  type: "text" | "barcode" | "qr"
  content: string
  x: number // tenths of mm
  y: number
  fontSize: number
  bold?: boolean
}

interface Example {
  level: string
  request: string
  reply: string
  widthMm: number
  heightMm: number
  elements: MiniElement[]
}

const EXAMPLES: Example[] = [
  {
    level: "Simple",
    request: "Etiquetas para tortas caseras: nombre, ingredientes, fecha de elaboración y vencimiento",
    reply: "Armé el diseño con esos 4 campos, con el nombre en grande arriba.",
    widthMm: 80,
    heightMm: 40,
    elements: [
      { id: "1", type: "text", content: "{{nombre_torta}}", x: 40, y: 30, fontSize: 16, bold: true },
      { id: "2", type: "text", content: "Ingredientes: {{ingredientes}}", x: 40, y: 130, fontSize: 9 },
      { id: "3", type: "text", content: "Elab: {{fecha_elaboracion}}", x: 40, y: 250, fontSize: 8 },
      { id: "4", type: "text", content: "Vto: {{fecha_vencimiento}}", x: 400, y: 250, fontSize: 8 },
    ],
  },
  {
    level: "Medio",
    request: "Carnicería: cortes envasados al vacío. Nombre del corte, peso neto, precio por kilo, precio total, fecha de envasado, vencimiento (7 días después), número de lote y código de barras del lote. 60×40mm.",
    reply: "Acomodé los 7 campos en 60×40mm, con el lote como texto arriba del código de barras para que no se pisen.",
    widthMm: 60,
    heightMm: 40,
    elements: [
      { id: "1", type: "text", content: "{{nombre_corte}}", x: 30, y: 25, fontSize: 12, bold: true },
      { id: "2", type: "text", content: "Peso neto: {{peso_neto}} kg", x: 30, y: 80, fontSize: 7 },
      { id: "3", type: "text", content: "Precio/kg: ${{precio_kilo}}", x: 30, y: 115, fontSize: 7 },
      { id: "4", type: "text", content: "Precio total: ${{precio_total}}", x: 30, y: 150, fontSize: 7, bold: true },
      { id: "5", type: "text", content: "Envasado: {{fecha_envasado}}", x: 30, y: 185, fontSize: 6 },
      { id: "6", type: "text", content: "Vence: {{fecha_vencimiento}}", x: 30, y: 215, fontSize: 6 },
      { id: "7", type: "text", content: "Lote: {{numero_lote}}", x: 30, y: 245, fontSize: 6 },
      { id: "8", type: "barcode", content: "{{numero_lote}}", x: 310, y: 220, fontSize: 6 },
    ],
  },
  {
    level: "Complejo",
    request: "Etiqueta de envío de 100×150mm para depósito: remitente, destinatario, número de pedido, zona de reparto en grande arriba a la derecha, QR con el tracking, código de barras del tracking abajo, peso del bulto y texto de FRÁGIL si aplica.",
    reply: "Armé la etiqueta tipo courier: destino y zona bien grandes arriba, remitente y destinatario en el medio, tracking y peso abajo con el código de barras.",
    widthMm: 100,
    heightMm: 150,
    elements: [
      { id: "1", type: "text", content: "{{empresa_remitente}}", x: 40, y: 40, fontSize: 9, bold: true },
      { id: "2", type: "text", content: "{{direccion_remitente}}", x: 40, y: 80, fontSize: 7 },
      { id: "3", type: "text", content: "ZONA", x: 620, y: 40, fontSize: 6 },
      { id: "4", type: "text", content: "{{zona_reparto}}", x: 600, y: 65, fontSize: 20, bold: true },
      { id: "5", type: "text", content: "Pedido: {{numero_pedido}}", x: 40, y: 160, fontSize: 7 },
      { id: "6", type: "text", content: "DESTINATARIO", x: 40, y: 220, fontSize: 6, bold: true },
      { id: "7", type: "text", content: "{{nombre_destinatario}}", x: 40, y: 260, fontSize: 14, bold: true },
      { id: "8", type: "text", content: "{{direccion_destinatario}}", x: 40, y: 320, fontSize: 9 },
      { id: "9", type: "text", content: "{{ciudad_destinatario}}", x: 40, y: 360, fontSize: 9 },
      { id: "10", type: "text", content: "Peso: {{peso_bulto}} kg", x: 40, y: 440, fontSize: 8 },
      { id: "11", type: "text", content: "{{texto_fragil}}", x: 40, y: 490, fontSize: 12, bold: true },
      { id: "12", type: "text", content: "Tracking: {{tracking_id}}", x: 40, y: 1330, fontSize: 8 },
      { id: "13", type: "barcode", content: "{{tracking_id}}", x: 40, y: 1370, fontSize: 8 },
    ],
  },
]

const PREVIEW_MAX_WIDTH = 380
const PREVIEW_MAX_HEIGHT = 280

function MiniPreview({ example }: { example: Example }) {
  // Scale down (never up) so tall labels like a 100x150mm shipping label
  // don't blow past the card — same clamp used in the in-app AI chat preview.
  const scale = Math.min(4, PREVIEW_MAX_WIDTH / example.widthMm, PREVIEW_MAX_HEIGHT / example.heightMm)
  const width = example.widthMm * scale
  const height = example.heightMm * scale
  return (
    <div className="flex justify-center py-4">
      <div className="relative overflow-hidden border-2 border-dashed border-border bg-white shadow-sm" style={{ width, height }}>
        {example.elements.map((el) => {
          const left = (el.x / 10) * scale
          const top = (el.y / 10) * scale
          if (el.type === "barcode") {
            return (
              <div key={el.id} className="absolute" style={{ left, top }}>
                <div className="flex gap-[1px]">
                  {[...Array(14)].map((_, j) => (
                    <div key={j} className={j % 3 === 0 ? "w-[2px] bg-neutral-500" : "w-[2px] bg-neutral-900"} style={{ height: 16 }} />
                  ))}
                </div>
              </div>
            )
          }
          return (
            <span
              key={el.id}
              className="absolute whitespace-nowrap text-neutral-800"
              style={{
                left, top,
                maxWidth: Math.max(10, width - left),
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: Math.max(7, el.fontSize * scale / 3),
                fontWeight: el.bold ? "bold" : "normal",
              }}
            >
              {el.content}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function AiTemplateSection() {
  const [active, setActive] = useState(0)
  const example = EXAMPLES[active]

  return (
    <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-violet-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-sm text-violet-400 mb-4">
            <Sparkles className="w-4 h-4" />
            Único en el mercado
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Diseñá tu etiqueta charlando con la IA
          </h2>
          <p className="text-lg text-muted-foreground">
            Nada de arrastrar cajitas a ciegas. Contale a la IA qué querés etiquetar y te arma el diseño completo,
            con las variables ya detectadas. Le podés pedir cambios hasta que quede exactamente como lo necesitás.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-foreground/90">Se lo describís en lenguaje natural, sin saber nada de diseño</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-foreground/90">Detecta sola qué campos deberían salir de tu Excel</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-foreground/90">Le pedís ajustes hasta que el diseño te cierre, y lo abrís editable en el dashboard</span>
              </li>
            </ul>

            <p className="text-sm font-medium text-muted-foreground mb-3">Mirá 3 ejemplos reales, de simple a complejo:</p>
            <div className="flex gap-2 mb-6">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.level}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                    active === i
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-border text-muted-foreground hover:border-violet-500/50"
                  }`}
                >
                  {ex.level}
                </button>
              ))}
            </div>

            <Button size="lg" className="gap-2 group" asChild>
              <a href="/auth/register" onClick={() => analytics.ctaClick("ai_template")}>
                Probar gratis 15 días
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-foreground">Armar plantilla charlando con la IA</span>
              <span className="ml-auto text-xs font-semibold text-violet-400">{example.level}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {example.request}
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground">
                  {example.reply}
                </div>
              </div>
              <MiniPreview example={example} />
              <div className="flex justify-start">
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-3.5 py-2.5 text-xs text-violet-400 font-medium">
                  ✓ Plantilla lista — abrir en el editor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
