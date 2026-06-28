import { UtensilsCrossed, Truck, Store, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const useCases = [
  {
    icon: UtensilsCrossed,
    industry: "Producción de alimentos",
    title: "Etiquetas de vencimiento e ingredientes desde tu planilla",
    description: "Cocinas industriales y fábricas de alimentos imprimen etiquetas de vencimiento por lote, ingredientes y alérgenos directamente desde su Excel. Diseñá el template una sola vez y reutilizalo siempre.",
    stats: "Un template, miles de lotes",
    labels: ["VTO: 15/04/26", "Lote #2847", "Sin TACC"],
  },
  {
    icon: Truck,
    industry: "Logística y envíos",
    title: "Del remito a las etiquetas de envío en segundos",
    description: "Depósitos y centros de distribución imprimen etiquetas de envío y códigos de seguimiento desde sus exportaciones de pedidos. Seleccioná solo las filas que querés imprimir en cada corrida.",
    stats: "Selección por fila incluida",
    labels: ["TRACK: 1Z999AA10", "ENVÍO: CABA", "2 de 3"],
  },
  {
    icon: Store,
    industry: "Retail e inventario",
    title: "Etiquetas de precios y SKU desde tu sistema de gestión",
    description: "Locales y comercios imprimen etiquetas de góndola, precios y SKU desde la exportación de su sistema. Guardá la lista y actualizá solo los precios que cambiaron, sin volver a cargar todo.",
    stats: "Listas reutilizables guardadas",
    labels: ["$24.990", "SKU: A-4521", "OFERTA 20%"],
  },
]

export function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Casos de uso</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Pensado para empresas que imprimen etiquetas todos los días
          </h2>
          <p className="text-lg text-muted-foreground">
            Productores de alimentos, depósitos y comercios que necesitan imprimir rápido, sin errores y sin depender de IT.
          </p>
        </div>

        <div className="space-y-8">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-2xl p-6 sm:p-8 transition-all hover:shadow-lg"
            >
              <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <useCase.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-primary">{useCase.industry}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-foreground">{useCase.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">{useCase.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-full">
                      {useCase.stats}
                    </span>
                    <Button variant="link" className="text-primary p-0 h-auto gap-1 group" asChild>
                      <a href="/auth/register">
                        Probarlo gratis
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap lg:flex-nowrap">
                  {useCase.labels.map((label, i) => (
                    <div
                      key={i}
                      className="bg-muted border border-border rounded-lg px-4 py-3 text-center min-w-[100px]"
                    >
                      <div className="flex gap-px justify-center mb-2">
                        {[...Array(8)].map((_, j) => (
                          <div
                            key={j}
                            className="w-0.5 bg-foreground/40 rounded-full"
                            style={{ height: `${(j % 3 === 0 ? 20 : j % 2 === 0 ? 12 : 16)}px` }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-mono text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
