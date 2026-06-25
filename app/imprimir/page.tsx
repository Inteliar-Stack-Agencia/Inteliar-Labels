"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { generateZPL, downloadZPL, prepareImages } from "@/lib/zpl"
import { sendToPrinterAgent } from "@/lib/printer-agent-client"
import { PrinterAgentStatus } from "@/components/printer/agent-status"
import type { CanvasData } from "@/lib/label-types"
import {
  Plus,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  variables: string[]
  width_mm: number
  height_mm: number
  canvas_data: CanvasData
}

interface DataRow {
  id: string
  data: Record<string, string>
  quantity: number
}

export default function ImprimirPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [rows, setRows] = useState<DataRow[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  // Printer agent state
  const [agentOnline, setAgentOnline] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printResult, setPrintResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      const { data } = await supabase
        .from("templates")
        .select("id, name, variables, width_mm, height_mm, canvas_data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) setTemplates(data)
      setLoadingTemplates(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectTemplate = (tmpl: Template) => {
    setSelectedTemplate(tmpl)
    const emptyRow: DataRow = {
      id: Date.now().toString(),
      data: Object.fromEntries((tmpl.variables ?? []).map((v) => [v, ""])),
      quantity: 1,
    }
    setRows([emptyRow])
    setStep(2)
  }

  const addRow = () => {
    if (!selectedTemplate) return
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        data: Object.fromEntries((selectedTemplate.variables ?? []).map((v) => [v, ""])),
        quantity: 1,
      },
    ])
  }

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))

  const updateCell = (rowId: string, key: string, value: string) =>
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, data: { ...r.data, [key]: value } } : r))

  const updateQty = (rowId: string, qty: number) =>
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, quantity: Math.max(1, qty) } : r))

  const totalLabels = rows.reduce((sum, r) => sum + r.quantity, 0)

  const buildZPL = async () => {
    if (!selectedTemplate) return ""
    const imageCache = await prepareImages(selectedTemplate.canvas_data)
    return generateZPL(
      { width_mm: selectedTemplate.width_mm, height_mm: selectedTemplate.height_mm, canvas_data: selectedTemplate.canvas_data },
      rows.map((r) => ({ row_data: r.data, quantity: r.quantity })),
      { imageCache }
    )
  }

  const handleDownloadZPL = async () => {
    const zpl = await buildZPL()
    if (zpl && selectedTemplate) downloadZPL(zpl, `${selectedTemplate.name}.zpl`)
  }

  const handlePrintNow = async () => {
    const zpl = await buildZPL()
    if (!zpl) return
    setPrinting(true)
    setPrintResult(null)
    try {
      const result = await sendToPrinterAgent(zpl, "zpl")
      setPrintResult({ ok: true, message: result.message })
    } catch (err) {
      setPrintResult({ ok: false, message: (err as Error).message })
    } finally {
      setPrinting(false)
    }
  }

  const handleSaveJob = async () => {
    if (!selectedTemplate) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const { data: job, error } = await supabase.from("print_jobs").insert({
      user_id: user.id,
      template_id: selectedTemplate.id,
      name: `${selectedTemplate.name} - manual`,
      status: "pending",
      total_labels: totalLabels,
      printed_labels: 0,
      source_file: "manual",
    }).select("id").single()

    if (error || !job) { setSaving(false); return }

    const rowsToInsert = rows.map((r, i) => ({
      job_id: job.id,
      row_index: i,
      row_data: r.data,
      quantity: r.quantity,
    }))
    await supabase.from("print_job_rows").insert(rowsToInsert)
    setSaving(false)
    router.push(`/jobs/${job.id}`)
  }

  const variables = selectedTemplate?.variables ?? []

  return (
    <DashboardLayout>
      <Header
        title="Imprimir etiquetas"
        description="Cargá los datos a mano e imprimí directo o descargá el ZPL"
      />

      <div className="p-6 space-y-6">
        {/* Steps */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Elegir plantilla" },
            { n: 2, label: "Cargar datos" },
            { n: 3, label: "Imprimir" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step > s.n ? "bg-green-500 text-white" : step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={cn("text-sm", step >= s.n ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s.label}
              </span>
              {i < 2 && <div className="mx-2 h-px w-12 bg-border" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Choose template */}
        {step === 1 && (
          <div className="space-y-4">
            {loadingTemplates ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">No tenés plantillas creadas todavía.</p>
                <Button onClick={() => router.push("/templates/new")}>Crear una plantilla</Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.width_mm} × {t.height_mm} mm
                        {t.variables?.length > 0 ? ` · ${t.variables.length} campos` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Data entry */}
        {step === 2 && selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> {selectedTemplate.name}
              </button>
              <span className="text-sm text-muted-foreground">{totalLabels} etiqueta{totalLabels !== 1 ? "s" : ""}</span>
            </div>

            {variables.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Esta plantilla no tiene variables. Podés imprimir directamente.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted">
                      <tr>
                        {variables.map((v) => (
                          <th key={v} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                            {v}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-24">Cantidad</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row, rowIdx) => (
                        <tr key={row.id} className={cn(rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                          {variables.map((v) => (
                            <td key={v} className="px-2 py-1.5">
                              <input
                                type="text"
                                value={row.data[v] ?? ""}
                                onChange={(e) => updateCell(row.id, v, e.target.value)}
                                className="w-full min-w-[100px] rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder={v}
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={row.quantity}
                              min={1}
                              onChange={(e) => updateQty(row.id, Number(e.target.value))}
                              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => removeRow(row.id)}
                              disabled={rows.length === 1}
                              className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-2" onClick={addRow}>
                <Plus className="h-4 w-4" /> Agregar fila
              </Button>
              <Button className="gap-2" onClick={() => setStep(3)} disabled={rows.length === 0}>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Print */}
        {step === 3 && selectedTemplate && (
          <div className="space-y-6">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Volver a datos
            </button>

            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <h3 className="text-lg font-semibold">Listo para imprimir</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{rows.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Productos distintos</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{totalLabels}</p>
                  <p className="text-xs text-muted-foreground mt-1">Etiquetas en total</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm font-bold text-foreground">{selectedTemplate.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTemplate.width_mm} × {selectedTemplate.height_mm} mm</p>
                </div>
              </div>

              {/* Data summary */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {variables.map((v) => (
                        <th key={v} className="px-3 py-2 text-left font-medium text-muted-foreground">{v}</th>
                      ))}
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.id}>
                        {variables.map((v) => (
                          <td key={v} className="px-3 py-2 text-foreground">{row.data[v] || "-"}</td>
                        ))}
                        <td className="px-3 py-2 text-center text-foreground">{row.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Printer agent status */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agente de impresión</p>
                <PrinterAgentStatus onStatusChange={(online) => setAgentOnline(online)} />
              </div>

              {/* Print result */}
              {printResult && (
                <div className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-sm",
                  printResult.ok
                    ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                    : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                )}>
                  {printResult.ok
                    ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                    : <XCircle className="h-4 w-4 shrink-0" />}
                  {printResult.message}
                  <button onClick={() => setPrintResult(null)} className="ml-auto opacity-60 hover:opacity-100">×</button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="gap-2 flex-1"
                  onClick={handlePrintNow}
                  disabled={!agentOnline || printing}
                >
                  <Printer className="h-5 w-5" />
                  {printing ? "Enviando a impresora..." : `Imprimir ahora · ${totalLabels} etiquetas`}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleDownloadZPL}
                >
                  <Download className="h-5 w-5" />
                  Descargar ZPL
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={handleSaveJob}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar trabajo"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
