"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type JobStatus = "completed" | "pending" | "printing" | "error"

interface PrintJob {
  id: string
  templateName: string
  labelCount: number
  status: JobStatus
  createdAt: string
  completedAt?: string
  printer: string
  progress?: number
}

const mockJobs: PrintJob[] = [
  {
    id: "1",
    templateName: "Etiqueta de Producto A",
    labelCount: 150,
    status: "printing",
    createdAt: "2024-01-18 14:30",
    printer: "Zebra ZD420",
    progress: 67,
  },
  {
    id: "2",
    templateName: "Etiqueta de Envío",
    labelCount: 45,
    status: "pending",
    createdAt: "2024-01-18 14:25",
    printer: "Honeywell PC42",
  },
  {
    id: "3",
    templateName: "Etiqueta de Código de Barras",
    labelCount: 200,
    status: "completed",
    createdAt: "2024-01-18 13:00",
    completedAt: "2024-01-18 13:05",
    printer: "Zebra ZD420",
  },
  {
    id: "4",
    templateName: "Etiqueta QR",
    labelCount: 80,
    status: "error",
    createdAt: "2024-01-18 12:30",
    printer: "Agente local de impresión",
  },
  {
    id: "5",
    templateName: "Etiqueta de Inventario",
    labelCount: 320,
    status: "completed",
    createdAt: "2024-01-18 10:00",
    completedAt: "2024-01-18 10:12",
    printer: "Zebra ZD420",
  },
  {
    id: "6",
    templateName: "Etiqueta de Precio",
    labelCount: 100,
    status: "completed",
    createdAt: "2024-01-17 16:45",
    completedAt: "2024-01-17 16:48",
    printer: "Honeywell PC42",
  },
]

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completado",
    className: "text-success bg-success/10",
  },
  pending: {
    icon: Clock,
    label: "Pendiente",
    className: "text-warning bg-warning/10",
  },
  printing: {
    icon: RefreshCw,
    label: "Imprimiendo",
    className: "text-primary bg-primary/10",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: "text-destructive bg-destructive/10",
  },
}

export default function PrintJobsPage() {
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
            { label: "Trabajos totales", value: mockJobs.length, color: "text-foreground" },
            { label: "Completados", value: mockJobs.filter((j) => j.status === "completed").length, color: "text-success" },
            { label: "En progreso", value: mockJobs.filter((j) => j.status === "printing" || j.status === "pending").length, color: "text-primary" },
            { label: "Fallidos", value: mockJobs.filter((j) => j.status === "error").length, color: "text-destructive" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("mt-1 text-2xl font-semibold", stat.color)}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Jobs Table */}
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
              {mockJobs.map((job) => {
                const status = statusConfig[job.status]
                const StatusIcon = status.icon

                return (
                  <tr key={job.id} className="group transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-card-foreground">
                          {job.templateName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trabajo #{job.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-card-foreground">
                        {job.labelCount} etiquetas
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {job.printer}
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
                            job.status === "printing" && "animate-spin"
                          )} />
                          {status.label}
                        </span>
                        {job.status === "printing" && job.progress && (
                          <div className="w-24">
                            <div className="h-1.5 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {job.progress}% completado
                            </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-card-foreground">
                          {job.createdAt}
                        </p>
                        {job.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            Completado: {job.completedAt}
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
                          {job.status === "error" && (
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
      </div>
    </DashboardLayout>
  )
}
