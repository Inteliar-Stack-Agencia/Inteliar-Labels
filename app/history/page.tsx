"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  FileStack,
  Printer,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HistoryEntry {
  id: string
  type: "print" | "template" | "upload"
  action: string
  details: string
  timestamp: string
  status?: "success" | "error"
  user: string
}

const mockHistory: HistoryEntry[] = [
  {
    id: "1",
    type: "print",
    action: "Print job completed",
    details: "150 labels printed using Product Label A",
    timestamp: "2024-01-18 14:35",
    status: "success",
    user: "John Doe",
  },
  {
    id: "2",
    type: "upload",
    action: "Data uploaded",
    details: "products_batch_01.xlsx - 500 rows",
    timestamp: "2024-01-18 14:30",
    status: "success",
    user: "John Doe",
  },
  {
    id: "3",
    type: "template",
    action: "Template created",
    details: "New template: Shipping Label v2",
    timestamp: "2024-01-18 13:15",
    status: "success",
    user: "Jane Smith",
  },
  {
    id: "4",
    type: "print",
    action: "Print job failed",
    details: "Connection lost to Zebra ZD420",
    timestamp: "2024-01-18 12:30",
    status: "error",
    user: "John Doe",
  },
  {
    id: "5",
    type: "print",
    action: "Print job completed",
    details: "200 labels printed using Barcode Label",
    timestamp: "2024-01-18 10:05",
    status: "success",
    user: "Jane Smith",
  },
  {
    id: "6",
    type: "template",
    action: "Template modified",
    details: "Updated: Product Label A",
    timestamp: "2024-01-17 16:00",
    status: "success",
    user: "John Doe",
  },
  {
    id: "7",
    type: "print",
    action: "Print job completed",
    details: "320 labels printed using Inventory Tag",
    timestamp: "2024-01-17 15:30",
    status: "success",
    user: "Jane Smith",
  },
  {
    id: "8",
    type: "upload",
    action: "Data uploaded",
    details: "inventory_update.csv - 1200 rows",
    timestamp: "2024-01-17 14:00",
    status: "success",
    user: "John Doe",
  },
]

const typeIcons = {
  print: Printer,
  template: FileStack,
  upload: Tag,
}

const typeColors = {
  print: "bg-primary/10 text-primary",
  template: "bg-chart-3/10 text-chart-3",
  upload: "bg-success/10 text-success",
}

export default function HistoryPage() {
  const [dateFilter, setDateFilter] = useState("all")
  const [templateFilter, setTemplateFilter] = useState("all")

  return (
    <DashboardLayout>
      <Header
        title="History"
        description="Full activity log"
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="print">Print Jobs</option>
              <option value="template">Templates</option>
              <option value="upload">Uploads</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {mockHistory.length} entries
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {mockHistory.map((entry, index) => {
              const Icon = typeIcons[entry.type]
              const isLast = index === mockHistory.length - 1

              return (
                <div key={entry.id} className="flex gap-4 p-6">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        typeColors[entry.type]
                      )}
                    >
                      <Icon className="h-5 w-5" />
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
                            {entry.action}
                          </p>
                          {entry.status && (
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                entry.status === "success"
                                  ? "bg-success/10 text-success"
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {entry.status === "success" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {entry.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.details}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {entry.timestamp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {entry.user}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Load More */}
        <div className="mt-6 flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
