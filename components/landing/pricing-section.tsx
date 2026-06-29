"use client"

import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"
import { analytics } from "@/lib/analytics"

const MONTHLY_URL = process.env.NEXT_PUBLIC_CHECKOUT_MONTHLY_URL || "mailto:inteliarstack.ia@gmail.com?subject=Quiero%20el%20plan%20Mensual"
const PRO_URL = process.env.NEXT_PUBLIC_CHECKOUT_PRO_URL || "mailto:inteliarstack.ia@gmail.com?subject=Quiero%20el%20plan%20Pro"
const LIFETIME_URL = process.env.NEXT_PUBLIC_CHECKOUT_LIFETIME_URL || "mailto:inteliarstack.ia@gmail.com?subject=Quiero%20el%20plan%20De%20por%20vida"

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
    href: MONTHLY_URL,
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
    href: PRO_URL,
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
    href: LIFETIME_URL,
    popular: false,
    highlight: false,
  },
]

export function PricingSection() {
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

              <a href={plan.href} target={plan.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => analytics.pricingClick(plan.name.toLowerCase().replace("de por vida", "lifetime").replace("mensual", "monthly") as "monthly" | "pro" | "lifetime")}>
                <Button
                  className={`w-full h-11 gap-2 group ${
                    plan.highlight ? "" : "bg-foreground hover:bg-foreground/90 text-background"
                  }`}
                  variant={plan.highlight ? "default" : "secondary"}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Dudas antes de comprar?{" "}
            <a href="mailto:inteliarstack.ia@gmail.com" className="text-primary hover:underline">
              Escribinos
            </a>{" "}
            y te ayudamos a elegir.
          </p>
        </div>
      </div>
    </section>
  )
}
