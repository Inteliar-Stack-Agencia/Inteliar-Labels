import { ShieldAlert, Check } from "lucide-react"

export function ComplianceSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-amber-500/5 border-y border-amber-500/20">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400 mb-4">
            <ShieldAlert className="w-4 h-4" />
            Bromatología
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Una etiqueta a mano o sin vencimiento{" "}
            <span className="text-amber-600 dark:text-amber-400">puede costarte una multa</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bromatología exige fecha de elaboración, vencimiento y lote legibles en todo alimento
            fraccionado o elaborado. Con Inteliar Labels esos datos se calculan solos — cargás la
            fecha de hoy una vez y el sistema te arma el vencimiento a los días que definas, en
            cada etiqueta, sin que se te pase ninguna.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
          {[
            "Fecha de elaboración y vencimiento automáticos (hoy, hoy+3d, hoy+30d, lo que necesites)",
            "Número de lote por corrida de impresión, sin escribirlo a mano",
            "Letra impresa, legible — no la manuscrita que un inspector puede objetar",
            "Alérgenos y datos fijos configurados una sola vez en el template",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Ejemplo real de un template de comida: VTO calculado automático a partir de hoy
          </div>
        </div>
      </div>
    </section>
  )
}
