"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Tag, Printer, FileStack, CheckCircle2, Clock, AlertCircle, Rocket, X, Timer } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { usePlanLimits } from "@/lib/use-plan-limits"

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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const planLimits = usePlanLimits()

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

        // Show onboarding if user has no templates and no jobs yet
        if ((templatesCount ?? 0) === 0 && (jobsCount ?? 0) === 0) {
          const dismissed = localStorage.getItem("onboarding_dismissed")
          if (!dismissed) setShowOnboarding(true)
        }
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

        {/* Onboarding banner */}
        {showOnboarding && (
          <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-5">
            <button
              onClick={() => { setShowOnboarding(false); localStorage.setItem("onboarding_dismissed", "1") }}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <p className="font-semibold text-foreground">Bienvenido a Inteliar Labels</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Seguí estos pasos para imprimir tu primera etiqueta:</p>
                </div>
                <ol className="space-y-1.5 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold flex-shrink-0">1</span>
                    <Link href="/templates/new" className="text-primary hover:underline font-medium">Creá una plantilla</Link>
                    <span className="text-muted-foreground">— definí el diseño de la etiqueta</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold flex-shrink-0">2</span>
                    <Link href="/upload" className="text-primary hover:underline font-medium">Cargá tu Excel</Link>
                    <span className="text-muted-foreground">— subí la lista de datos a imprimir</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold flex-shrink-0">3</span>
                    <Link href="/settings" className="text-primary hover:underline font-medium">Configurá tu impresora</Link>
                    <span className="text-muted-foreground">— conectá el agente de impresión</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold flex-shrink-0">4</span>
                    <Link href="/imprimir" className="text-primary hover:underline font-medium">Imprimí</Link>
                    <span className="text-muted-foreground">— seleccioná plantilla y lanzá el trabajo</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {!planLimits.loading && (planLimits.plan === "trial" || planLimits.plan === "expired") && (
          <div className={cn(
            "flex items-center justify-between gap-4 rounded-xl border px-5 py-4",
            planLimits.trialExpired
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : planLimits.trialDaysLeft <= 3
                ? "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                : "border-border bg-muted/40 text-muted-foreground"
          )}>
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {planLimits.trialExpired
                  ? "Tu trial de 15 días venció. Activá una licencia para seguir usando Inteliar Labels."
                  : `Trial gratuito activo · ${planLimits.trialDaysLeft} día${planLimits.trialDaysLeft !== 1 ? "s" : ""} restante${planLimits.trialDaysLeft !== 1 ? "s" : ""}`}
              </span>
            </div>
            <a
              href="/#pricing"
              className="text-sm font-semibold underline underline-offset-2 whitespace-nowrap"
            >
              {planLimits.trialExpired ? "Activar licencia" : "Ver planes"}
            </a>
          </div>
        )}

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
