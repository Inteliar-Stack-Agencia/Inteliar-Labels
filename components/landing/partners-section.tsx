import { Store, ArrowRight, Handshake } from "lucide-react"

// Real reseller partners go here once a deal actually closes — each entry
// gets a logo/name, a short pitch, and a link to their store. Empty for now
// on purpose: listing a "partner" before anything is signed would be
// misleading. The CTA below is what's live until then.
interface Partner {
  name: string
  description: string
  url: string
  logoEmoji: string
}

const PARTNERS: Partner[] = []

export function PartnersSection() {
  return (
    <section className="py-16 px-4 sm:px-6 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Dónde comprar tu impresora
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10 text-balance">
          Trabajamos con vendedores de impresoras térmicas
        </h2>

        {PARTNERS.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl flex-shrink-0">
                  {p.logoEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center mb-10">
            <Store className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <span className="inline-block text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full mb-3">
              Próximamente
            </span>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Estamos cerrando las primeras alianzas con vendedores de impresoras — mientras tanto,
              cualquier impresora que hable ZPL o TSPL funciona igual con etiquetar.app.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">¿Vendés impresoras térmicas?</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Sumate como partner: le ofrecés a tus clientes el software listo para imprimir el
                mismo día que reciben la impresora, sin que tengan que buscar por su cuenta.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/5491165689145?text=Hola%2C%20vendemos%20impresoras%20t%C3%A9rmicas%20y%20queremos%20evaluar%20una%20alianza%20con%20etiquetar.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 whitespace-nowrap flex-shrink-0"
          >
            Hablemos <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
