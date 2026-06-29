"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, FileSpreadsheet, Tag, Printer, Barcode } from "lucide-react"
import { useEffect, useState } from "react"
import { analytics } from "@/lib/analytics"

const DEMO_ROWS = [
  { producto: "Empanadas de carne", precio: "$1.250", sku: "EMP-CARNE-12" },
  { producto: "Milanesa napolitana", precio: "$2.800", sku: "MIL-NAPO-01" },
  { producto: "Tarta de verduras", precio: "$1.600", sku: "TAR-VERD-06" },
  { producto: "Medialunas x6", precio: "$900", sku: "MED-x6-003" },
]

function AnimatedDemo() {
  const [step, setStep] = useState(0)
  const [printedCount, setPrintedCount] = useState(0)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const cycle = () => {
      setStep(0); setPrintedCount(0); setPrinting(false)
      timers.push(setTimeout(() => setStep(1), 1200))
      timers.push(setTimeout(() => setStep(2), 2600))
      timers.push(setTimeout(() => { setStep(3); setPrinting(true) }, 4200))
      let count = 0
      for (let i = 0; i < 4; i++) {
        timers.push(setTimeout(() => { count++; setPrintedCount(count) }, 5000 + i * 500))
      }
      timers.push(setTimeout(() => { setStep(4); setPrinting(false) }, 7200))
      timers.push(setTimeout(cycle, 10000))
    }
    const init = setTimeout(cycle, 500)
    return () => { clearTimeout(init); timers.forEach(clearTimeout) }
  }, [])

  return (
    <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-muted-foreground mx-auto">Inteliar Labels</span>
      </div>

      <div className="p-5 space-y-3 min-h-[320px]">
        {/* Step 1: file loaded */}
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-500 ${step >= 1 ? "bg-green-500/5 border-green-500/30 opacity-100" : "bg-muted/30 border-border opacity-40"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">productos_mayo.xlsx</p>
              <p className="text-xs text-muted-foreground">4 filas · columnas: producto, precio, sku</p>
            </div>
          </div>
          {step >= 1 && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">✓ Cargado</span>}
        </div>

        {/* Step 2: template selected */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${step >= 2 ? "bg-primary/5 border-primary/30 opacity-100" : "bg-muted/30 border-border opacity-40"}`}>
          <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Template: Producto con SKU · 50×30mm</p>
            <p className="text-xs text-muted-foreground">Variables: {"{{"}<span className="text-primary">producto</span>{"}}"} {"{{"}<span className="text-primary">precio</span>{"}}"} {"{{"}<span className="text-primary">sku</span>{"}}"}</p>
          </div>
          {step >= 2 && <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">✓ Ok</span>}
        </div>

        {/* Step 3: printing rows */}
        <div className={`space-y-1.5 transition-all duration-500 ${step >= 3 ? "opacity-100" : "opacity-40"}`}>
          {DEMO_ROWS.map((row, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-300 ${printedCount > i ? "bg-green-500/5 border-green-500/20 text-foreground" : "bg-muted/20 border-border text-muted-foreground"}`}>
              <Barcode className={`w-3.5 h-3.5 flex-shrink-0 ${printedCount > i ? "text-green-600" : "text-muted-foreground"}`} />
              <span className="font-medium truncate">{row.producto}</span>
              <span className="ml-auto font-mono flex-shrink-0">{row.precio}</span>
              {printedCount > i && <span className="text-green-600 flex-shrink-0">✓</span>}
              {printing && printedCount === i && <span className="text-primary flex-shrink-0 animate-pulse">···</span>}
            </div>
          ))}
        </div>

        {/* Step 4: done */}
        {step >= 4 ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <Printer className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">4 etiquetas impresas</p>
              <p className="text-xs text-muted-foreground">Trabajo guardado en historial</p>
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-between p-3 rounded-lg bg-primary border border-primary/50 transition-all duration-500 ${step >= 3 ? "opacity-100" : "opacity-30"}`}>
            <span className="text-sm font-semibold text-primary-foreground">
              {printing ? `Imprimiendo... (${printedCount}/4)` : "Imprimir las 4 etiquetas"}
            </span>
            <Printer className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Diseñado para impresoras térmicas ZPL y TSPL</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] text-balance">
              Dejá de perder horas.{" "}
              <span className="text-primary">Imprimí 100+ etiquetas</span> en segundos.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Subí tu Excel, elegí un template e imprimí al instante en tu impresora térmica.
              Diseñador visual con IA y soporte para códigos de barras. Sin capacitación.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base h-12 px-8 gap-2 group" asChild>
                <a href="/auth/register" onClick={() => analytics.ctaClick("hero")}>
                  Empezá tu trial gratis
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8 gap-2" asChild>
                <a href="#how-it-works">Ver cómo funciona</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>15 días de prueba gratuita · Sin tarjeta</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Compatible con Zebra, Honeywell, TSC y más</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Listo en 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Primera etiqueta en menos de 3 minutos</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
            <div className="relative">
              <AnimatedDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
