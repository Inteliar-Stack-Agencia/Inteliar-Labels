import { Check, X, Minus } from "lucide-react"

type CellValue = "Sí" | "No" | "Limitado" | string

const comparisonData: {
  feature: string
  inteliar: CellValue
  bartender: CellValue
  nicelabel: CellValue
  zebradesigner: CellValue
}[] = [
  {
    feature: "Tiempo hasta primera etiqueta",
    inteliar: "5 minutos",
    bartender: "Horas/días",
    nicelabel: "1-2 horas",
    zebradesigner: "30 min",
  },
  {
    feature: "Curva de aprendizaje",
    inteliar: "Ninguna",
    bartender: "Muy alta",
    nicelabel: "Alta",
    zebradesigner: "Media",
  },
  {
    feature: "Requiere instalación",
    inteliar: "Solo agente",
    bartender: "Sí completo",
    nicelabel: "Sí completo",
    zebradesigner: "Sí completo",
  },
  {
    feature: "Costo",
    inteliar: "Desde US$10/mes",
    bartender: "US$500+/usuario",
    nicelabel: "US$200+/usuario",
    zebradesigner: "Gratuito limitado",
  },
  {
    feature: "Soporte nativo Excel/CSV",
    inteliar: "Sí",
    bartender: "Limitado",
    nicelabel: "Sí",
    zebradesigner: "No",
  },
  {
    feature: "Generación con IA",
    inteliar: "Sí",
    bartender: "No",
    nicelabel: "No",
    zebradesigner: "No",
  },
  {
    feature: "Actualizaciones",
    inteliar: "Automáticas",
    bartender: "Manual/pago",
    nicelabel: "Manual/pago",
    zebradesigner: "Manual",
  },
  {
    feature: "Impresoras compatibles",
    inteliar: "ZPL + TSPL",
    bartender: "ZPL",
    nicelabel: "ZPL + ZBI",
    zebradesigner: "Solo Zebra",
  },
]

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  const base = highlight ? "text-foreground" : "text-muted-foreground"
  if (value === "Sí") {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-4 h-4 text-green-600" />
      </div>
    )
  }
  if (value === "No") {
    return (
      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
        <X className="w-4 h-4 text-red-600" />
      </div>
    )
  }
  if (value === "Limitado") {
    return (
      <div className="flex items-center gap-1.5">
        <Minus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className={`text-sm text-center ${base}`}>{value}</span>
      </div>
    )
  }
  return <span className={`text-sm text-center ${base}`}>{value}</span>
}

export function ComparisonSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Comparativa</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Por qué las empresas están dejando BarTender
          </h2>
          <p className="text-lg text-muted-foreground">
            El software de etiquetado no debería pedirte presupuesto enterprise ni un equipo de IT.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="grid grid-cols-5 bg-muted/50 border-b border-border">
            <div className="p-4 sm:p-5 col-span-1">
              <span className="text-sm font-medium text-muted-foreground">Característica</span>
            </div>
            <div className="p-4 sm:p-5 text-center border-l border-border bg-primary/5">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">I</span>
                </div>
                <span className="font-semibold text-foreground">Inteliar</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 text-center border-l border-border">
              <span className="font-semibold text-muted-foreground">BarTender</span>
            </div>
            <div className="p-4 sm:p-5 text-center border-l border-border">
              <span className="font-semibold text-muted-foreground">NiceLabel</span>
            </div>
            <div className="p-4 sm:p-5 text-center border-l border-border">
              <span className="font-semibold text-muted-foreground">ZebraDesigner</span>
            </div>
          </div>

          {/* Rows */}
          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-5 ${
                index < comparisonData.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="p-4 sm:p-5 flex items-center">
                <span className="text-sm text-foreground">{row.feature}</span>
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center border-l border-border bg-primary/5">
                <Cell value={row.inteliar} highlight />
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center border-l border-border">
                <Cell value={row.bartender} />
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center border-l border-border">
                <Cell value={row.nicelabel} />
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center border-l border-border">
                <Cell value={row.zebradesigner} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
