"use client"

import Link from "next/link"
import { FileStack, Upload, Printer, ArrowRight } from "lucide-react"

const actions = [
  {
    title: "Create Template",
    description: "Design a new label template with drag & drop editor",
    href: "/templates/new",
    icon: FileStack,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Upload Excel",
    description: "Import data from Excel or CSV files for batch printing",
    href: "/upload",
    icon: Upload,
    color: "bg-success/10 text-success",
  },
  {
    title: "Print Labels",
    description: "Start a new print job with your existing templates",
    href: "/jobs/new",
    icon: Printer,
    color: "bg-chart-4/10 text-chart-4",
  },
]

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-card-foreground">
          Quick Actions
        </h2>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex flex-col rounded-lg border border-border p-4 transition-all hover:border-primary hover:bg-muted/50"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-card-foreground">
              {action.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {action.description}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Get started
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
