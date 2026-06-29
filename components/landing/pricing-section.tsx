"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, Loader2 } from "lucide-react"
import { analytics } from "@/lib/analytics"

const plans = [
  {
    name: "Mensual",
    price: "US$10",
    period: "/mes",
    description: "Ideal para arrancar. Pagás mes a mes y cancelás cuando quieras.",
    features: [
      "1 sucursal",
      "Hasta 2.000 impresiones/mes",
      "Diseñador visual + IA",
      "Plantillas predeterminadas",
      "Importación de Excel y CSV",
      "Soporte por email",
    ],
    cta: "Comprar plan Mensual",
    plan: "monthly" as const,
    popular: false,
    highlight: false,
  },
  {
    name: "Pro",
    price: "US$19",
    period: "/mes",
    description: "Para negocios con mayor volumen o múltiples puntos de venta.",
    features: [
      "Hasta 3 sucursales",
      "Impresiones ilimitadas",
      "Diseñador visual + IA",
      "Plantillas predeterminadas",
      "Importación de Excel y CSV",
      "Actualizaciones de software incluidas",
      "Gestión de dispositivos desde el panel",
      "Soporte prioritario",
    ],
    cta: "Comprar plan Pro",
    plan: "pro" as const,
    popular: true,
    highlight: true,
  },
  {
    name: "De por vida",
    price: "US$300",
    period: "pago único",
    description: "Pagás una vez y es tuyo para siempre. Sin renovaciones.",
    features: [
      "Hasta 5 sucursales",
      "Impresiones ilimitadas",
      "Diseñador visual + IA",
      "Plantillas predeterminadas",
      "Importación de Excel y CSV",
      "Todas las actualizaciones futuras",
      "Gestión de dispositivos desde el panel",
      "Soporte prioritario",
    ],
    cta: "Comprar de por vida",
    plan: "lifetime" as const,
    popular: false,
    highlight: false,
  },
]

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: "monthly" | "pro" | "lifetime") {
    setLoading(plan)
    analytics.pricingClick(plan)
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        window.location.href = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20comprar%20el%20plan%20" + plan
      }
    } catch {
      window.location.href = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20comprar%20el%20plan%20" + plan
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Elegí el plan que mejor te queda
          </h2>
          <p className="text-lg text-muted-foreground">
            15 días de prueba gratuita. Después, elegí el plan que mejor te queda.
            La clave te llega por email apenas pagás.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card border rounded-2xl p-6 sm:p-8 flex flex-col ${
                plan.highlight
                  ? "border-primary shadow-xl md:-translate-y-2 z-10"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full whitespace-nowrap">
                  Más popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-11 gap-2 group ${
                  plan.highlight ? "" : "bg-foreground hover:bg-foreground/90 text-background"
                }`}
                variant={plan.highlight ? "default" : "secondary"}
                onClick={() => handleCheckout(plan.plan)}
                disabled={loading === plan.plan}
              >
                {loading === plan.plan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Dudas antes de comprar?{" "}
            <a href="https://wa.me/5491165689145?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20los%20planes%20de%20Inteliar%20Labels" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Escribinos por WhatsApp
            </a>{" "}
            y te ayudamos a elegir.
          </p>
        </div>
      </div>
    </section>
  )
}
