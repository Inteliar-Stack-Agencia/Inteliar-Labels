"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { generateZPL, downloadZPL } from "@/lib/zpl"
import type { CanvasData } from "@/lib/label-types"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Tag,
  Type,
  QrCode,
  Barcode,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LabelElement {
  id: string
  type: "text" | "qr" | "barcode" | "image" | "serial" | "line" | "rect"
  content: string
  x: number
  y: number
  fontSize: number
  bold: boolean
  imageUrl?: string
  imgWidth?: number
  imgHeight?: number
  lineWidth?: number
  lineHeight?: number
  lineThickness?: number
  serialStart?: number
  serialIncrement?: number
  serialDigits?: number
  serialPrefix?: string
  serialSuffix?: string
}

interface Template {
  name: string
  width_mm: number
  height_mm: number
  canvas_data: CanvasData & { elements: LabelElement[] }
}

interface JobRow {
  row_data: Record<string, string>
  quantity: number
}

interface PrintJob {
  id: string
  name: string
  total_labels: number
  template_id: string
}

const SCALE = 3

function substituteVars(text: string, row: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => row[key] ?? `{{${key}}}`)
}

function LabelPreview({ template, row }: { template: Template; row: Record<string, string> }) {
  const w = template.width_mm * SCALE
  const h = template.height_mm * SCALE

  return (
    <div
      className="relative shrink-0 border-2 border-border bg-white shadow-xl"
      style={{ width: w, height: h }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: `${SCALE * 10}px ${SCALE * 10}px`,
        }}
      />
      {template.canvas_data.elements.map((el) => {
        const left = (el.x * SCALE) / 10
        const top = (el.y * SCALE) / 10

        if (el.type === "line") {
          return (
            <div
              key={el.id}
              className="absolute bg-gray-800"
              style={{
                left,
                top,
                width: ((el.lineWidth ?? 10) * SCALE) / 10,
                height: Math.max(1, ((el.lineThickness ?? 1) * SCALE) / 10),
              }}
            />
          )
        }

        if (el.type === "rect") {
          const rw = ((el.lineWidth ?? 20) * SCALE) / 10
          const rh = ((el.lineHeight ?? 10) * SCALE) / 10
          const thick = Math.max(1, ((el.lineThickness ?? 1) * SCALE) / 10)
          return (
            <div
              key={el.id}
              className="absolute border border-gray-800"
              style={{ left, top, width: rw, height: rh, borderWidth: thick }}
            />
          )
        }

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
                width: ((el.imgWidth ?? 30) * SCALE) / 10,
                height: ((el.imgHeight ?? 20) * SCALE) / 10,
              }}
            />
          )
        }

        const content = el.type === "serial"
          ? `${el.serialPrefix ?? ""}${"0".repeat(el.serialDigits ?? 4)}${el.serialSuffix ?? ""}`
          : substituteVars(el.content, row)

        const Icon = el.type === "qr" ? QrCode : el.type === "barcode" ? Barcode : Type

        return (
          <div
            key={el.id}
            className="absolute flex items-center gap-0.5"
            style={{ left, top }}
          >
            {el.type !== "text" && el.type !== "serial" && (
              <Icon className="h-3 w-3 text-gray-400 shrink-0" />
            )}
            <span
              className="text-gray-900 leading-tight whitespace-nowrap"
              style={{
                fontSize: `${Math.max(7, (el.fontSize * SCALE) / 3)}px`,
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

function PreviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get("jobId")
  const supabase = createClient()

  const [job, setJob] = useState<PrintJob | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [rows, setRows] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRow, setCurrentRow] = useState(0)
  const [generatingZpl, setGeneratingZpl] = useState(false)

  useEffect(() => {
    if (!jobId) { router.push("/jobs"); return }

    const load = async () => {
      const { data: jobData } = await supabase
        .from("print_jobs")
        .select("id, name, total_labels, template_id")
        .eq("id", jobId)
        .single()

      if (!jobData) { router.push("/jobs"); return }
      setJob(jobData as PrintJob)

      const { data: tmpl } = await supabase
        .from("templates")
        .select("name, width_mm, height_mm, canvas_data")
        .eq("id", jobData.template_id)
        .single()

      if (tmpl) setTemplate(tmpl as Template)

      const { data: rowData } = await supabase
        .from("print_job_rows")
        .select("row_data, quantity")
        .eq("job_id", jobId)
        .order("row_index", { ascending: true })

      if (rowData && rowData.length > 0) {
        setRows(rowData.map((r) => ({
          row_data: r.row_data as Record<string, string>,
          quantity: r.quantity ?? 1,
        })))
      }

      setLoading(false)
    }

    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  function handleDownloadZpl() {
    if (!template || rows.length === 0) return
    setGeneratingZpl(true)
    try {
      const zpl = generateZPL(
        { width_mm: template.width_mm, height_mm: template.height_mm, canvas_data: template.canvas_data },
        rows
      )
      downloadZPL(zpl, `${job?.name ?? "etiquetas"}.zpl`)
    } finally {
      setGeneratingZpl(false)
    }
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

  if (!job || !template) {
    return (
      <DashboardLayout>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">No se encontró el trabajo.</p>
          <Link href="/jobs"><Button variant="outline">Volver a trabajos</Button></Link>
        </div>
      </DashboardLayout>
    )
  }

  const row = rows[currentRow]
  const totalRows = rows.length

  return (
    <DashboardLayout>
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/jobs/${jobId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al trabajo
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-base font-semibold text-foreground truncate max-w-xs">{job.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{job.total_labels} etiquetas</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleDownloadZpl}
            disabled={generatingZpl || rows.length === 0}
          >
            <Download className="h-4 w-4" />
            {generatingZpl ? "Generando..." : "Descargar ZPL"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left: label preview */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 p-8 gap-6">
          {rows.length === 0 ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">No hay datos de filas para este trabajo.</p>
              <Link href={`/jobs/${jobId}`}><Button variant="outline" size="sm">Volver</Button></Link>
            </div>
          ) : (
            <>
              {/* Navigation controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentRow(Math.max(0, currentRow - 1))}
                  disabled={currentRow === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                  Fila {currentRow + 1} de {totalRows}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentRow(Math.min(totalRows - 1, currentRow + 1))}
                  disabled={currentRow === totalRows - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Label */}
              {row && <LabelPreview template={template} row={row.row_data} />}

              {/* Row info */}
              {row && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{template.width_mm} × {template.height_mm} mm</span>
                  {row.quantity > 1 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                      ×{row.quantity} copias
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: row list */}
        <div className="w-72 border-l border-border bg-card flex flex-col">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Filas del Excel</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totalRows} filas</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {rows.map((r, i) => {
              const firstVal = Object.values(r.row_data)[0] ?? `Fila ${i + 1}`
              const secondVal = Object.values(r.row_data)[1] ?? ""
              return (
                <button
                  key={i}
                  onClick={() => setCurrentRow(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    i === currentRow
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0",
                    i === currentRow ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{firstVal}</p>
                    {secondVal && <p className="text-[10px] text-muted-foreground truncate">{secondVal}</p>}
                  </div>
                  {r.quantity > 1 && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">×{r.quantity}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    }>
      <PreviewContent />
    </Suspense>
  )
}
