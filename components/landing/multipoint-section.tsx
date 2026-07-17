"use client"

import { Building2, Wifi, Usb, Printer, ArrowRight, Router, Cloud } from "lucide-react"

export function MultipointSection() {
  return (
    <section id="multipunto" className="py-24 px-4 sm:px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Impresión remota</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Multipunto: elegí a qué impresora mandar cada trabajo
          </h2>
          <p className="text-lg text-muted-foreground">
            ¿Tenés más de una impresora — un local, un depósito, la cocina? Seleccionás el destino desde un solo lugar, sin tener que pararte al lado de cada una.
          </p>
        </div>

        {/* Diagram */}
        <div className="rounded-2xl border border-border bg-card shadow-lg p-6 sm:p-10 mb-12">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Tu PC</p>
              <p className="text-xs text-muted-foreground">Elegís la impresora destino</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Router className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Misma red WiFi/LAN</p>
              <p className="text-xs text-muted-foreground">El agente encuentra la impresora en la red</p>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            <div className="grid sm:grid-cols-2 gap-6 w-full max-w-xl">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-5">
                <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Impresora de red</p>
                <p className="text-xs text-muted-foreground text-center">Tiene IP propia (WiFi/cable). Recibe el trabajo directo.</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border p-5">
                <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Usb className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-foreground">Impresora USB</p>
                <p className="text-xs text-muted-foreground text-center">Conectada a una PC con el agente instalado y prendida.</p>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />

            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                <Printer className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">🖨️ Imprime en el punto elegido</p>
            </div>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div>
            <p className="font-semibold text-foreground mb-1">Hasta 3 impresoras</p>
            <p className="text-sm text-muted-foreground">Con el plan Pro conectás hasta 3 impresoras a la misma cuenta, dentro de la misma red.</p>
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

        {/* Empresa upsell */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-foreground">¿Necesitás imprimir entre sucursales en redes distintas?</p>
            <p className="text-sm text-muted-foreground">
              Para imprimir desde la oficina a un local o depósito en otra ciudad o red, el plan Empresa incluye Multipunto vía nube, sin límite de puntos de impresión.
            </p>
          </div>
          <a href="#pricing" className="shrink-0 text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Ver plan Empresa →
          </a>
        </div>
      </div>
    </section>
  )
}
