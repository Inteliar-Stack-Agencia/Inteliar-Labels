"use client"

import { useState } from "react"
import { Upload, Layout, Printer, FileSpreadsheet, Tag, CheckCircle2, Barcode, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Subí tus datos",
    description: "Arrastrá tu Excel o CSV. Detectamos las columnas automáticamente y las mapeamos a los campos de la etiqueta.",
  },
  {
    number: "02",
    icon: Layout,
    title: "Elegí tu template",
    description: "Usá templates listos o creá el tuyo con el diseñador visual. Las variables se conectan solas con tu planilla.",
  },
  {
    number: "03",
    icon: Printer,
    title: "Imprimí todo",
    description: "Un clic y salen todas las etiquetas en segundos. El agente local se encarga de hablar con tu impresora térmica.",
  },
]

const SAMPLE_ROWS = [
  { producto: "Empanadas de carne", precio: "$1.250", sku: "EMP-001", qty: 12 },
  { producto: "Milanesa napolitana", precio: "$2.800", sku: "MIL-002", qty: 6 },
  { producto: "Tarta de verduras",   precio: "$1.600", sku: "TAR-003", qty: 8 },
  { producto: "Medialunas x6",       precio: "$900",   sku: "MED-004", qty: 24 },
]

function StepUpload() {
  const [dropped, setDropped] = useState(false)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => setDropped(true)}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
          dropped
            ? "border-green-500/50 bg-green-500/5"
            : "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
        )}
      >
        {dropped ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="w-10 h-10 text-green-600" />
            <p className="font-semibold text-green-700 dark:text-green-400">productos_mayo.xlsx cargado</p>
            <p className="text-xs text-muted-foreground">4 filas · 4 columnas detectadas</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-primary/50" />
            <p className="font-medium text-foreground">Hacé click para simular la carga</p>
            <p className="text-xs text-muted-foreground">Excel · CSV · hasta 50.000 filas</p>
          </div>
        )}
      </div>

      {/* Column mapping */}
      {dropped && (
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in duration-300">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">Columnas detectadas automáticamente</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-xs text-muted-foreground">Columna Excel</th>
                <th className="px-4 py-2 text-left text-xs text-muted-foreground">Variable en template</th>
                <th className="px-4 py-2 text-left text-xs text-muted-foreground">Ejemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { col: "producto", var: "{{producto}}", ex: "Empanadas de carne" },
                { col: "precio",   var: "{{precio}}",   ex: "$1.250" },
                { col: "sku",      var: "{{sku}}",      ex: "EMP-001" },
                { col: "qty",      var: "{{qty}}",      ex: "12" },
              ].map((r) => (
                <tr key={r.col} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-mono text-xs text-foreground">{r.col}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{r.var}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 bg-muted/20 border-t border-border flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 dark:text-green-400 font-medium">50 filas listas para imprimir</span>
          </div>
        </div>
      )}

      {!dropped && (
        <p className="text-xs text-center text-muted-foreground">
          Hacé click en la zona de arriba para ver cómo funciona
        </p>
      )}
    </div>
  )
}

function StepTemplate() {
  const [selected, setSelected] = useState<string | null>(null)

  const templates = [
    { id: "precio", name: "Precio con código", size: "50×30mm", vars: ["producto", "precio", "sku"], icon: Tag },
    { id: "envio",  name: "Etiqueta de envío", size: "100×150mm", vars: ["nombre", "direccion", "ciudad"], icon: Barcode },
    { id: "stock",  name: "Control de stock",  size: "40×25mm", vars: ["producto", "qty", "fecha"], icon: Tag },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              selected === t.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
              selected === t.id ? "bg-primary/10" : "bg-muted"
            )}>
              <t.icon className={cn("w-4 h-4", selected === t.id ? "text-primary" : "text-muted-foreground")} />
            </div>
            <p className="text-xs font-semibold text-foreground leading-tight">{t.name}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{t.size}</p>
          </button>
        ))}
      </div>

      {selected && (() => {
        const tmpl = templates.find(t => t.id === selected)!
        return (
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-in fade-in duration-300">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">{tmpl.name} · {tmpl.size}</p>
              <span className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Variables mapeadas</span>
            </div>
            <div className="p-4 space-y-2">
              {tmpl.vars.map((v) => (
                <div key={v} className="flex items-center gap-3">
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-mono text-primary w-32 text-center">{`{{${v}}}`}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">columna <span className="font-medium text-foreground">{v}</span> del Excel</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {!selected && (
        <p className="text-xs text-center text-muted-foreground">
          Seleccioná un template para ver cómo se mapean las variables
        </p>
      )}
    </div>
  )
}

function StepPrint() {
  const [printing, setPrinting] = useState(false)
  const [printed, setPrinted] = useState(0)
  const [done, setDone] = useState(false)

  function handlePrint() {
    if (done) { setPrinted(0); setDone(false); return }
    setPrinting(true)
    let count = 0
    const total = SAMPLE_ROWS.reduce((s, r) => s + r.qty, 0)
    const interval = setInterval(() => {
      count += Math.ceil(total / 8)
      if (count >= total) { count = total; clearInterval(interval); setPrinting(false); setDone(true) }
      setPrinted(count)
    }, 350)
  }

  const total = SAMPLE_ROWS.reduce((s, r) => s + r.qty, 0)

  return (
    <div className="space-y-4">
      {/* Rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">4 productos · {total} etiquetas en total</p>
          {done && <span className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Completado</span>}
        </div>
        <div className="divide-y divide-border">
          {SAMPLE_ROWS.map((row, i) => {
            const rowDone = done || (printing && printed > SAMPLE_ROWS.slice(0, i).reduce((s, r) => s + r.qty, 0))
            return (
              <div key={i} className={cn("flex items-center gap-3 px-4 py-2.5 transition-colors", rowDone ? "bg-green-500/5" : "")}>
                <Barcode className={cn("w-4 h-4 flex-shrink-0", rowDone ? "text-green-600" : "text-muted-foreground")} />
                <span className="text-sm font-medium text-foreground flex-1 truncate">{row.producto}</span>
                <span className="text-xs text-muted-foreground font-mono">{row.precio}</span>
                <span className="text-xs text-muted-foreground w-12 text-right">{row.qty} uds.</span>
                {rowDone
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress bar when printing */}
      {printing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Imprimiendo…</span>
            <span>{printed}/{total}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(printed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handlePrint}
        disabled={printing}
        className={cn(
          "w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
          done
            ? "bg-green-600 hover:bg-green-700 text-white"
            : printing
              ? "bg-primary/60 text-primary-foreground cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
      >
        <Printer className="w-4 h-4" />
        {done ? `✓ ${total} etiquetas impresas — Repetir demo` : printing ? `Imprimiendo… ${printed}/${total}` : `Imprimir ${total} etiquetas`}
      </button>
    </div>
  )
}

const STEP_PANELS = [StepUpload, StepTemplate, StepPrint]

export function HowItWorksSection() {
  const [active, setActive] = useState(0)
  const Panel = STEP_PANELS[active]

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            De la planilla a las etiquetas impresas en 60 segundos
          </h2>
          <p className="text-lg text-muted-foreground">
            Probalo acá mismo — así se ve en la app real.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden mb-10 max-w-2xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard-demo.gif"
            alt="Flujo real de Inteliar Labels: cargar Excel, elegir plantilla y enviar a imprimir"
            className="w-full block"
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Step selector */}
          <div className="lg:col-span-2 space-y-3">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "w-full text-left rounded-2xl border p-5 transition-all",
                  active === i
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 transition-colors",
                    active === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold tracking-widest", active === i ? "text-primary" : "text-muted-foreground")}>
                        {step.number}
                      </span>
                    </div>
                    <p className={cn("font-semibold text-sm", active === i ? "text-foreground" : "text-muted-foreground")}>
                      {step.title}
                    </p>
                    {active === i && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed animate-in fade-in duration-200">
                        {step.description}
                      </p>
                    )}
                  </div>
                  {active === i && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
              </button>
            ))}
          </div>

          {/* Interactive panel */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground mx-auto">
                  Inteliar Labels — {STEPS[active].title}
                </span>
              </div>
              <div className="p-5">
                <Panel key={active} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
