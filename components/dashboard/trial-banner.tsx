"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Sparkles, X } from "lucide-react"

const TRIAL_DAYS = 14

function getDaysLeft(createdAt: string): number {
  const trialEnd = new Date(createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  return Math.ceil((trialEnd - Date.now()) / (24 * 60 * 60 * 1000))
}

export function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.created_at) return
      setDaysLeft(getDaysLeft(user.created_at))
    })
  }, [])

  // Only show if trial has < 5 days left or is expired
  if (daysLeft === null || daysLeft > 5 || dismissed) return null

  const expired = daysLeft <= 0

  return (
    <div className={cn(
      "mx-3 mb-2 rounded-lg p-3 text-xs space-y-1.5",
      expired
        ? "bg-destructive/10 border border-destructive/30"
        : "bg-amber-500/10 border border-amber-500/30"
    )}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className={cn("h-3.5 w-3.5 flex-shrink-0", expired ? "text-destructive" : "text-amber-500")} />
          <span className={cn("font-semibold", expired ? "text-destructive" : "text-amber-600 dark:text-amber-400")}>
            {expired ? "Prueba vencida" : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} de prueba`}
          </span>
        </div>
        {!expired && (
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <p className={cn("leading-snug", expired ? "text-destructive/80" : "text-amber-600/80 dark:text-amber-400/80")}>
        {expired
          ? "Tu período de prueba terminó. Contactanos para continuar."
          : "Tu período de prueba gratuito está por vencer."}
      </p>
      <a
        href="mailto:inteliarstack.ia@gmail.com?subject=Quiero%20contratar%20Inteliar%20Labels"
        className={cn(
          "block text-center rounded-md px-2 py-1 font-medium transition-colors",
          expired
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-amber-500 text-white hover:bg-amber-600"
        )}
      >
        Contactar para contratar
      </a>
    </div>
  )
}
