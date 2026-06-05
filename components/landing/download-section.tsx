import { Button } from "@/components/ui/button"
import { Download, Monitor, Globe, Clock, Shield, ArrowRight } from "lucide-react"

export function DownloadSection() {
  return (
    <section id="descargar" className="py-24 px-4 sm:px-6 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Descarga</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Usalo en la web o instalálo en tu PC
          </h2>
          <p className="text-lg text-muted-foreground">
            Inteliar Labels está disponible como app web y como programa de escritorio para Windows.
            Ambas versiones incluyen 30 días de prueba gratuita.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Versión Web</h3>
                <p className="text-sm text-muted-foreground">Sin instalación · Siempre actualizada</p>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Accedé desde cualquier navegador",
                "Compatible con Windows, Mac y Linux",
                "Actualizaciones automáticas",
                "Datos en la nube seguros",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full gap-2 group" asChild>
              <a href="/auth/register">
                Empezar gratis en la web
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>

          <div className="rounded-2xl border border-primary/50 bg-card p-8 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-medium text-primary">
              Próximamente
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Versión Escritorio</h3>
                <p className="text-sm text-muted-foreground">Windows 10/11 · Instalador .exe</p>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Funciona sin conexión a internet",
                "Impresión directa por USB o red",
                "Integración nativa con Windows",
                "30 días de prueba gratuita incluidos",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full gap-2" variant="outline" disabled>
              <Download className="h-4 w-4" />
              Descargar para Windows
            </Button>
            <p className="text-center text-xs text-muted-foreground -mt-2">
              Dejá tu email y te avisamos cuando esté disponible →{" "}
              <a href="mailto:soporte@inteliar.com" className="text-primary hover:underline">
                soporte@inteliar.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            30 días de prueba gratis
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Sin tarjeta de crédito
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Compatible con Zebra, Honeywell, Sato, Citizen
          </div>
        </div>
      </div>
    </section>
  )
}
