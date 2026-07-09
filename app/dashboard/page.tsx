"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Tag, Printer, FileStack, CheckCircle2, Circle, Clock, AlertCircle, Rocket, X, Timer, Download, Loader2, ShieldCheck, ArrowRight, MessageCircle, Star, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { usePlanLimits } from "@/lib/use-plan-limits"
import { checkPrinterAgent } from "@/lib/printer-agent-client"
import { analytics } from "@/lib/analytics"

const AGENT_DOWNLOAD_URL = "https://github.com/Inteliar-Stack-Agencia/Inteliar-Labels/releases/latest/download/InteliarPrinterAgent.exe"

interface RecentJob {
  id: string
  name: string
  status: string
  total_labels: number
  created_at: string
}

interface Favorite {
  id: string
  name: string
  total_labels: number
  use_count: number
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
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [hideOnboarding, setHideOnboarding] = useState(false)
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const [feedbackDismissed, setFeedbackDismissed] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [announcement, setAnnouncement] = useState<{ id: string; title: string; body: string | null; cta_label: string | null; cta_url: string | null; variant: string } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const planLimits = usePlanLimits()

  async function handleCheckout(plan: "monthly" | "pro" | "lifetime") {
    setCheckoutLoading(plan)
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      window.location.href = "https://wa.me/5491165689145?text=Hola%2C%20quiero%20comprar%20una%20licencia"
    } finally {
      setCheckoutLoading(null)
    }
  }

  useEffect(() => {
    // Vincular licencias compradas con el email del usuario
    fetch("/api/license/link", { method: "POST" }).catch(() => {})
    // Feedback banner dismissal (persisted locally)
    setFeedbackDismissed(localStorage.getItem("feedback_banner_dismissed") === "1")
    // Admin announcement (dismissible per announcement id)
    fetch("/api/announcements")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const a = d?.announcement
        if (a && localStorage.getItem(`announcement_dismissed_${a.id}`) !== "1") setAnnouncement(a)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserEmail(user.email ?? "")

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [
          { data: todayJobs },
          { count: jobsCount },
          { count: templatesCount },
          { data: recent },
          { data: favs },
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
          supabase
            .from("print_favorites")
            .select("id, name, total_labels, use_count")
            .eq("user_id", user.id)
            .order("use_count", { ascending: false })
            .limit(6),
        ])

        const labelsToday = (todayJobs ?? []).reduce(
          (sum: number, j: { total_labels: number }) => sum + (j.total_labels ?? 0),
          0
        )

        setLabelsTodayCount(labelsToday)
        setTotalJobs(jobsCount ?? 0)
        setTotalTemplates(templatesCount ?? 0)
        setRecentJobs(recent ?? [])
        setFavorites(favs ?? [])

        // Detect whether the print agent is running (for the onboarding step)
        checkPrinterAgent().then(() => setAgentOnline(true)).catch(() => setAgentOnline(false))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function deleteFavorite(id: string) {
    const supabase = createClient()
    await supabase.from("print_favorites").delete().eq("id", id)
    setFavorites((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <DashboardLayout>
      <Header
        title="Panel"
        description="Resumen de tu actividad de impresión de etiquetas"
      />

      <div className="p-6 space-y-6">

        {/* Onboarding checklist — auto-ticks as the user completes each step */}
        {!loading && !hideOnboarding && (() => {
          const steps = [
            { key: "tpl", label: "Creá tu primera plantilla", help: "Diseñá el formato de tu etiqueta", href: "/templates/new", cta: "Crear plantilla", done: (totalTemplates ?? 0) > 0 },
            { key: "agent", label: "Descargá e instalá el agente", help: "Necesario para enviar a tu impresora térmica", href: AGENT_DOWNLOAD_URL, cta: "Descargar agente", done: agentOnline === true || (totalJobs ?? 0) > 0, external: true },
            { key: "print", label: "Imprimí tu primera etiqueta", help: "Cargá datos (o usá 'Imprimir') y enviá a la impresora", href: "/imprimir", cta: "Imprimir", done: (totalJobs ?? 0) > 0 },
          ]
          const doneCount = steps.filter((s) => s.done).length
          if (doneCount === steps.length) return null
          const nextStep = steps.find((s) => !s.done)
          return (
            <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-5">
              <button
                onClick={() => setHideOnboarding(true)}
                className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
                title="Ocultar por ahora"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <p className="font-semibold text-foreground">Primeros pasos · {doneCount} de {steps.length} completados</p>
                    <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-primary/15 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {steps.map((s) => (
                      <li key={s.key} className="flex items-center gap-2.5">
                        {s.done
                          ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                          : <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <span className={cn("text-sm font-medium", s.done ? "text-muted-foreground line-through" : "text-foreground")}>{s.label}</span>
                          {!s.done && <span className="block text-xs text-muted-foreground">{s.help}</span>}
                        </div>
                        {!s.done && nextStep?.key === s.key && (
                          s.external ? (
                            <a href={s.href} onClick={() => analytics.agentDownloaded()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                              {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Link href={s.href} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                              {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    ¿Dudas? Mirá la <Link href="/ayuda" className="text-primary hover:underline">guía de ayuda</Link>.
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Admin announcement banner */}
        {announcement && (
          <div className={cn(
            "relative rounded-xl border px-5 py-4",
            announcement.variant === "promo" ? "border-amber-500/40 bg-amber-500/10"
              : announcement.variant === "success" ? "border-green-500/40 bg-green-500/10"
              : "border-primary/30 bg-primary/5"
          )}>
            <div className="flex items-start gap-3 pr-6">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                {announcement.body && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{announcement.body}</p>}
                {announcement.cta_url && (
                  <a
                    href={announcement.cta_url}
                    target={announcement.cta_url.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {announcement.cta_label || "Ver más"} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => { localStorage.setItem(`announcement_dismissed_${announcement.id}`, "1"); setAnnouncement(null) }}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Feedback / suggestions banner */}
        {!feedbackDismissed && (
          <div className="relative rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <MessageCircle className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <p className="text-sm font-medium text-foreground">¿Cómo venís con el sistema?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ¿Te falta alguna plantilla especial o tenés una sugerencia? Escribinos y te ayudamos.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/5491165689145?text=${encodeURIComponent(
                      `Hola! 👋 Te escribo desde *Inteliar Labels*${userEmail ? ` (${userEmail})` : ""}.\n` +
                      `Quería comentarte / necesito una plantilla especial: `
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#20bd5a] transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Escribinos por WhatsApp
                  </a>
                  <button
                    onClick={() => { setFeedbackDismissed(true); localStorage.setItem("feedback_banner_dismissed", "1") }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    No mostrar más
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setFeedbackDismissed(true); localStorage.setItem("feedback_banner_dismissed", "1") }}
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:text-foreground"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active license banner */}
        {!planLimits.loading && !["trial", "expired"].includes(planLimits.plan) && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Licencia activa —{" "}
                  {planLimits.plan === "lifetime" ? "De por vida" : planLimits.plan === "pro" ? "Pro" : "Mensual"}
                </p>
                {planLimits.expiresAt && (
                  <p className="text-xs text-green-600/80 dark:text-green-500/80">
                    Vence el {new Date(planLimits.expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    {planLimits.plan === "monthly" ? " · Se renueva automáticamente" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {!planLimits.loading && (planLimits.plan === "trial" || planLimits.plan === "expired") && (
          <div className={cn(
            "rounded-xl border px-5 py-4 space-y-4",
            planLimits.trialExpired
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : planLimits.trialDaysLeft <= 3 || planLimits.trialLabelsLeft <= 50
                ? "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                : "border-border bg-muted/40 text-muted-foreground"
          )}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {planLimits.trialExpired
                    ? "Tu trial venció. Activá una licencia para seguir usando Inteliar Labels."
                    : `Trial gratuito · ${planLimits.trialDaysLeft} día${planLimits.trialDaysLeft !== 1 ? "s" : ""} restante${planLimits.trialDaysLeft !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>

            {/* Counters */}
            {!planLimits.trialExpired && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Impresiones usadas</span>
                    <span>{planLimits.trialLabelsUsed} / 500</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-current/20 overflow-hidden">
                    <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.min(100, (planLimits.trialLabelsUsed / 500) * 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Días transcurridos</span>
                    <span>{15 - planLimits.trialDaysLeft} / 15</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-current/20 overflow-hidden">
                    <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.min(100, ((15 - planLimits.trialDaysLeft) / 15) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Checkout buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleCheckout("monthly")}
                disabled={checkoutLoading !== null}
                className="flex items-center gap-1.5 rounded-lg bg-current/10 hover:bg-current/20 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {checkoutLoading === "monthly" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Mensual · US$10/mes
              </button>
              <button
                onClick={() => handleCheckout("pro")}
                disabled={checkoutLoading !== null}
                className="flex items-center gap-1.5 rounded-lg bg-current/20 hover:bg-current/30 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {checkoutLoading === "pro" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Pro · US$19/mes
              </button>
              <button
                onClick={() => handleCheckout("lifetime")}
                disabled={checkoutLoading !== null}
                className="flex items-center gap-1.5 rounded-lg bg-current/10 hover:bg-current/20 px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {checkoutLoading === "lifetime" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                De por vida · US$300
              </button>
            </div>
          </div>
        )}

        {/* Download agent banner */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Agente de impresión para Windows</p>
              <p className="text-xs text-muted-foreground">Necesario para enviar a tu impresora térmica · Última versión · Windows 10/11</p>
            </div>
          </div>
          <a
            href={AGENT_DOWNLOAD_URL}
            onClick={() => analytics.agentDownloaded()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar .exe
          </a>
        </div>

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

        {/* Favorites — one click to reprint the same thing every day */}
        {favorites.length > 0 && (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Impresiones frecuentes
              </h2>
              <span className="text-sm text-muted-foreground">Un clic y listo</span>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="group relative flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary transition-colors"
                >
                  <Link href={`/imprimir?favorite=${fav.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{fav.name}</p>
                      <p className="text-xs text-muted-foreground">{fav.total_labels} etiquetas</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => deleteFavorite(fav.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
