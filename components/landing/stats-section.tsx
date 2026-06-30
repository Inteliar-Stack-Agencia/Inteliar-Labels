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

const metrics = (stats: Stats) => [
  {
    icon: Building2,
    value: stats.empresas > 0 ? formatNumber(stats.empresas) : "—",
    label: "Empresas registradas",
  },
  {
    icon: Tag,
    value: stats.etiquetas > 0 ? formatNumber(stats.etiquetas) : "—",
    label: "Etiquetas impresas",
  },
  {
    icon: LayoutTemplate,
    value: stats.plantillas > 0 ? formatNumber(stats.plantillas) : "—",
    label: "Plantillas creadas",
  },
  {
    icon: Globe,
    value: "AR · MX · UY",
    label: "Países con usuarios",
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
