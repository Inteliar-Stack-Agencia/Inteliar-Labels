"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PlanLimits {
  plan: "free" | "monthly" | "lifetime"
  templatesUsed: number
  templatesMax: number
  labelsThisMonth: number
  labelsMax: number
  canCreateTemplate: boolean
  canPrint: boolean
  loading: boolean
}

const FREE_TEMPLATES = 3
const FREE_LABELS_MONTH = 50

export function usePlanLimits(): PlanLimits {
  const [limits, setLimits] = useState<PlanLimits>({
    plan: "free",
    templatesUsed: 0,
    templatesMax: FREE_TEMPLATES,
    labelsThisMonth: 0,
    labelsMax: FREE_LABELS_MONTH,
    canCreateTemplate: true,
    canPrint: true,
    loading: true,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [
        { data: licenseData },
        { count: templatesCount },
        { data: jobsThisMonth },
      ] = await Promise.all([
        supabase
          .from("licenses")
          .select("plan, status, expires_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("templates")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("print_jobs")
          .select("total_labels")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("created_at", startOfMonth.toISOString()),
      ])

      const hasActiveLicense =
        licenseData &&
        licenseData.status === "active" &&
        (!licenseData.expires_at || new Date(licenseData.expires_at) > new Date())

      const plan: "free" | "monthly" | "lifetime" = hasActiveLicense
        ? (licenseData.plan as "monthly" | "lifetime")
        : "free"

      const labelsThisMonth = (jobsThisMonth ?? []).reduce(
        (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
        0
      )

      const tplUsed = templatesCount ?? 0

      if (plan === "free") {
        setLimits({
          plan,
          templatesUsed: tplUsed,
          templatesMax: FREE_TEMPLATES,
          labelsThisMonth,
          labelsMax: FREE_LABELS_MONTH,
          canCreateTemplate: tplUsed < FREE_TEMPLATES,
          canPrint: labelsThisMonth < FREE_LABELS_MONTH,
          loading: false,
        })
      } else {
        setLimits({
          plan,
          templatesUsed: tplUsed,
          templatesMax: Infinity,
          labelsThisMonth,
          labelsMax: Infinity,
          canCreateTemplate: true,
          canPrint: true,
          loading: false,
        })
      }
    }

    load()
  }, [])

  return limits
}
