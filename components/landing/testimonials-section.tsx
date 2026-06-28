const TESTIMONIALS = [
  {
    quote: "Antes tardábamos 2 horas en imprimir las etiquetas de cada lote. Ahora lo hacemos en 5 minutos. Simplemente cargamos el Excel y listo.",
    name: "Martín R.",
    role: "Encargado de producción",
    company: "Fábrica de alimentos, Córdoba",
    initials: "MR",
  },
  {
    quote: "Lo que más me gustó es que no tuve que aprender nada nuevo. Subí mi planilla de siempre y funcionó. Las etiquetas de precio del local salen en segundos.",
    name: "Laura V.",
    role: "Dueña",
    company: "Comercio de ropa, Buenos Aires",
    initials: "LV",
  },
  {
    quote: "Manejamos 300+ envíos por día. Con Inteliar Labels el etiquetado dejó de ser un cuello de botella. El historial con reimpresión nos salvó más de una vez.",
    name: "Diego F.",
    role: "Jefe de logística",
    company: "Depósito de distribución, Rosario",
    initials: "DF",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Testimonios</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Lo que dicen quienes lo usan
          </h2>
          <p className="text-lg text-muted-foreground">
            Empresas reales que reemplazaron procesos manuales con Inteliar Labels.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/20 transition-all"
            >
              {/* Quote marks */}
              <div className="text-4xl text-primary/20 font-serif leading-none select-none">"</div>

              <p className="text-foreground/80 text-sm leading-relaxed flex-1">
                {t.quote}
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
