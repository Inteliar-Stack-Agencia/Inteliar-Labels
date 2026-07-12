"use client"

import { ArrowRight, CheckCircle2, Clock, Printer, ScanLine, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const integrations = [
  {
    name: "Mercado Libre",
    description: "Conectá tu cuenta e imprimí la etiqueta oficial de Mercado Envíos —con el código de seguimiento real que escanea el correo— directo en tu impresora térmica, sin pasar por el PDF.",
    status: "available" as const,
    bg: "#fff6cc",
    accent: "#2d3277",
    logo: <img src="/logos/mercadolibre-icon.png" alt="Mercado Libre" className="w-9 h-9 object-contain" />,
    benefits: [
      { icon: Printer, text: "Etiqueta oficial con tracking, sin descargar PDF" },
      { icon: ScanLine, text: "Importá productos vendidos con SKU y precio" },
      { icon: Eye, text: "Datos de comprador en pantalla, control interno" },
    ],
  },
  {
    name: "Tiendanube",
    description: "Conectá tu tienda y traé pedidos pagos o tu catálogo completo publicado —con precio, SKU y variantes— para imprimir etiquetas de producto o de góndola en un clic.",
    status: "available" as const,
    bg: "#e6ecff",
    accent: "#0433ff",
    logo: <img src="/logos/tiendanube-icon.svg" alt="Tiendanube" className="w-9 h-9 object-contain" />,
    benefits: [
      { icon: ScanLine, text: "Catálogo completo con precio, SKU y variantes" },
      { icon: Printer, text: "Etiquetas de producto de tus pedidos pagos" },
      { icon: Eye, text: "Datos de comprador en pantalla, control interno" },
    ],
  },
]

const soon = [
  { name: "Shopify", color: "#96bf48" },
  { name: "WooCommerce", color: "#96588a" },
]

export function IntegrationsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/20 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Integraciones</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Conectá tu tienda, no cargues Excel
          </h2>
          <p className="text-lg text-muted-foreground">
            Traé tus pedidos y productos directo desde Mercado Libre o Tiendanube —incluida la etiqueta oficial
            de envío de Mercado Envíos— sin copiar y pegar nada.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="relative border rounded-2xl p-6 flex flex-col gap-4 border-border shadow-sm overflow-hidden"
              style={{ backgroundColor: integration.bg }}
            >
              <div className="absolute -top-3 left-5">
                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Disponible
                </span>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  {integration.logo}
                </div>
                <h3 className="text-lg font-semibold" style={{ color: integration.accent }}>{integration.name}</h3>
              </div>

              <p className="text-sm text-neutral-700">{integration.description}</p>

              <ul className="space-y-1.5">
                {integration.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-neutral-600">
                    <b.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: integration.accent }} />
                    {b.text}
                  </li>
                ))}
              </ul>

              <Link href="/auth/register" className="mt-auto">
                <Button size="sm" className="w-full gap-2 group" style={{ backgroundColor: integration.accent, color: "white" }}>
                  Conectar {integration.name}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {soon.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-border"
            >
              <Clock className="w-3 h-3" />
              {s.name} — próximamente
            </span>
          ))}
        </div>

        {/* Mini how-it-works */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6 text-center">
            ¿Cómo funciona?
          </p>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "1", label: "Conectás tu cuenta de ML o Tiendanube" },
              { step: "2", label: "Importamos pedidos o catálogo" },
              { step: "3", label: "Elegís la plantilla de etiqueta" },
              { step: "4", label: "Imprimís en tu impresora térmica" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-2">
                  {s.step}
                </div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/auth/register">
              <Button className="gap-2 group">
                Probarlo gratis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
