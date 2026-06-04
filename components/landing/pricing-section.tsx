import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "US$10",
    period: "/mes",
    description: "Ideal para operaciones chicas que empiezan con impresión masiva.",
    features: [
      "1 impresora conectada",
      "Etiquetas ilimitadas",
      "Soporte Excel y CSV",
      "10 templates de etiquetas",
      "Soporte por email",
    ],
    cta: "Empezá la prueba gratis",
    popular: false,
  },
  {
    name: "Professional",
    price: "US$25",
    period: "/mes",
    description: "Para negocios que crecen y necesitan más potencia y flexibilidad.",
    features: [
      "5 impresoras conectadas",
      "Etiquetas ilimitadas",
      "Cola de impresión prioritaria",
      "Templates ilimitados",
      "Diseño personalizado de templates",
      "Acceso a API",
      "Soporte prioritario",
    ],
    cta: "Empezá la prueba gratis",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Personalizado",
    period: "",
    description: "Para operaciones grandes con necesidades avanzadas y múltiples sedes.",
    features: [
      "Impresoras ilimitadas",
      "Soporte multi-sede",
      "Automatización avanzada",
      "SSO y SAML",
      "Account manager dedicado",
      "SLA garantizado",
      "Opción on-premise",
    ],
    cta: "Contactar a Ventas",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Precios simples. Cancelá cuando quieras.
          </h2>
          <p className="text-lg text-muted-foreground">
            Empezá gratis por 14 días. Sin tarjeta de crédito. Mejorá tu plan cuando estés listo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card border rounded-2xl p-6 sm:p-8 ${
                plan.popular
                  ? "border-primary shadow-xl scale-105 z-10"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Más popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-11 gap-2 group ${
                  plan.popular ? "" : "bg-foreground hover:bg-foreground/90"
                }`}
                variant={plan.popular ? "default" : "secondary"}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todos los planes incluyen 14 días de prueba gratis. Sin tarjeta de crédito.{" "}
            <a href="#" className="text-primary hover:underline">
              Comparar todas las funcionalidades
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
