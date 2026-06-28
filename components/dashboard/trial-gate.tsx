"use client"

import { usePlanLimits } from "@/lib/use-plan-limits"
import { Button } from "@/components/ui/button"
import { Lock, ArrowRight } from "lucide-react"

export function TrialGate({ children }: { children: React.ReactNode }) {
  const plan = usePlanLimits()

  if (plan.loading) return <>{children}</>

  if (!plan.trialExpired) return <>{children}</>

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Blurred background */}
      <div className="pointer-events-none select-none blur-sm opacity-40 overflow-hidden h-full">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/60 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4 rounded-2xl border border-border bg-card shadow-2xl p-8 text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Tu trial ha vencido</h2>
            <p className="text-sm text-muted-foreground">
              {plan.trialLabelsLeft === 0
                ? `Usaste las 500 impresiones del período de prueba.`
                : `Se cumplieron los 15 días del período de prueba.`}
              {" "}Activá tu licencia para seguir usando Inteliar Labels sin límites.
            </p>
          </div>

          <div className="space-y-3">
            <a href="/#pricing" className="block">
              <Button className="w-full h-11 gap-2 group">
                Ver planes y activar licencia
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="mailto:inteliarstack.ia@gmail.com?subject=Activar%20licencia%20Inteliar%20Labels" className="block">
              <Button variant="outline" className="w-full h-11">
                Hablar con soporte
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            ¿Ya compraste? Activá tu clave en{" "}
            <a href="/settings" className="text-primary hover:underline">Configuración → Licencia</a>
          </p>
        </div>
      </div>
    </div>
  )
}
