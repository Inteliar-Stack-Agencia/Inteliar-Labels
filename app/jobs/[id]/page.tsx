"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { analytics } from "@/lib/analytics"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Type,
  QrCode,
  Barcode,
  Printer,
  Download,
} from "lucide-react"
import { generateZPL, downloadZPL, prepareImages, type GenerateZPLOptions } from "@/lib/zpl"
import { sendToPrinterAgent } from "@/lib/printer-agent-client"
import { PrinterAgentStatus } from "@/components/printer/agent-status"
import { PrinterSelector } from "@/components/printer/printer-selector"
import { cn } from "@/lib/utils"

interface LabelElement {
  id: string
  type: "text" | "qr" | "barcode" | "image"
  content: string
  x: number
  y: number
  fontSize: number
  bold: boolean
  imageUrl?: string
  imgWidth?: number
  imgHeight?: number
}

interface PrintJob {
  id: string
  name: string
  status: string
  total_labels: number
  printed_labels: number
  source_file: string | null
  created_at: string
  template_id: string
  error_message: string | null
}

interface Template {
  name: string
  width_mm: number
  height_mm: number
  canvas_data: { elements: LabelElement[]; cutBetweenLabels?: boolean }
}

const SCALE = 2

function substituteVars(text: string, row: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => row[key] ?? `{{${key}}}`)
}

function LabelPreview({
  template,
  row,
}: {
  template: Template
  row: Record<string, string>
}) {
  const w = template.width_mm * SCALE
  const h = template.height_mm * SCALE

  return (
    <div
      className="relative shrink-0 border border-border bg-white shadow-sm"
      style={{ width: w, height: h }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
          backgroundSize: `${SCALE * 10}px ${SCALE * 10}px`,
        }}
      />
      {template.canvas_data.elements.map((el) => {
        const left = (el.x * SCALE) / 10
        const top = (el.y * SCALE) / 10

        if (el.type === "image" && el.imageUrl) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={el.id}
              src={el.imageUrl}
              alt=""
              className="absolute object-contain"
              style={{
                left,
                top,
                width: (el.imgWidth ?? 200) * SCALE / 10,
                height: (el.imgHeight ?? 150) * SCALE / 10,
              }}
            />
          )
        }

        const content = substituteVars(el.content, row)
        const Icon = el.type === "qr" ? QrCode : el.type === "barcode" ? Barcode : Type

        return (
          <div
            key={el.id}
            className="absolute flex items-center gap-0.5"
            style={{ left, top }}
          >
            {el.type !== "text" && (
              <Icon className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            )}
            <span
              className="text-gray-800 leading-tight"
              style={{
                fontSize: `${Math.max(6, el.fontSize * SCALE / 3)}px`,
                fontWeight: el.bold ? "bold" : "normal",
              }}
            >
              {content}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  completed: { icon: CheckCircle2, label: "Completado", className: "text-green-500 bg-green-500/10" },
  pending: { icon: Clock, label: "Pendiente", className: "text-yellow-500 bg-yellow-500/10" },
  processing: { icon: RefreshCw, label: "Procesando", className: "text-primary bg-primary/10" },
  failed: { icon: XCircle, label: "Error", className: "text-destructive bg-destructive/10" },
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string
  const supabase = createClient()

  const [job, setJob] = useState<PrintJob | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [rows, setRows] = useState<Array<{ row_data: Record<string, string>; quantity: number }>>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [visibleCount, setVisibleCount] = useState(6)
  const [generatingZpl, setGeneratingZpl] = useState(false)
  const [startFromLabel, setStartFromLabel] = useState(1)
  const [endAtLabel, setEndAtLabel] = useState<number | "">("")

  // Printer agent state
  const [agentOnline, setAgentOnline] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printResult, setPrintResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [printerId, setPrinterId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      const { data: jobData, error } = await supabase
        .from("print_jobs")
        .select("*")
        .eq("id", jobId)
        .single()

      if (error || !jobData) { setNotFound(true); setLoading(false); return }
      setJob(jobData as PrintJob)

      if (jobData.template_id) {
        const { data: tmpl } = await supabase
          .from("templates")
          .select("name, width_mm, height_mm, canvas_data")
          .eq("id", jobData.template_id)
          .single()
        if (tmpl) setTemplate(tmpl as Template)
      }

      const { data: rowData } = await supabase
        .from("print_job_rows")
        .select("row_data, quantity")
        .eq("job_id", jobId)
        .order("row_index", { ascending: true })

      if (rowData && rowData.length > 0) {
        setRows(rowData.map((r) => ({ row_data: r.row_data as Record<string, string>, quantity: r.quantity ?? 1 })))
      } else {
        const { data: tmpl } = await supabase
          .from("templates")
          .select("variables")
          .eq("id", jobData.template_id)
          .single()
        if (tmpl?.variables) {
          const placeholders: Record<string, string> = {}
          for (const v of tmpl.variables) placeholders[v] = `[${v}]`
          setRows([{ row_data: placeholders, quantity: 1 }])
        }
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  async function handleDownloadZpl(opts: GenerateZPLOptions = {}) {
    if (!template || rows.length === 0) return
    setGeneratingZpl(true)
    try {
      const imageCache = await prepareImages(template.canvas_data)
      const zpl = generateZPL(
        { width_mm: template.width_mm, height_mm: template.height_mm, canvas_data: template.canvas_data },
        rows,
        { ...opts, imageCache }
      )
      const hasRange = (opts.startFromLabel && opts.startFromLabel > 1) || opts.endAtLabel
      const from = opts.startFromLabel ?? 1
      const to = opts.endAtLabel ?? (job?.total_labels ?? "")
      const suffix = hasRange ? `-${from}_${to}` : ""
      downloadZPL(zpl, `${job?.name ?? "etiquetas"}${suffix}.zpl`)
    } finally {
      setGeneratingZpl(false)
    }
  }

  async function handlePrintNow() {
    if (!template || rows.length === 0) return
    setPrinting(true)
    setPrintResult(null)
    try {
      const imageCache = await prepareImages(template.canvas_data)
      const zpl = generateZPL(
        { width_mm: template.width_mm, height_mm: template.height_mm, canvas_data: template.canvas_data },
        rows,
        { startFromLabel, endAtLabel: endAtLabel === "" ? undefined : endAtLabel, imageCache }
      )
      const result = await sendToPrinterAgent(zpl, "zpl", { printerId, retries: 2 })
      const printedCount = result.labels ?? 0
      const total = job?.total_labels ?? 0
      const isFullRange = startFromLabel <= 1 && (endAtLabel === "" || endAtLabel >= total)
      setPrintResult({
        ok: true,
        message: isFullRange
          ? (result.message ?? "Enviado a la impresora")
          : `Rango ${startFromLabel}–${endAtLabel === "" ? total : endAtLabel} enviado (${printedCount} etiquetas)`,
      })
      // Only auto-complete when the whole job was printed, not a partial range.
      if (job?.status === "pending" && isFullRange) {
        await supabase
          .from("print_jobs")
          .update({ status: "completed", printed_labels: total, completed_at: new Date().toISOString() })
          .eq("id", jobId)
        setJob((prev) => prev ? { ...prev, status: "completed", printed_labels: prev.total_labels } : prev)
        analytics.printJobCompleted(total)
        // Track first print if this is the first completed job
        const firstPrintKey = "first_print_done"
        if (!localStorage.getItem(firstPrintKey)) {
          analytics.firstPrint()
          localStorage.setItem(firstPrintKey, "1")
        }
      }
    } catch (err) {
      setPrintResult({ ok: false, message: (err as Error).message })
    } finally {
      setPrinting(false)
    }
  }

  async function markCompleted() {
    setMarkingDone(true)
    await supabase
      .from("print_jobs")
      .update({ status: "completed", printed_labels: job?.total_labels ?? 0, completed_at: new Date().toISOString() })
      .eq("id", jobId)
    setJob((prev) => prev ? { ...prev, status: "completed", printed_labels: prev.total_labels } : prev)
    setMarkingDone(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  if (notFound || !job) {
    return (
      <DashboardLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold">Trabajo no encontrado</p>
          <Link href="/jobs"><Button variant="outline">Volver a trabajos</Button></Link>
        </div>
      </DashboardLayout>
    )
  }

  const status = statusConfig[job.status] ?? statusConfig.pending
  const StatusIcon = status.icon
  const previewRows = rows.slice(0, visibleCount)
  const canPrint = rows.length > 0 && !!template

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex h-auto min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/jobs")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">{job.name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Printer agent status */}
          <PrinterAgentStatus
            onStatusChange={(online) => setAgentOnline(online)}
          />

          {canPrint && agentOnline && (
            <PrinterSelector
              online={agentOnline}
              value={printerId}
              onChange={(id) => setPrinterId(id)}
              disabled={printing}
              className="min-w-[12rem]"
            />
          )}

          {canPrint && (
            <>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1">
                <span className="text-xs text-muted-foreground">Rango</span>
                <input
                  type="number"
                  min={1}
                  max={job?.total_labels ?? 9999}
                  value={startFromLabel}
                  onChange={(e) => setStartFromLabel(Math.max(1, Number(e.target.value)))}
                  title="Desde etiqueta"
                  className="w-12 bg-transparent text-center text-sm focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <input
                  type="number"
                  min={startFromLabel}
                  max={job?.total_labels ?? 9999}
                  value={endAtLabel}
                  placeholder={String(job?.total_labels ?? "")}
                  onChange={(e) => setEndAtLabel(e.target.value === "" ? "" : Math.max(startFromLabel, Number(e.target.value)))}
                  title="Hasta etiqueta (vacío = hasta el final)"
                  className="w-12 bg-transparent text-center text-sm focus:outline-none placeholder:text-muted-foreground/50"
                />
                <span className="text-xs text-muted-foreground">de {job?.total_labels ?? "?"}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleDownloadZpl({ startFromLabel, endAtLabel: endAtLabel === "" ? undefined : endAtLabel })}
                disabled={generatingZpl}
              >
                <Download className="h-4 w-4" />
                {generatingZpl ? "Generando..." : "Descargar ZPL"}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={handlePrintNow}
                disabled={!agentOnline || printing}
              >
                <Printer className="h-4 w-4" />
                {printing ? "Enviando..." : "Imprimir ahora"}
              </Button>
            </>
          )}

          {job.status === "pending" && (
            <Button variant="outline" size="sm" className="gap-2" onClick={markCompleted} disabled={markingDone}>
              <CheckCircle2 className="h-4 w-4" />
              {markingDone ? "Guardando..." : "Marcar impreso"}
            </Button>
          )}
        </div>
      </div>

      {/* Print result banner */}
      {printResult && (
        <div className={cn(
          "flex items-center gap-3 border-b px-6 py-3 text-sm",
          printResult.ok
            ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
            : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
        )}>
          {printResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {printResult.message}
          <button onClick={() => setPrintResult(null)} className="ml-auto opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Estado</p>
            <div className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.className)}>
              <StatusIcon className={cn("h-3.5 w-3.5", job.status === "processing" && "animate-spin")} />
              {status.label}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Etiquetas</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{job.total_labels}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Plantilla</p>
            <p className="mt-1 text-sm font-medium text-foreground">{template?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Archivo fuente</p>
            <p className="mt-1 text-sm font-medium text-foreground truncate">{job.source_file ?? "—"}</p>
          </div>
        </div>

        {/* Label preview */}
        {template && rows.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Vista previa de etiquetas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {template.width_mm} × {template.height_mm} mm
                  {rows.length > 1 ? ` · ${rows.length} etiquetas únicas` : ""}
                </p>
              </div>
              {rows.length === 1 && rows[0].row_data && Object.values(rows[0].row_data)[0]?.startsWith("[") && (
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-600">
                  Preview con datos de muestra — subí el Excel para ver datos reales
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {previewRows.map((r, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <LabelPreview template={template} row={r.row_data} />
                  <span className="text-[10px] text-muted-foreground">
                    #{i + 1}{r.quantity > 1 ? ` ×${r.quantity}` : ""}
                  </span>
                </div>
              ))}
            </div>

            {rows.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((v) => v + 12)}
                className="text-xs text-primary hover:underline"
              >
                Ver más ({rows.length - visibleCount} restantes)
              </button>
            )}
          </div>
        )}

        {job.error_message && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80 mt-1">{job.error_message}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
