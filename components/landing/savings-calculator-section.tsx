"use client"

import { useState, useEffect } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

// Rough, conservative estimate: writing/sticking a label by hand takes
// ~20 seconds on average (find the sticker, write date/price, stick it).
const SECONDS_PER_LABEL_MANUAL = 20
const WORK_DAYS_PER_MONTH = 26

const CURRENCIES = [
  { code: "USD", symbol: "US$", decimals: 2 },
  { code: "ARS", symbol: "AR$", decimals: 0 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "BRL", symbol: "R$", decimals: 2 },
  { code: "MXN", symbol: "MX$", decimals: 0 },
  { code: "UYU", symbol: "$U", decimals: 0 },
  { code: "CLP", symbol: "CLP$", decimals: 0 },
  { code: "COP", symbol: "COP$", decimals: 0 },
] as const
type CurrencyCode = (typeof CURRENCIES)[number]["code"]

// Approximate fallback rates (units of currency per 1 USD) in case the live
// rate fetch fails — only used to keep the default example numbers realistic
// when switching currency; the user can edit freely afterward regardless.
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1, ARS: 1000, EUR: 0.92, BRL: 5.4, MXN: 18, UYU: 40, CLP: 950, COP: 4100,
}

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
        {prefix && <span className="pl-3 text-sm text-muted-foreground whitespace-nowrap">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={value.toLocaleString("es-AR")}
          onChange={(e) => {
            const raw = e.target.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")
            onChange(Math.max(min, Number(raw) || 0))
          }}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-sm text-foreground focus:outline-none"
        />
        {suffix && <span className="pr-3 text-sm text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  )
}

export function SavingsCalculatorSection() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES)

  const [perDay, setPerDay] = useState(80)
  const [rollCost, setRollCost] = useState(10)
  const [rollSize, setRollSize] = useState(1000)
  const [softwareCost, setSoftwareCost] = useState(13)
  const [printerCost, setPrinterCost] = useState(500)

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) {
          const next = { ...FALLBACK_RATES }
          for (const c of CURRENCIES) {
            if (typeof data.rates[c.code] === "number") next[c.code] = data.rates[c.code]
          }
          setRates(next)
        }
      })
      .catch(() => {}) // keep FALLBACK_RATES
  }, [])

  function handleCurrencyChange(next: CurrencyCode) {
    const factor = rates[next] / rates[currency]
    setRollCost((v) => Number((v * factor).toFixed(2)))
    setSoftwareCost((v) => Number((v * factor).toFixed(2)))
    setPrinterCost((v) => Number((v * factor).toFixed(2)))
    setCurrency(next)
  }

  const cur = CURRENCIES.find((c) => c.code === currency)!
  const fmt = (v: number, extraDecimals = 0) =>
    `${cur.symbol}${v.toLocaleString("es-AR", { minimumFractionDigits: cur.decimals + extraDecimals, maximumFractionDigits: cur.decimals + extraDecimals })}`

  const labelsPerMonth = perDay * WORK_DAYS_PER_MONTH

  const rollsNeeded = labelsPerMonth / rollSize
  const suppliesCostMonth = rollsNeeded * rollCost
  const totalSoftwareCostMonth = suppliesCostMonth + softwareCost

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
        <p className="text-lg text-muted-foreground mb-6">
          Ingresá tus propios números — rollo de etiquetas, plan y costo de la impresora.
        </p>

        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="text-xs text-muted-foreground">Moneda:</span>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
            className="text-sm rounded-lg border border-input bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {c.symbol}</option>
            ))}
          </select>
        </div>

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
            <NumberField label="Costo del rollo de etiquetas" prefix={cur.symbol} value={rollCost} onChange={setRollCost} />
            <NumberField label="Etiquetas por rollo" value={rollSize} onChange={setRollSize} min={1} suffix="unidades" />
            <NumberField label="Plan de etiquetar.app" prefix={cur.symbol} value={softwareCost} onChange={setSoftwareCost} suffix="/mes" />
            <NumberField label="Costo de la impresora" prefix={cur.symbol} value={printerCost} onChange={setPrinterCost} suffix="pago único" />
          </div>

          {/* The headline number: cost per label, all-in */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Cada etiqueta te cuesta (rollo + plan incluidos)
            </p>
            <p className="text-5xl font-bold text-primary">
              {fmt(costPerLabel, costPerLabel < 1 ? 3 : 0)}
            </p>
            <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
              <span>100 etiquetas: <strong className="text-foreground">{fmt(costPerLabel * 100)}</strong></span>
              <span>1.000 etiquetas: <strong className="text-foreground">{fmt(costPerLabel * 1000)}</strong></span>
            </div>
            <p className="text-sm font-semibold text-foreground mt-4 max-w-md mx-auto">
              Compará eso contra lo que suma en presentación, prolijidad y el margen del producto
              que estás vendiendo — normalmente no es ni comparación.
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-6 text-center">
            <p className="text-3xl font-bold text-foreground">{fmt(totalSoftwareCostMonth)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              por mes con etiquetar.app (rollos + plan, sin contar impresora)
            </p>
          </div>

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
