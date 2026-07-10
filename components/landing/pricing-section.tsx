"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, Loader2, Globe, MapPin, X } from "lucide-react"
import { analytics } from "@/lib/analytics"

const EMPRESA_WA = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20cotizar%20el%20plan%20Empresa%20de%20Inteliar%20Labels"

const plansARS = [
  {
    name: "Mensual",
    price: "$17.999",
    period: "/mes",
    description: "Ideal para arrancar. Suscripción automática, cancelás cuando quieras.",
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
    currency: "ARS" as const,
    popular: false,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$39.999",
    period: "/mes",
    description: "Para cuando el límite de 2.000 impresiones te queda chico — sin techo de impresión.",
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
    currency: "ARS" as const,
    popular: true,
    highlight: true,
  },
  {
    name: "Empresa",
    price: "A medida",
    period: "",
    description: "Logística, multi-sucursal o alto volumen. Cotizamos según tu operación.",
    features: [
      "Sucursales e impresoras ilimitadas",
      "Impresiones ilimitadas",
      "Soporte prioritario con SLA",
      "Onboarding asistido",
      "Integraciones a medida",
    ],
    cta: "Hablar con ventas",
    href: EMPRESA_WA,
    popular: false,
    highlight: false,
  },
]

const plansUSD = [
  {
    name: "Mensual",
    price: "US$12",
    period: "/mes",
    description: "Ideal para arrancar. Suscripción automática, cancelás cuando quieras.",
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
    currency: "USD" as const,
    popular: false,
    highlight: false,
  },
  {
    name: "Pro",
    price: "US$25",
    period: "/mes",
    description: "Para cuando el límite de 2.000 impresiones te queda chico — sin techo de impresión.",
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
    currency: "USD" as const,
    popular: true,
    highlight: true,
  },
  {
    name: "Empresa",
    price: "A medida",
    period: "",
    description: "Logística, multi-sucursal o alto volumen. Cotizamos según tu operación.",
    features: [
      "Sucursales e impresoras ilimitadas",
      "Impresiones ilimitadas",
      "Soporte prioritario con SLA",
      "Onboarding asistido",
      "Integraciones a medida",
    ],
    cta: "Hablar con ventas",
    href: EMPRESA_WA,
    popular: false,
    highlight: false,
  },
]

// Prepaid multi-year Pro — replaces the old unlimited "lifetime" plan.
// Same features as Pro, paid upfront at a discount, but with an expiry date.
const termPlansARS = [
  { name: "1 año", price: "$379.999", plan: "pro1y" as const, save: "Ahorrás ~21%" },
  { name: "3 años", price: "$899.999", plan: "pro3y" as const, save: "Ahorrás ~37%" },
  { name: "5 años", price: "$1.199.999", plan: "pro5y" as const, save: "Ahorrás ~50%" },
]

const termPlansUSD = [
  { name: "1 año", price: "US$250", plan: "pro1y" as const, save: "Ahorrás ~17%" },
  { name: "3 años", price: "US$600", plan: "pro3y" as const, save: "Ahorrás ~33%" },
  { name: "5 años", price: "US$800", plan: "pro5y" as const, save: "Ahorrás ~47%" },
]

type PlanId = "monthly" | "pro" | "pro1y" | "pro3y" | "pro5y"
type PendingCheckout = { plan: PlanId; currency: "ARS" | "USD" } | null

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null)
  const [region, setRegion] = useState<"ARS" | "USD">("ARS")
  const [pending, setPending] = useState<PendingCheckout>(null)
  const [emailInput, setEmailInput] = useState("")
  const [emailError, setEmailError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const plans = region === "ARS" ? plansARS : plansUSD
  const termPlans = region === "ARS" ? termPlansARS : termPlansUSD

  async function submitCheckout(plan: PlanId, currency: "ARS" | "USD", email?: string) {
    setLoading(plan)
    analytics.pricingClick(plan)
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, currency, email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("[checkout] sin URL:", data)
        alert(`Error al iniciar el pago: ${data.error || "respuesta inesperada"}. Te redirigimos a WhatsApp.`)
        window.location.href = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20comprar%20el%20plan%20" + plan
      }
    } catch (e: any) {
      console.error("[checkout] excepción:", e.message)
      window.location.href = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20comprar%20el%20plan%20" + plan
    } finally {
      setLoading(null)
    }
  }

  function handleCheckout(plan: PlanId, currency: "ARS" | "USD") {
    if (currency === "ARS" && (plan === "monthly" || plan === "pro")) {
      setEmailInput("")
      setEmailError("")
      setPending({ plan, currency })
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }
    submitCheckout(plan, currency)
  }

  function handleEmailSubmit() {
    const email = emailInput.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Ingresá un email válido.")
      inputRef.current?.focus()
      return
    }
    if (!pending) return
    setPending(null)
    submitCheckout(pending.plan, pending.currency, email)
  }

  return (
    <>
    {/* Email modal for MP subscriptions */}
    {pending && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Ingresá tu email</h3>
            <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            MercadoPago necesita tu email para enviarte el comprobante y activar la suscripción.
          </p>
          <input
            ref={inputRef}
            type="email"
            placeholder="tumail@ejemplo.com"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setEmailError("") }}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-1"
          />
          {emailError && <p className="text-xs text-destructive mb-3">{emailError}</p>}
          <Button
            className="w-full mt-3 h-11 gap-2"
            onClick={handleEmailSubmit}
            disabled={loading === pending.plan}
          >
            {loading === pending.plan ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>Ir a pagar con MercadoPago <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    )}
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wide">Precios</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Elegí el plan que mejor te queda
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            15 días de prueba gratuita. Después, elegí el plan que mejor te queda.
            La clave te llega por email apenas pagás.
          </p>

          {/* Region toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
            <button
              onClick={() => setRegion("ARS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                region === "ARS"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Argentina · ARS
            </button>
            <button
              onClick={() => setRegion("USD")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                region === "USD"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Internacional · USD
            </button>
          </div>

          {region === "ARS" && (
            <p className="text-xs text-muted-foreground mt-3">Pagá con MercadoPago · Débito, crédito y más</p>
          )}
          {region === "USD" && (
            <p className="text-xs text-muted-foreground mt-3">Pagá con Stripe · Tarjeta internacional</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={`${region}-${index}`}
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
                asChild={"href" in plan}
                onClick={"href" in plan ? undefined : () => handleCheckout(plan.plan!, plan.currency!)}
                disabled={loading === ("plan" in plan ? plan.plan : undefined)}
              >
                {"href" in plan ? (
                  <a href={plan.href} target="_blank" rel="noopener noreferrer">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                ) : loading === plan.plan ? (
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

        {/* Prepaid multi-year Pro — replaces the old unlimited "lifetime" plan */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">¿Preferís pagar por adelantado?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Llevate el plan Pro con descuento por varios años — mismo Pro, precio congelado por el plazo que elijas.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {termPlans.map((t) => (
              <div key={t.plan} className="rounded-xl border border-border p-5 text-center flex flex-col">
                <p className="text-sm font-medium text-muted-foreground">{t.name}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{t.price}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 mb-4">{t.save}</p>
                <Button
                  variant="outline"
                  className="w-full gap-2 mt-auto"
                  onClick={() => handleCheckout(t.plan, region)}
                  disabled={loading === t.plan}
                >
                  {loading === t.plan ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Comprar <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Dudas antes de comprar?{" "}
            <a href="https://wa.me/5491165689145?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20los%20planes%20de%20Inteliar%20Labels" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Escribinos por WhatsApp
            </a>{" "}
            y te ayudamos a elegir.
          </p>
          <p className="text-sm text-muted-foreground">
            ¿Necesitás una función específica o un ajuste para tu operación?{" "}
            <a href="https://wa.me/5491165689145?text=Hola%2C%20necesito%20un%20desarrollo%20personalizado%20para%20Inteliar%20Labels" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Contanos qué necesitás
            </a>{" "}
            — podemos desarrollarlo para vos.
          </p>
        </div>
      </div>
    </section>
    </>
  )
}
