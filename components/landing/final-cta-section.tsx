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
          Empezá gratis hoy: hasta 3 plantillas y 50 etiquetas por mes sin pagar nada.
          Sin tarjeta, sin compromiso.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" variant="secondary" className="h-14 px-10 text-base gap-2 group bg-background text-foreground hover:bg-background/90" asChild>
            <a href="/auth/register">
              Empezá gratis ahora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-10 text-base border-background/30 text-background hover:bg-background/10 hover:text-background" asChild>
            <a href="mailto:inteliarstack.ia@gmail.com?subject=Consulta%20Inteliar%20Labels">
              Hablar con un humano
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-background/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Gratis hasta 3 plantillas y 50 etiquetas/mes</span>
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
