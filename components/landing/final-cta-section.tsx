import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function FinalCtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-background mb-6 text-balance">
          Dejá de imprimir etiquetas a lo bestia
        </h2>
        <p className="text-lg sm:text-xl text-background/70 max-w-2xl mx-auto mb-8">
          Sumate a más de 500 empresas que ya automatizaron su impresión de etiquetas.
          Empezá tu prueba gratis hoy: sin tarjeta, sin compromiso.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" variant="secondary" className="h-14 px-10 text-base gap-2 group bg-background text-foreground hover:bg-background/90">
            Empezá tu prueba gratis
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 text-base border-background/30 text-background hover:bg-background/10 hover:text-background">
            Agendá una demo
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-background/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>14 días de prueba gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cancelá cuando quieras</span>
          </div>
        </div>
      </div>
    </section>
  )
}
