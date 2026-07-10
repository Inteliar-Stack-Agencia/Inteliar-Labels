"use client"

import { useState } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

// Rough, conservative estimate: writing/sticking a label by hand takes
// ~20 seconds on average (find the sticker, write date/price, stick it).
const SECONDS_PER_LABEL_MANUAL = 20
const WORK_DAYS_PER_MONTH = 26

function NumberField({
  label, value, onChange, prefix, suffix, min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  min?: number
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
        {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-sm text-foreground focus:outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  )
}

export function SavingsCalculatorSection() {
  const [perDay, setPerDay] = useState(80)
  const [rollCost, setRollCost] = useState(10) // USD per 1000 labels (80x40mm), AR reference
  const [rollSize, setRollSize] = useState(1000)
  const [softwareCost, setSoftwareCost] = useState(13) // USD/month
  const [printerCost, setPrinterCost] = useState(500) // USD one-time
  const [hourlyRate, setHourlyRate] = useState(4) // USD/hour, informal reference

  const labelsPerMonth = perDay * WORK_DAYS_PER_MONTH
  const hoursPerMonth = (labelsPerMonth * SECONDS_PER_LABEL_MANUAL) / 3600
  const manualCostMonth = hoursPerMonth * hourlyRate

  const rollsNeeded = labelsPerMonth / rollSize
  const suppliesCostMonth = rollsNeeded * rollCost
  const totalSoftwareCostMonth = suppliesCostMonth + softwareCost

  const netSavingsMonth = manualCostMonth - totalSoftwareCostMonth
  const paybackMonths = netSavingsMonth > 0 ? printerCost / netSavingsMonth : null

  // The number that actually convinces: what does ONE label cost you,
  // all-in (supplies + software), vs. the value it adds to what you sell.
  const costPerLabel = labelsPerMonth > 0 ? totalSoftwareCostMonth / labelsPerMonth : 0

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-sm mb-4">
          <Calculator className="w-4 h-4" />
          Calculá tu costo real
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
          ¿Cuánto te cuesta realmente cada etiqueta?
        </h2>
        <p className="text-lg text-muted-foreground mb-10">
          Ingresá tus propios números — rollo de etiquetas, plan y costo de la impresora.
        </p>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-left">
          <label className="block mb-8">
            <span className="text-sm font-medium text-muted-foreground">
              Etiquetas por día: <span className="text-foreground font-semibold">{perDay}</span>
            </span>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={perDay}
              onChange={(e) => setPerDay(Number(e.target.value))}
              className="w-full accent-primary mt-2"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <NumberField label="Costo del rollo de etiquetas" prefix="US$" value={rollCost} onChange={setRollCost} />
            <NumberField label="Etiquetas por rollo" value={rollSize} onChange={setRollSize} min={1} suffix="unidades" />
            <NumberField label="Plan de etiquetar.app" prefix="US$" value={softwareCost} onChange={setSoftwareCost} suffix="/mes" />
            <NumberField label="Costo de la impresora" prefix="US$" value={printerCost} onChange={setPrinterCost} suffix="pago único" />
            <NumberField label="Tu hora de trabajo vale" prefix="US$" value={hourlyRate} onChange={setHourlyRate} suffix="/hora" />
          </div>

          {/* The headline number: cost per label, all-in */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Cada etiqueta te cuesta (rollo + plan incluidos)
            </p>
            <p className="text-5xl font-bold text-primary">
              US${costPerLabel < 1 ? costPerLabel.toFixed(3) : costPerLabel.toFixed(2)}
            </p>
            <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <span>100 etiquetas: <strong className="text-foreground">US${(costPerLabel * 100).toFixed(2)}</strong></span>
              <span>1.000 etiquetas: <strong className="text-foreground">US${(costPerLabel * 1000).toFixed(2)}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
              Compará eso contra lo que suma en presentación, prolijidad y el margen del producto
              que estás vendiendo — normalmente no es ni comparación.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl bg-muted/50 p-6">
              <p className="text-3xl font-bold text-foreground">${manualCostMonth.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                de tu tiempo por mes etiquetando a mano ({hoursPerMonth.toFixed(1)}hs)
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-6">
              <p className="text-3xl font-bold text-foreground">${totalSoftwareCostMonth.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                por mes con etiquetar.app (rollos + plan, sin contar impresora)
              </p>
            </div>
          </div>

          {netSavingsMonth > 0 && paybackMonths !== null && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Además, ahorrás ${netSavingsMonth.toFixed(0)}/mes de tu tiempo — la impresora se paga
              sola en ~{Math.ceil(paybackMonths)} mes{Math.ceil(paybackMonths) === 1 ? "" : "es"}.
            </p>
          )}

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
