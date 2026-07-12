import { CheckCircle2, ExternalLink } from "lucide-react"

interface RecommendedPrinter {
  tier: string
  name: string
  protocol: string
  priceRange: string
  bestFor: string
  highlights: string[]
  searchQuery: string
}

const RECOMMENDATIONS: RecommendedPrinter[] = [
  {
    tier: "Para arrancar",
    name: "Godex EZ-2350i / Zebra GK420d",
    protocol: "TSPL / ZPL",
    priceRange: "USD 150–250",
    bestFor: "Bajo volumen — hasta ~200 etiquetas/día, emprendimientos y kioscos",
    highlights: ["USB directo a la PC", "Bajo costo de mantenimiento", "Fácil de conseguir repuestos"],
    searchQuery: "impresora termica etiquetas godex ez2350",
  },
  {
    tier: "Uso diario",
    name: "Zebra ZD420 / Honeywell PC42t",
    protocol: "ZPL",
    priceRange: "USD 300–450",
    bestFor: "Volumen medio — locales, depósitos chicos, varias horas por día",
    highlights: ["Conexión USB y red (Wi-Fi/Ethernet)", "Mejor durabilidad para uso continuo", "Compatible con la mayoría de los rollos"],
    searchQuery: "impresora termica etiquetas zebra zd420",
  },
  {
    tier: "Alto volumen",
    name: "Zebra ZT410",
    protocol: "ZPL",
    priceRange: "USD 700+",
    bestFor: "Depósitos y logística — miles de etiquetas por día, uso industrial",
    highlights: ["Diseñada para operación 24/7", "Cabezal reemplazable", "Red Ethernet nativa"],
    searchQuery: "impresora termica industrial zebra zt410",
  },
]

function mlSearchUrl(query: string) {
  return `https://listado.mercadolibre.com.ar/${encodeURIComponent(query).replace(/%20/g, "-")}`
}

export function RecommendedPrintersSection() {
  return (
    <section className="py-20 px-4 sm:px-6 border-y border-border bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">¿No tenés impresora todavía?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Impresoras recomendadas según tu volumen
          </h2>
          <p className="text-lg text-muted-foreground">
            Estos son modelos con los que sabemos que etiquetar.app funciona bien. Los precios son de referencia
            —varían por país y proveedor— así que compará antes de comprar.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {RECOMMENDATIONS.map((r) => (
            <div key={r.name} className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-6">
              <div>
                <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                  {r.tier}
                </span>
                <h3 className="text-base font-semibold text-foreground leading-snug">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.protocol} · {r.priceRange} aprox.</p>
              </div>

              <p className="text-sm text-muted-foreground">{r.bestFor}</p>

              <ul className="space-y-1.5 flex-1">
                {r.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs text-foreground/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>

              <a
                href={mlSearchUrl(r.searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary border border-primary/30 rounded-lg px-4 py-2.5 hover:bg-primary/5 transition-colors"
              >
                Buscar en Mercado Libre
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          No vendemos impresoras directamente ni cobramos comisión por estos links — son solo una referencia
          para arrancar. ¿Sos vendedor de impresoras o insumos?{" "}
          <a
            href="https://wa.me/5491165689145?text=Hola%2C%20vendemos%20impresoras%20t%C3%A9rmicas%20o%20insumos%20y%20queremos%20evaluar%20una%20alianza%20con%20etiquetar.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Sumate como partner
          </a>.
        </p>
      </div>
    </section>
  )
}
