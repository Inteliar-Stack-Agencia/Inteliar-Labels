"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Printer,
  ChevronLeft,
  ChevronRight,
  Tag,
  Wifi,
  Monitor,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PrinterOption {
  id: string
  name: string
  type: "network" | "local"
  status: "online" | "offline"
}

const printers: PrinterOption[] = [
  { id: "1", name: "Zebra ZD420", type: "network", status: "online" },
  { id: "2", name: "Brother QL-820NWB", type: "network", status: "online" },
  { id: "3", name: "Local Printer Agent", type: "local", status: "offline" },
]

const mockLabels = [
  { empresa: "Acme Corp", plato: "PRD-001", codigo: "ABC123" },
  { empresa: "Acme Corp", plato: "PRD-002", codigo: "DEF456" },
  { empresa: "Beta Inc", plato: "PRD-003", codigo: "GHI789" },
]

type PrintMethod = "network" | "local"

export default function PreviewPage() {
  const [currentLabel, setCurrentLabel] = useState(0)
  const [selectedPrinter, setSelectedPrinter] = useState<string>("1")
  const [printMethod, setPrintMethod] = useState<PrintMethod>("network")
  const [isPrinting, setIsPrinting] = useState(false)

  const totalLabels = 120 // From uploaded data with quantities
  const label = mockLabels[currentLabel]

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      setIsPrinting(false)
    }, 2000)
  }

  return (
    <DashboardLayout>
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground">
            Preview & Print
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Total: {totalLabels} labels</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left - Label Preview */}
        <div className="flex-1 bg-muted/30 p-8">
          <div className="mx-auto max-w-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                Label Preview
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentLabel(Math.max(0, currentLabel - 1))}
                  disabled={currentLabel === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[60px] text-center text-sm text-muted-foreground">
                  {currentLabel + 1} of {mockLabels.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentLabel(Math.min(mockLabels.length - 1, currentLabel + 1))
                  }
                  disabled={currentLabel === mockLabels.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Label Card */}
            <div className="aspect-[4/3] rounded-xl border-2 border-border bg-background p-8 shadow-lg">
              <div className="flex h-full flex-col justify-between">
                {/* Header */}
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {label.empresa}
                  </p>
                  <p className="mt-1 text-lg text-muted-foreground">
                    {label.plato}
                  </p>
                </div>

                {/* QR Code Placeholder */}
                <div className="flex items-center justify-center">
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                    <div className="grid grid-cols-4 gap-1">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-5 w-5 rounded-sm",
                            Math.random() > 0.5 ? "bg-foreground" : "bg-background"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-right">
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {label.codigo}
                  </p>
                  <div className="mt-2 h-8 w-full bg-gradient-to-r from-foreground via-background to-foreground" 
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, var(--foreground) 0px, var(--foreground) 2px, transparent 2px, transparent 4px)`
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Preview shows how the label will look when printed
            </p>
          </div>
        </div>

        {/* Right - Print Options */}
        <div className="w-96 border-l border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Print Settings
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Print Method */}
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Print Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPrintMethod("network")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    printMethod === "network"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <Wifi className={cn(
                    "h-6 w-6",
                    printMethod === "network" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    printMethod === "network" ? "text-primary" : "text-muted-foreground"
                  )}>
                    Network
                  </span>
                </button>
                <button
                  onClick={() => setPrintMethod("local")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    printMethod === "local"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <Monitor className={cn(
                    "h-6 w-6",
                    printMethod === "local" ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    printMethod === "local" ? "text-primary" : "text-muted-foreground"
                  )}>
                    Local Agent
                  </span>
                </button>
              </div>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">
                Select Printer
              </label>
              <div className="space-y-2">
                {printers
                  .filter((p) => p.type === printMethod || printMethod === "local" && p.type === "local")
                  .map((printer) => (
                    <button
                      key={printer.id}
                      onClick={() => setSelectedPrinter(printer.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all",
                        selectedPrinter === printer.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <Printer className={cn(
                        "h-5 w-5",
                        selectedPrinter === printer.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 text-left">
                        <p className={cn(
                          "text-sm font-medium",
                          selectedPrinter === printer.id ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {printer.name}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          printer.status === "online"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          printer.status === "online" ? "bg-success" : "bg-destructive"
                        )} />
                        {printer.status}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Labels to print</span>
                <span className="font-medium text-foreground">{totalLabels}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated time</span>
                <span className="font-medium text-foreground">~3 minutes</span>
              </div>
            </div>

            {/* Print Button */}
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Print All {totalLabels} Labels
                </>
              )}
            </Button>

            {isPrinting && (
              <div className="rounded-lg border border-success bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Print job started
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check Print Jobs for progress
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
