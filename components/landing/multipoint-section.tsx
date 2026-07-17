"use client"

import { Building2, Wifi, Usb, Printer, ArrowRight, Cloud } from "lucide-react"

export function MultipointSection() {
  return (
    <section id="multipunto" className="py-24 px-4 sm:px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Impresión remota</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Multipunto: imprimí en cualquiera de tus sucursales, desde donde estés
          </h2>
          <p className="text-lg text-muted-foreground">
            ¿Tenés la oficina en un lugar y la cocina, el depósito o el local en otro? Elegí a qué impresora mandar cada trabajo, sin moverte de tu escritorio.
          </p>
        </div>

        {/* Diagram */}
        <div className="rounded-2xl border border-border bg-card shadow-lg p-6 sm:p-10 mb-12">
          <div className="flex flex-col items-center gap-6">
            {/* Office */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">PC Oficina</p>
              <p className="text-xs text-muted-foreground">Elegís la impresora destino</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            {/* Cloud */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cloud className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Inteliar Labels (nube)</p>
              <p className="text-xs text-muted-foreground">Enruta el trabajo a destino</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            {/* Two branches */}
            <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-5">
                <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Impresora de red</p>
                <p className="text-xs text-muted-foreground text-center">Tiene IP propia (WiFi/cable). Recibe el trabajo directo, sin PC intermedia.</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-5">
                <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Usb className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Impresora USB</p>
                <p className="text-xs text-muted-foreground text-center">Conectada a una PC con el agente instalado, prendida y con internet.</p>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                <Printer className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">🖨️ Imprime en la Cocina (o donde esté)</p>
            </div>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="font-semibold text-foreground mb-1">Hasta 3 sucursales</p>
            <p className="text-sm text-muted-foreground">Con el plan Pro conectás hasta 3 puntos de impresión distintos a la misma cuenta.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Elegís el destino al imprimir</p>
            <p className="text-sm text-muted-foreground">Un selector simple te deja mandar cada trabajo a la impresora que corresponda.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Red o USB, como ya la tengas</p>
            <p className="text-sm text-muted-foreground">No hace falta cambiar de impresora. Funciona con la conexión que ya usás hoy.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
