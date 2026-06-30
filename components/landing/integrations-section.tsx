"use client"

import { ArrowRight, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const integrations = [
  {
    name: "Tiendanube",
    description: "Importá todos tus productos en un clic. Precios, variantes, SKU y código de barras.",
    status: "available" as const,
    href: "/integracion-tiendanube",
    color: "#14cce4",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#14cce4" />
        <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm0 21a9 9 0 110-18 9 9 0 010 18z" fill="white" opacity="0.3"/>
        <path d="M20 11a9 9 0 100 18A9 9 0 0020 11zm-1 13.5v-9l6 4.5-6 4.5z" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Shopify",
    description: "Conectá tu tienda Shopify e imprimí etiquetas para todos tus productos.",
    status: "soon" as const,
    href: null,
    color: "#96bf48",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#96bf48" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">S</text>
      </svg>
    ),
  },
  {
    name: "Mercado Libre",
    description: "Importá tus publicaciones de Mercado Libre y generá etiquetas de precio y producto.",
    status: "soon" as const,
    href: null,
    color: "#ffe600",
    logo: (
      <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
        <rect width="40" height="40" rx="8" fill="#ffe600" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#333" fontSize="18" fontWeight="bold">ML</text>
      </svg>
    ),
  },
]

export function IntegrationsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-muted/20 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Integraciones</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Importá tus productos en un clic
          </h2>
          <p className="text-lg text-muted-foreground">
            Conectá tu tienda y traé todos los productos directo — sin Excel, sin copiar y pegar.
            Precios, variantes y códigos de barras listos para imprimir.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col gap-4 ${
                integration.status === "available"
                  ? "border-primary/30 shadow-sm"
                  : "border-border opacity-75"
              }`}
            >
              {integration.status === "available" && (
                <div className="absolute -top-3 left-5">
                  <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Disponible
                  </span>
                </div>
              )}
              {integration.status === "soon" && (
                <div className="absolute -top-3 left-5">
                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full border border-border">
                    <Clock className="w-3 h-3" />
                    Próximamente
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                {integration.logo}
                <h3 className="text-lg font-semibold text-foreground">{integration.name}</h3>
              </div>

              <p className="text-sm text-muted-foreground flex-1">{integration.description}</p>

              {integration.status === "available" && integration.href ? (
                <Link href={integration.href}>
                  <Button variant="outline" size="sm" className="w-full gap-2 group">
                    Ver integración
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <Button variant="ghost" size="sm" className="w-full" disabled>
                  Próximamente
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Mini how-it-works for Tiendanube */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-6 text-center">
            ¿Cómo funciona con Tiendanube?
          </p>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "1", label: "Pegás la URL de tu tienda" },
              { step: "2", label: "Importamos todos los productos" },
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
            <Link href="/integracion-tiendanube">
              <Button className="gap-2 group">
                Ver cómo funciona
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
