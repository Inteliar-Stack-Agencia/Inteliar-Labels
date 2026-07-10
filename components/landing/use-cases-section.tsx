import { UtensilsCrossed, Truck, Store, ShoppingBag, Pill, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MockLabel {
  category: string
  title: string
  lines: string[]
  badge?: { text: string; color: "red" | "green" | "amber" }
  code: "barcode" | "qr"
}

const useCases: {
  icon: typeof UtensilsCrossed
  industry: string
  title: string
  description: string
  stats: string
  label: MockLabel
}[] = [
  {
    icon: UtensilsCrossed,
    industry: "Producción de alimentos",
    title: "Etiquetas de vencimiento e ingredientes desde tu planilla",
    description: "Cocinas industriales y fábricas de alimentos imprimen etiquetas de vencimiento por lote, ingredientes y alérgenos directamente desde su Excel. Diseñá el template una sola vez y reutilizalo siempre.",
    stats: "Un template, miles de lotes",
    label: {
      category: "Alimentos",
      title: "MILANESA DE NALGA",
      lines: ["VTO: 15/04/2026", "LOTE #2847"],
      badge: { text: "Sin TACC", color: "green" },
      code: "barcode",
    },
  },
  {
    icon: Truck,
    industry: "Logística y envíos",
    title: "Del remito a las etiquetas de envío en segundos",
    description: "Depósitos y centros de distribución imprimen etiquetas de envío y códigos de seguimiento desde sus exportaciones de pedidos. Seleccioná solo las filas que querés imprimir en cada corrida.",
    stats: "Selección por fila incluida",
    label: {
      category: "Envíos",
      title: "ENVÍO A CABA",
      lines: ["Tracking: 1Z999AA10", "Bulto 2 de 3"],
      code: "qr",
    },
  },
  {
    icon: Store,
    industry: "Retail e inventario",
    title: "Etiquetas de precios y SKU desde tu sistema de gestión",
    description: "Locales y comercios imprimen etiquetas de góndola, precios y SKU desde la exportación de su sistema. Guardá la lista y actualizá solo los precios que cambiaron, sin volver a cargar todo.",
    stats: "Listas reutilizables guardadas",
    label: {
      category: "Retail",
      title: "Zapatilla Running",
      lines: ["$ 24.990", "SKU: A-4521"],
      badge: { text: "OFERTA 20%", color: "red" },
      code: "barcode",
    },
  },
  {
    icon: ShoppingBag,
    industry: "Vendedores online y Mercado Libre",
    title: "Etiquetá tus bultos antes de despachar sin errores",
    description: "Vendedores con alto volumen de pedidos imprimen etiquetas de identificación de bulto, dirección y número de orden desde su planilla de despacho diaria. Un clic y salen todas las etiquetas del día.",
    stats: "Etiqueta todos tus pedidos del día",
    label: {
      category: "E-commerce",
      title: "Pedido #8821",
      lines: ["Rosario, Santa Fe", "FRÁGIL"],
      badge: { text: "FRÁGIL", color: "amber" },
      code: "qr",
    },
  },
  {
    icon: Pill,
    industry: "Farmacias, dietéticas y mayoristas",
    title: "Actualizá 500 precios de góndola en minutos",
    description: "Cuando cambian los precios, reimprimís solo las etiquetas afectadas desde tu lista de precios en Excel. Sin tipear uno por uno, sin errores de precio en góndola, sin perder tiempo.",
    stats: "Solo reimprimir lo que cambió",
    label: {
      category: "Dietética / Farmacia",
      title: "Vitamina C 1g",
      lines: ["$ 8.750", "COD: 7798"],
      badge: { text: "IVA inc.", color: "green" },
      code: "barcode",
    },
  },
]

const badgeClasses: Record<string, string> = {
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
}

function LabelMock({ label }: { label: MockLabel }) {
  return (
    <div className="w-[240px] shrink-0 rounded-xl border border-border bg-white shadow-sm p-4 flex flex-col gap-1.5">
      <p className="text-[10px] font-bold text-primary uppercase tracking-wide">{label.category}</p>
      <p className="text-base font-extrabold text-neutral-900 leading-tight">{label.title}</p>
      {label.lines.map((l, i) => (
        <p key={i} className={i === 0 ? "text-sm font-semibold text-neutral-700" : "text-xs text-neutral-500"}>
          {l}
        </p>
      ))}
      {label.badge && (
        <span className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${badgeClasses[label.badge.color]}`}>
          {label.badge.text}
        </span>
      )}
      <div className="mt-2">
        {label.code === "barcode" ? (
          <div className="flex gap-[2px]">
            {[...Array(24)].map((_, j) => (
              <div
                key={j}
                className={j % 4 === 0 ? "w-[3px] bg-neutral-500" : "w-[3px] bg-neutral-900"}
                style={{ height: 28 }}
              />
            ))}
          </div>
        ) : (
          <div
            className="h-12 w-12"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #171717 0 5px, transparent 5px 10px), repeating-linear-gradient(90deg, #171717 0 5px, transparent 5px 10px)",
              backgroundBlendMode: "multiply",
              outline: "2px solid #171717",
            }}
          />
        )}
      </div>
    </div>
  )
}

export function UseCasesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Para quién es</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            La alternativa simple para comercios y pymes
          </h2>
          <p className="text-lg text-muted-foreground">
            BarTender y NiceLabel cuestan cientos de dólares y requieren capacitación. Inteliar Labels lo instalás vos mismo en 5 minutos y empezás a imprimir desde tu Excel de siempre — sin IT, sin licencias complejas, sin vueltas.
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
                <LabelMock label={useCase.label} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
