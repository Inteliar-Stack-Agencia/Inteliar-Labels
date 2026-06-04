import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertCircle, Printer } from "lucide-react"

type JobStatus = "completed" | "pending" | "error"

interface RecentJob {
  id: string
  templateName: string
  labelCount: number
  status: JobStatus
  timestamp: string
}

const mockRecentJobs: RecentJob[] = [
  {
    id: "1",
    templateName: "Etiqueta de Producto A",
    labelCount: 150,
    status: "completed",
    timestamp: "hace 2 minutos",
  },
  {
    id: "2",
    templateName: "Etiqueta de Envío",
    labelCount: 45,
    status: "pending",
    timestamp: "hace 15 minutos",
  },
  {
    id: "3",
    templateName: "Etiqueta de Código de Barras",
    labelCount: 200,
    status: "completed",
    timestamp: "hace 1 hora",
  },
  {
    id: "4",
    templateName: "Etiqueta QR",
    labelCount: 80,
    status: "error",
    timestamp: "hace 2 horas",
  },
  {
    id: "5",
    templateName: "Etiqueta de Inventario",
    labelCount: 320,
    status: "completed",
    timestamp: "hace 3 horas",
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
  error: {
    icon: AlertCircle,
    label: "Error",
    className: "text-destructive bg-destructive/10",
  },
}

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-card-foreground">
          Actividad reciente
        </h2>
        <span className="text-sm text-muted-foreground">Últimas 24 horas</span>
      </div>

      <div className="divide-y divide-border">
        {mockRecentJobs.map((job) => {
          const status = statusConfig[job.status]
          const StatusIcon = status.icon

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
                  {job.templateName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.labelCount} etiquetas
                </p>
              </div>

              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  status.className
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {job.timestamp}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
