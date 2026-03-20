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
    templateName: "Product Label A",
    labelCount: 150,
    status: "completed",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    templateName: "Shipping Label",
    labelCount: 45,
    status: "pending",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    templateName: "Barcode Label",
    labelCount: 200,
    status: "completed",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    templateName: "QR Code Label",
    labelCount: 80,
    status: "error",
    timestamp: "2 hours ago",
  },
  {
    id: "5",
    templateName: "Inventory Tag",
    labelCount: 320,
    status: "completed",
    timestamp: "3 hours ago",
  },
]

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "text-success bg-success/10",
  },
  pending: {
    icon: Clock,
    label: "Pending",
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
          Recent Activity
        </h2>
        <span className="text-sm text-muted-foreground">Last 24 hours</span>
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
                  {job.labelCount} labels
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
