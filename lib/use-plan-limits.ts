"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const TRIAL_DAYS = 15
const TRIAL_LABELS = 500
const MONTHLY_LABELS_MAX = 2000

export interface PlanLimits {
  plan: "trial" | "expired" | "monthly" | "pro" | "lifetime"
  // Trial
  trialDaysLeft: number
  trialLabelsLeft: number
  trialLabelsUsed: number
  trialExpired: boolean
  // Monthly
  labelsThisMonth: number
  labelsMonthMax: number
  // Common
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
    labelsThisMonth: 0,
    labelsMonthMax: Infinity,
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
        const plan = licenseData.plan as "monthly" | "pro" | "lifetime"

        if (plan === "monthly") {
          // Check monthly label usage
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { data: monthJobs } = await supabase
            .from("print_jobs")
            .select("total_labels")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("created_at", startOfMonth.toISOString())

          const labelsThisMonth = (monthJobs ?? []).reduce(
            (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
            0
          )

          setLimits({
            plan,
            trialDaysLeft: 0,
            trialLabelsLeft: 0,
            trialLabelsUsed: 0,
            trialExpired: false,
            labelsThisMonth,
            labelsMonthMax: MONTHLY_LABELS_MAX,
            canCreateTemplate: true,
            canPrint: labelsThisMonth < MONTHLY_LABELS_MAX,
            loading: false,
          })
          return
        }

        // pro / lifetime — unlimited
        setLimits({
          plan,
          trialDaysLeft: 0,
          trialLabelsLeft: 0,
          trialLabelsUsed: 0,
          trialExpired: false,
          labelsThisMonth: 0,
          labelsMonthMax: Infinity,
          canCreateTemplate: true,
          canPrint: true,
          loading: false,
        })
        return
      }

      // No license — check trial (with possible admin extension)
      const { data: extension } = await supabase
        .from("trial_extensions")
        .select("extra_days")
        .eq("user_id", user.id)
        .maybeSingle()

      const extraDays = extension?.extra_days ?? 0

      const { data: allJobs } = await supabase
        .from("print_jobs")
        .select("total_labels")
        .eq("user_id", user.id)
        .eq("status", "completed")

      const totalLabelsUsed = (allJobs ?? []).reduce(
        (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
        0
      )

      const daysElapsed = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysLeft = Math.max(0, TRIAL_DAYS + extraDays - daysElapsed)
      const labelsLeft = Math.max(0, TRIAL_LABELS - totalLabelsUsed)
      const trialExpired = daysLeft === 0 || labelsLeft === 0

      setLimits({
        plan: trialExpired ? "expired" : "trial",
        trialDaysLeft: daysLeft,
        trialLabelsLeft: labelsLeft,
        trialLabelsUsed: totalLabelsUsed,
        trialExpired,
        labelsThisMonth: 0,
        labelsMonthMax: Infinity,
        canCreateTemplate: !trialExpired,
        canPrint: !trialExpired,
        loading: false,
      })
    }

    load()
  }, [])

  return limits
}
