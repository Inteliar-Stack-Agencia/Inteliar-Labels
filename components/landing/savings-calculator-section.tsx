"use client"

import { useState } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

// Rough, conservative estimate: writing/sticking a label by hand takes
// ~20 seconds on average (find the sticker, write date/price, stick it).
const SECONDS_PER_LABEL_MANUAL = 20
const HOURLY_RATE_ARS = 3500 // conservative informal hourly rate reference

export function SavingsCalculatorSection() {
  const [perDay, setPerDay] = useState(80)

  const hoursPerMonth = (perDay * 26 * SECONDS_PER_LABEL_MANUAL) / 3600
  const moneyPerMonth = Math.round(hoursPerMonth * HOURLY_RATE_ARS)

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-sm mb-4">
          <Calculator className="w-4 h-4" />
          Calculá tu tiempo perdido
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
          ¿Cuánto te está costando etiquetar a mano?
        </h2>
        <p className="text-lg text-muted-foreground mb-10">
          Movés el número a la cantidad de etiquetas que hacés por día — el cálculo es sobre 26 días hábiles al mes.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Etiquetas por día: <span className="text-foreground font-semibold">{perDay}</span>
          </label>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={perDay}
            onChange={(e) => setPerDay(Number(e.target.value))}
            className="w-full accent-primary mb-10"
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl bg-muted/50 p-6">
              <p className="text-3xl font-bold text-foreground">{hoursPerMonth.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-1">horas por mes escribiendo etiquetas a mano</p>
            </div>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">${moneyPerMonth.toLocaleString("es-AR")}</p>
              <p className="text-sm text-muted-foreground mt-1">de tu tiempo, valorizado por mes</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Con Inteliar Labels imprimís esas mismas {perDay} etiquetas en menos de un minuto, todas iguales, sin errores de tipeo.
          </p>

          <Button size="lg" className="gap-2 mt-6 group" asChild>
            <a href="/auth/register" onClick={() => analytics.ctaClick("calculator")}>
              Probar gratis 15 días
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
