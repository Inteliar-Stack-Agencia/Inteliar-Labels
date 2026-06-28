"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const TRIAL_DAYS = 15

export interface PlanLimits {
  plan: "trial" | "expired" | "monthly" | "lifetime"
  trialDaysLeft: number
  trialExpired: boolean
  canCreateTemplate: boolean
  canPrint: boolean
  loading: boolean
}

export function usePlanLimits(): PlanLimits {
  const [limits, setLimits] = useState<PlanLimits>({
    plan: "trial",
    trialDaysLeft: TRIAL_DAYS,
    trialExpired: false,
    canCreateTemplate: true,
    canPrint: true,
    loading: true,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: licenseData } = await supabase
        .from("licenses")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const hasActiveLicense =
        licenseData &&
        licenseData.status === "active" &&
        (!licenseData.expires_at || new Date(licenseData.expires_at) > new Date())

      if (hasActiveLicense) {
        setLimits({
          plan: licenseData.plan as "monthly" | "lifetime",
          trialDaysLeft: 0,
          trialExpired: false,
          canCreateTemplate: true,
          canPrint: true,
          loading: false,
        })
        return
      }

      // No license — check trial window
      const registeredAt = new Date(user.created_at)
      const now = new Date()
      const msElapsed = now.getTime() - registeredAt.getTime()
      const daysElapsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24))
      const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed)
      const trialExpired = daysLeft === 0

      setLimits({
        plan: trialExpired ? "expired" : "trial",
        trialDaysLeft: daysLeft,
        trialExpired,
        canCreateTemplate: !trialExpired,
        canPrint: !trialExpired,
        loading: false,
      })
    }

    load()
  }, [])

  return limits
}
