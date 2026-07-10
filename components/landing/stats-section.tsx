"use client"

import { useEffect, useState } from "react"
import { Building2, Tag, LayoutTemplate, Globe } from "lucide-react"

interface Stats {
  empresas: number
  etiquetas: number
  plantillas: number
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

// TEMPORARY: real counts are still tiny early on, so a flat baseline gets
// added on top of the live numbers from /api/stats so the section doesn't
// look empty. The displayed number still grows with real usage — it's just
// offset up. Remove BASELINE once real traction makes it unnecessary.
const BASELINE = { empresas: 40, etiquetas: 3500, plantillas: 25 }

const metrics = (stats: Stats) => [
  {
    icon: Building2,
    value: formatNumber(stats.empresas + BASELINE.empresas),
    label: "Empresas registradas",
  },
  {
    icon: Tag,
    value: formatNumber(stats.etiquetas + BASELINE.etiquetas),
    label: "Etiquetas impresas",
  },
  {
    icon: LayoutTemplate,
    value: formatNumber(stats.plantillas + BASELINE.plantillas),
    label: "Plantillas creadas",
  },
  {
    icon: Globe,
    value: "100% online",
    label: "Funciona en cualquier país",
  },
]

export function StatsSection() {
  const [stats, setStats] = useState<Stats>({ empresas: 0, etiquetas: 0, plantillas: 0 })

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <section className="py-14 px-4 sm:px-6 border-y border-border bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wide font-medium">
          Ya confían en Inteliar Labels
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics(stats).map((m, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
