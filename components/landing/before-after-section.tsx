import { X, Check } from "lucide-react"

export function BeforeAfterSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            La diferencia se nota en el mostrador
          </h2>
          <p className="text-lg text-muted-foreground">
            La misma etiqueta, dos formas de hacerla.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Antes */}
          <div className="rounded-2xl border-2 border-red-500/30 bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15">
                <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Antes — a mano</span>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="font-serif text-lg text-neutral-800" style={{ fontFamily: "cursive" }}>
                Milanesa x kg
              </p>
              <p className="font-serif text-neutral-600 mt-1" style={{ fontFamily: "cursive" }}>
                $ 8500 aprox
              </p>
              <p className="font-serif text-xs text-neutral-500 mt-2" style={{ fontFamily: "cursive" }}>
                vto 15/4? o 16
              </p>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>· Letra que a veces ni el empleado entiende</li>
              <li>· Cada una distinta, se nota apurado</li>
              <li>· Fecha "a ojo", sin cálculo real</li>
            </ul>
          </div>

          {/* Después */}
          <div className="rounded-2xl border-2 border-green-500/30 bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15">
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Después — Inteliar Labels</span>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm font-mono">
              <p className="text-lg font-bold text-neutral-900">MILANESA DE NALGA</p>
              <p className="text-neutral-700 mt-1">$ 8.500 /kg</p>
              <p className="text-xs text-neutral-500 mt-2">VTO: 15/04/2026 · LOTE #2847</p>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`h-6 w-[3px] ${i % 3 === 0 ? "bg-neutral-900" : "bg-neutral-700"}`} />
                ))}
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>· Siempre igual, prolija, profesional</li>
              <li>· Fecha calculada automática, sin errores</li>
              <li>· Con código de barras si lo necesitás</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
