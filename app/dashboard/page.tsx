"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Tag, Printer, FileStack, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface RecentJob {
  id: string
  name: string
  status: string
  total_labels: number
  created_at: string
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  completed: { icon: CheckCircle2, label: "Completado", className: "text-success bg-success/10" },
  pending: { icon: Clock, label: "Pendiente", className: "text-warning bg-warning/10" },
  processing: { icon: Clock, label: "Procesando", className: "text-primary bg-primary/10" },
  failed: { icon: AlertCircle, label: "Error", className: "text-destructive bg-destructive/10" },
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "hace un momento"
  if (mins < 60) return `hace ${mins} minuto${mins > 1 ? "s" : ""}`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} hora${hrs > 1 ? "s" : ""}`
  const days = Math.floor(hrs / 24)
  return `hace ${days} día${days > 1 ? "s" : ""}`
}

export default function DashboardPage() {
  const [labelsTodayCount, setLabelsTodayCount] = useState<number | null>(null)
  const [totalJobs, setTotalJobs] = useState<number | null>(null)
  const [totalTemplates, setTotalTemplates] = useState<number | null>(null)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
          { data: todayJobs },
          { count: jobsCount },
          { count: templatesCount },
          { data: recent },
        ] = await Promise.all([
          supabase
            .from("print_jobs")
            .select("total_labels")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("created_at", today.toISOString()),
          supabase
            .from("print_jobs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("templates")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("print_jobs")
            .select("id, name, status, total_labels, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ])

        const labelsToday = (todayJobs ?? []).reduce(
          (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
          0
        )

        setLabelsTodayCount(labelsToday)
        setTotalJobs(jobsCount ?? 0)
        setTotalTemplates(templatesCount ?? 0)
        setRecentJobs(recent ?? [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <DashboardLayout>
      <Header
        title="Panel"
        description="Resumen de tu actividad de impresión de etiquetas"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard
            title="Etiquetas impresas hoy"
            value={loading ? "…" : (labelsTodayCount ?? 0).toLocaleString("es-AR")}
            change="Trabajos completados hoy"
            changeType="positive"
            icon={Tag}
          />
          <KpiCard
            title="Trabajos totales"
            value={loading ? "…" : (totalJobs ?? 0)}
            change="Todos tus trabajos"
            changeType="neutral"
            icon={Printer}
          />
          <KpiCard
            title="Templates activos"
            value={loading ? "…" : (totalTemplates ?? 0)}
            change="Plantillas creadas"
            changeType="positive"
            icon={FileStack}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-card-foreground">
              Actividad reciente
            </h2>
            <span className="text-sm text-muted-foreground">Últimos 5 trabajos</span>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Cargando actividad…
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No hay actividad reciente
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentJobs.map((job) => {
                const cfg = statusConfig[job.status] ?? statusConfig["pending"]
                const StatusIcon = cfg.icon
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Printer className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {job.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.total_labels} etiquetas
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        cfg.className
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelative(job.created_at)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
