import { Check, X, Minus } from "lucide-react"

const comparisonData = [
  {
    feature: "Tiempo hasta la primera etiqueta",
    inteliar: "5 minutos",
    bartender: "Horas o días",
    inteliarBetter: true,
  },
  {
    feature: "Curva de aprendizaje",
    inteliar: "Ninguna",
    bartender: "Empinada",
    inteliarBetter: true,
  },
  {
    feature: "Requiere instalación",
    inteliar: "Solo el agente de impresión",
    bartender: "Sí (completo)",
    inteliarBetter: true,
  },
  {
    feature: "Costo",
    inteliar: "Desde US$10/mes",
    bartender: "US$500+/usuario",
    inteliarBetter: true,
  },
  {
    feature: "Soporte nativo de Excel/CSV",
    inteliar: "Sí",
    bartender: "Limitado",
    inteliarBetter: true,
  },
  {
    feature: "Generación de templates con IA",
    inteliar: "Sí",
    bartender: "No",
    inteliarBetter: true,
  },
  {
    feature: "Actualizaciones",
    inteliar: "Automáticas",
    bartender: "Manual / pago",
    inteliarBetter: true,
  },
  {
    feature: "Selección por fila del Excel",
    inteliar: "Sí",
    bartender: "No",
    inteliarBetter: true,
  },
]

export function ComparisonSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
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
          <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
            <div className="p-4 sm:p-6">
              <span className="text-sm font-medium text-muted-foreground">Característica</span>
            </div>
            <div className="p-4 sm:p-6 text-center border-x border-border bg-primary/5">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">I</span>
                </div>
                <span className="font-semibold text-foreground">Inteliar</span>
              </div>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <span className="font-semibold text-muted-foreground">BarTender</span>
            </div>
          </div>

          {comparisonData.map((row, index) => (
            <div
              key={index}
              className={`grid grid-cols-3 ${
                index < comparisonData.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="p-4 sm:p-6 flex items-center">
                <span className="text-sm text-foreground">{row.feature}</span>
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-center border-x border-border bg-primary/5">
                {row.inteliar === "Sí" ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : row.inteliar === "No" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-foreground text-center">{row.inteliar}</span>
                )}
              </div>
              <div className="p-4 sm:p-6 flex items-center justify-center">
                {row.bartender === "Sí" ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : row.bartender === "No" ? (
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                ) : row.bartender === "Limitado" ? (
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{row.bartender}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground text-center">{row.bartender}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
