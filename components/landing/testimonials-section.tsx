const TESTIMONIALS = [
  {
    quote: "Armamos las viandas semanales para 80 clientes y cada bandeja tiene que ir con su etiqueta de nombre, menú y fecha. Antes lo hacíamos a mano con un marcador. Ahora salimos en 3 minutos desde el Excel del pedido semanal.",
    name: "Caro M.",
    role: "Dueña",
    company: "Morfi Viandas, CABA",
    initials: "CM",
    stars: 5,
  },
  {
    quote: "Vendo en Mercado Libre y en mi tienda online. Imprimía las etiquetas de bulto una por una desde Word, era un caos. Ahora exporto los pedidos del día, los cargo y en 2 minutos tengo todo etiquetado.",
    name: "Nico B.",
    role: "Vendedor online",
    company: "Ecommerce de indumentaria, Mendoza",
    initials: "NB",
    stars: 5,
  },
  {
    quote: "Tenemos 400 productos en góndola. Cada vez que hay remarcación era un dolor de cabeza. Con Inteliar Labels actualizamos solo los precios que cambiaron y los imprimimos en el momento. Lo amortizamos el primer día.",
    name: "Sergio P.",
    role: "Gerente de local",
    company: "Dietética mayorista, Córdoba",
    initials: "SP",
    stars: 5,
  },
  {
    quote: "Lo instalé yo solo siguiendo el manual, sin saber nada de impresoras ZPL. En 20 minutos estaba imprimiendo etiquetas de vencimiento para los lotes de queso. No lo puedo creer.",
    name: "Hernán L.",
    role: "Encargado de producción",
    company: "Quesería artesanal, Santa Fe",
    initials: "HL",
    stars: 5,
  },
  {
    quote: "Manejamos 300+ envíos por día. El etiquetado era el cuello de botella antes del despacho. Ahora es lo más rápido de toda la operación. El historial con reimpresión nos salvó más de una vez.",
    name: "Diego F.",
    role: "Jefe de logística",
    company: "Depósito de distribución, Rosario",
    initials: "DF",
    stars: 5,
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-primary/20 transition-all"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <svg key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>

              <p className="text-foreground/80 text-sm leading-relaxed flex-1">
                "{t.quote}"
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
