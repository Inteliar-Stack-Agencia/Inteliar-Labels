"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const TRIAL_DAYS = 15
const TRIAL_LABELS = 500

export interface PlanLimits {
  plan: "trial" | "expired" | "monthly" | "lifetime"
  trialDaysLeft: number
  trialLabelsLeft: number
  trialLabelsUsed: number
  trialExpired: boolean
  canCreateTemplate: boolean
  canPrint: boolean
  loading: boolean
}

export function usePlanLimits(): PlanLimits {
  const [limits, setLimits] = useState<PlanLimits>({
    plan: "trial",
    trialDaysLeft: TRIAL_DAYS,
    trialLabelsLeft: TRIAL_LABELS,
    trialLabelsUsed: 0,
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
          trialLabelsLeft: Infinity,
          trialLabelsUsed: 0,
          trialExpired: false,
          canCreateTemplate: true,
          canPrint: true,
          loading: false,
        })
        return
      }

      // Count all labels ever printed during trial
      const { data: allJobs } = await supabase
        .from("print_jobs")
        .select("total_labels")
        .eq("user_id", user.id)
        .eq("status", "completed")

      const totalLabelsUsed = (allJobs ?? []).reduce(
        (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
        0
      )

      // Check days elapsed
      const registeredAt = new Date(user.created_at)
      const now = new Date()
      const daysElapsed = Math.floor((now.getTime() - registeredAt.getTime()) / (1000 * 60 * 60 * 24))
      const daysLeft = Math.max(0, TRIAL_DAYS - daysElapsed)

      const labelsLeft = Math.max(0, TRIAL_LABELS - totalLabelsUsed)

      // Trial expires when either limit is hit
      const trialExpired = daysLeft === 0 || labelsLeft === 0

      setLimits({
        plan: trialExpired ? "expired" : "trial",
        trialDaysLeft: daysLeft,
        trialLabelsLeft: labelsLeft,
        trialLabelsUsed: totalLabelsUsed,
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
