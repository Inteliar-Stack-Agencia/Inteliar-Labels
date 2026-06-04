"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Pencil, Eye, Check } from "lucide-react"

const demoSteps = [
  {
    id: "upload",
    icon: FileSpreadsheet,
    title: "Carga de Excel",
    description: "Soporta archivos .xlsx, .xls y .csv. Las columnas se detectan automáticamente.",
    content: (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/30">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Soltá tu archivo acá o hacé clic para buscar</p>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Vista previa: inventario_marzo.xlsx</span>
          </div>
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Producto</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">SKU</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-border/50"><td className="py-2">Leche Orgánica 1L</td><td className="py-2">MLK-001</td><td className="py-2">2026-04-15</td></tr>
                <tr className="border-b border-border/50"><td className="py-2">Pan Fresco</td><td className="py-2">BRD-042</td><td className="py-2">2026-03-25</td></tr>
                <tr><td className="py-2">Yogur Griego</td><td className="py-2">YGT-103</td><td className="py-2">2026-04-01</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "template",
    icon: Pencil,
    title: "Editor de templates",
    description: "Editor con arrastrar y soltar. Usá {{variables}} para contenido dinámico.",
    content: (
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Campos disponibles</p>
          <div className="flex flex-wrap gap-2">
            {["{{Producto}}", "{{SKU}}", "{{Vencimiento}}", "{{Código de barras}}"].map((field) => (
              <span key={field} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-mono">
                {field}
              </span>
            ))}
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Código del template</p>
            <pre className="text-xs font-mono text-foreground leading-relaxed">
{`^XA
^FO50,30^A0N,30,30
^FD{{Producto}}^FS
^FO50,70^BY2
^BCN,60,Y,N,N
^FD{{SKU}}^FS
^FO50,150^A0N,20,20
^FDVTO: {{Vencimiento}}^FS
^XZ`}
            </pre>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-48 h-32 bg-card border-2 border-foreground rounded-lg p-4 flex flex-col justify-between shadow-md">
            <div>
              <p className="font-semibold text-foreground text-sm">Leche Orgánica 1L</p>
            </div>
            <div className="flex gap-0.5 justify-center">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-0.5 bg-foreground rounded-full" style={{ height: `${Math.random() * 16 + 12}px` }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">VTO: 2026-04-15</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "preview",
    icon: Eye,
    title: "Vista previa de impresión",
    description: "Mirá exactamente qué se va a imprimir antes de mandarlo a la impresora.",
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">247 etiquetas listas para imprimir</p>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span>Zebra ZD420 conectada</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {["Leche Orgánica 1L", "Pan Fresco", "Yogur Griego", "Jugo de Naranja"].map((product, i) => (
            <div key={i} className="aspect-[3/4] bg-card border border-border rounded-lg p-2 flex flex-col justify-between text-center">
              <p className="text-[10px] font-medium text-foreground truncate">{product}</p>
              <div className="flex gap-px justify-center">
                {[...Array(12)].map((_, j) => (
                  <div key={j} className="w-px bg-foreground/60 rounded-full" style={{ height: `${Math.random() * 10 + 8}px` }} />
                ))}
              </div>
              <p className="text-[8px] text-muted-foreground">VTO: 04/26</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Tiempo estimado de impresión</p>
            <p className="text-2xl font-bold text-primary">~47 segundos</p>
          </div>
          <Button size="lg" className="px-8">
            Imprimir todas las etiquetas
          </Button>
        </div>
      </div>
    ),
  },
]

export function ProductDemoSection() {
  const [activeStep, setActiveStep] = useState("upload")

  const currentStep = demoSteps.find((s) => s.id === activeStep) || demoSteps[0]

  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Demo del producto</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Miralo en acción
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubrí lo simple que puede ser imprimir etiquetas en lote.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="flex border-b border-border">
            {demoSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeStep === step.id
                    ? "bg-muted/50 text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-1">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            </div>
            {currentStep.content}
          </div>
        </div>
      </div>
    </section>
  )
}
