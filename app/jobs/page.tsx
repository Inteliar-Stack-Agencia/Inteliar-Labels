"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  RefreshCw,
  Trash2,
  Eye,
  Inbox,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type JobStatus = "completed" | "pending" | "processing" | "failed"

interface PrintJob {
  id: string
  name: string
  total_labels: number
  printed_labels: number
  status: JobStatus
  printer_name: string | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

const statusConfig: Record<JobStatus, { icon: React.ElementType; label: string; className: string }> = {
  completed: { icon: CheckCircle2, label: "Completado", className: "text-success bg-success/10" },
  pending: { icon: Clock, label: "Pendiente", className: "text-warning bg-warning/10" },
  processing: { icon: RefreshCw, label: "Procesando", className: "text-primary bg-primary/10" },
  failed: { icon: XCircle, label: "Error", className: "text-destructive bg-destructive/10" },
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

export default function PrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("print_jobs")
        .select("id, name, total_labels, printed_labels, status, printer_name, created_at, completed_at, error_message")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setJobs((data as PrintJob[]) ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const total = jobs.length
  const completed = jobs.filter((j) => j.status === "completed").length
  const inProgress = jobs.filter((j) => j.status === "processing" || j.status === "pending").length
  const failed = jobs.filter((j) => j.status === "failed").length

  return (
    <DashboardLayout>
      <Header
        title="Trabajos de impresión"
        description="Monitoreá y gestioná los trabajos de impresión"
        actions={
          <Link href="/upload">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo trabajo
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: "Trabajos totales", value: total, color: "text-foreground" },
            { label: "Completados", value: completed, color: "text-success" },
            { label: "En progreso", value: inProgress, color: "text-primary" },
            { label: "Fallidos", value: failed, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("mt-1 text-2xl font-semibold", stat.color)}>
                {loading ? "…" : stat.value}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Cargando trabajos…
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No hay trabajos todavía</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Creá un nuevo trabajo de impresión para comenzar
            </p>
          </div>
        ) : (
          /* Jobs Table */
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Trabajo</th>
                  <th className="px-6 py-4 font-medium">Etiquetas</th>
                  <th className="px-6 py-4 font-medium">Impresora</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Creado</th>
                  <th className="px-6 py-4 font-medium sr-only">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => {
                  const statusKey = (job.status in statusConfig ? job.status : "pending") as JobStatus
                  const status = statusConfig[statusKey]
                  const StatusIcon = status.icon

                  return (
                    <tr key={job.id} className="group transition-colors hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-card-foreground">
                            {job.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trabajo #{job.id.slice(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-card-foreground">
                          {job.printed_labels > 0
                            ? `${job.printed_labels} / ${job.total_labels}`
                            : `${job.total_labels}`}{" "}
                          etiquetas
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {job.printer_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span
                            className={cn(
                              "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                              status.className
                            )}
                          >
                            <StatusIcon className={cn(
                              "h-3.5 w-3.5",
                              job.status === "processing" && "animate-spin"
                            )} />
                            {status.label}
                          </span>
                          {job.status === "processing" && job.total_labels > 0 && (
                            <div className="w-24">
                              <div className="h-1.5 rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${Math.round((job.printed_labels / job.total_labels) * 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {Math.round((job.printed_labels / job.total_labels) * 100)}% completado
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground">
                            {formatDateTime(job.created_at)}
                          </p>
                          {job.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              Completado: {formatDateTime(job.completed_at)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            {job.status === "failed" && (
                              <DropdownMenuItem>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reintentar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
