"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Printer,
  Tag,
  Activity,
  RefreshCw,
  Wifi,
  Usb,
  Cable,
  FlaskConical,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { getPrinterAgentLog, type AgentLogEntry } from "@/lib/printer-agent-client"

interface CompletedJob {
  id: string
  name: string
  total_labels: number
  printed_labels: number
  completed_at: string | null
  created_at: string
  status: string
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type HistoryView = "jobs" | "agent"

function modeIcon(mode: string) {
  if (mode === "tcp") return <Wifi className="h-4 w-4" />
  if (mode === "usb") return <Usb className="h-4 w-4" />
  if (mode === "serial") return <Cable className="h-4 w-4" />
  return <FlaskConical className="h-4 w-4" />
}

export default function HistoryPage() {
  const [view, setView] = useState<HistoryView>("jobs")
  const [dateFilter, setDateFilter] = useState("all")
  const [jobs, setJobs] = useState<CompletedJob[]>([])
  const [loading, setLoading] = useState(true)

  // Agent log
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([])
  const [loadingAgent, setLoadingAgent] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadAgentLog() {
    setLoadingAgent(true)
    setAgentError(null)
    try {
      const log = await getPrinterAgentLog()
      setAgentLog(log)
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Agente no disponible")
      setAgentLog([])
    } finally {
      setLoadingAgent(false)
    }
  }

  useEffect(() => {
    if (view === "agent") loadAgentLog()
  }, [view])

  async function loadHistory() {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("print_jobs")
        .select("id, name, total_labels, printed_labels, completed_at, created_at, status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
      setJobs(data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (dateFilter === "all") return true
    const ref = job.completed_at ?? job.created_at
    const date = new Date(ref)
    const now = new Date()
    if (dateFilter === "today") {
      return date.toDateString() === now.toDateString()
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      return date >= weekAgo
    }
    if (dateFilter === "month") {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      return date >= monthAgo
    }
    return true
  })

  const totalLabels = filteredJobs.reduce((sum, j) => sum + (j.total_labels ?? 0), 0)

  return (
    <DashboardLayout>
      <Header
        title="Historial"
        description="Registro de trabajos de impresión completados"
      />

      <div className="p-6">
        {/* View toggle */}
        <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setView("jobs")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "jobs" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Tag className="h-4 w-4" />
            Trabajos completados
          </button>
          <button
            onClick={() => setView("agent")}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === "agent" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="h-4 w-4" />
            Actividad del agente
          </button>
        </div>

        {/* ── AGENT ACTIVITY VIEW ── */}
        {view === "agent" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Últimos trabajos enviados al agente local (en memoria, se reinicia al cerrar el agente)
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={loadAgentLog}
                disabled={loadingAgent}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingAgent && "animate-spin")} />
                Actualizar
              </Button>
            </div>

            {loadingAgent ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Cargando actividad…</div>
            ) : agentError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <Activity className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-foreground">Agente no disponible</p>
                <p className="mt-1 text-xs text-muted-foreground">{agentError}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Abrí la app <strong>Inteliar Printer Agent</strong> en tu PC (ícono de la bandeja del sistema) o{" "}
                  <a href="/api/download/agent" className="underline hover:text-foreground">descargala acá</a>
                </p>
              </div>
            ) : agentLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <Activity className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Sin actividad registrada todavía</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Impresora</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Conexión</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Etiquetas</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Formato</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {agentLog.map((entry, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                          <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                            {formatDateTime(entry.timestamp)}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {entry.printerName ?? entry.printer ?? "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              {modeIcon(entry.mode)}
                              <span className="text-xs uppercase">{entry.mode}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-foreground">{entry.labels}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                              {entry.format}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center">
                              {entry.status === "ok" ? (
                                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> OK
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" title={entry.error}>
                                  <XCircle className="h-3.5 w-3.5" /> Error
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
        <>
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Trabajos completados</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {loading ? "…" : filteredJobs.length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Etiquetas impresas</p>
            <p className="mt-1 text-2xl font-semibold text-success">
              {loading ? "…" : totalLabels.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            {loading ? "Cargando…" : `${filteredJobs.length} trabajos`}
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Cargando historial…
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <Printer className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No hay trabajos completados</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aquí aparecerán los trabajos una vez que se completen
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {filteredJobs.map((job, index) => {
                const isLast = index === filteredJobs.length - 1
                const dateStr = job.completed_at ?? job.created_at

                return (
                  <div key={job.id} className="flex gap-4 p-6">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                        <Printer className="h-5 w-5" />
                      </div>
                      {!isLast && (
                        <div className="mt-2 h-full w-px bg-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-card-foreground">
                              {job.name}
                            </p>
                            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              completado
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <Tag className="h-3.5 w-3.5" />
                            {job.total_labels} etiquetas impresas
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(dateStr)}
                          </p>
                          <Link href={`/jobs/${job.id}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 h-8">
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reimprimir
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
