"use client"

import { Button } from "@/components/ui/button"
import { Download, Monitor, Globe, Shield, ArrowRight } from "lucide-react"
import { analytics } from "@/lib/analytics"

export function DownloadSection() {
  return (
    <section id="descargar" className="py-24 px-4 sm:px-6 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Descarga</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            App web + agente de impresión local
          </h2>
          <p className="text-lg text-muted-foreground">
            El diseñador y la carga de datos son 100% web. Para enviar a tu impresora térmica
            instalás el agente local en tu PC — un proceso de 2 minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">App Web</h3>
                <p className="text-sm text-muted-foreground">Sin instalación · Siempre actualizada</p>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Diseñador visual de etiquetas",
                "Carga de Excel y CSV",
                "Gestión de templates y trabajos",
                "Historial con reimpresión",
                "Compatible con cualquier navegador",
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
              Requerido para imprimir
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Agente de Impresión</h3>
                <p className="text-sm text-muted-foreground">Windows 10/11 · Instalador .exe</p>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Se instala en 2 minutos",
                "Conexión por red TCP/IP o USB",
                "Compatible con ZPL y TSPL",
                "Zebra, Honeywell, TSC, Citizen, Sato",
                "Reintento automático ante errores",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full gap-2" asChild onClick={() => analytics.agentDownloaded()}>
              <a href="https://github.com/Inteliar-Stack-Agencia/Inteliar-Labels/releases/latest/download/Inteliar.Label.Setup.1.0.0.exe">
                <Download className="h-4 w-4" />
                Descargar para Windows
              </a>
            </Button>
            <p className="text-center text-xs text-muted-foreground -mt-2">
              v1.0.0 · Windows 10/11 · 74 MB · No requiere Node.js
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Sin tarjeta de crédito
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Compatible con Zebra, Honeywell, TSC, Citizen, Sato
          </div>
        </div>
      </div>
    </section>
  )
}
