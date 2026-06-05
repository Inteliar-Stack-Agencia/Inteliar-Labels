"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  Eye,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface ParsedData {
  columns: string[]
  rows: Record<string, string>[]
  fileName: string
  totalRows: number
}

export default function UploadPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isDragging, setIsDragging] = useState(false)
  const [data, setData] = useState<ParsedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<{ id: string; name: string; variables: string[] }[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [quantityColumn, setQuantityColumn] = useState<string>("")
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [previewRows, setPreviewRows] = useState(3)
  const [sampleTemplates, setSampleTemplates] = useState<{ id: string; name: string; variables: string[] }[]>([])
  const [loadingSampleTemplates, setLoadingSampleTemplates] = useState(false)
  const [showSamplePicker, setShowSamplePicker] = useState(false)

  const parseFile = useCallback((file: File) => {
    setError(null)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result
        const workbook = XLSX.read(buffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })

        if (jsonData.length === 0) {
          setError("El archivo está vacío o no tiene datos válidos.")
          setLoading(false)
          return
        }

        const columns = Object.keys(jsonData[0])
        setData({
          columns,
          rows: jsonData,
          fileName: file.name,
          totalRows: jsonData.length,
        })

        // Auto-detectar columna de cantidad
        const cantCol = columns.find((c) =>
          ["cantidad", "quantity", "cant", "qty", "copias", "copies"].includes(c.toLowerCase())
        )
        if (cantCol) setQuantityColumn(cantCol)

        setStep(2)
        loadTemplates()
      } catch {
        setError("No se pudo leer el archivo. Asegurate de subir un Excel (.xlsx, .xls) o CSV válido.")
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const loadTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: tmpl } = await supabase
      .from("templates")
      .select("id, name, variables")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (tmpl) setTemplates(tmpl)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }, [parseFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const totalLabels = data
    ? data.rows.reduce((sum, row) => {
        const qty = quantityColumn ? Number(row[quantityColumn]) || 1 : 1
        return sum + qty
      }, 0)
    : 0

  const handleCreateJob = async () => {
    if (!data || !selectedTemplate) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const templateName = templates.find((t) => t.id === selectedTemplate)?.name || "Sin nombre"

    const { data: job, error } = await supabase.from("print_jobs").insert({
      user_id: user.id,
      template_id: selectedTemplate,
      name: `${templateName} - ${data.fileName}`,
      status: "pending",
      total_labels: totalLabels,
      printed_labels: 0,
      source_file: data.fileName,
    }).select("id").single()

    if (error || !job) { setLoading(false); return }

    // Save Excel rows so job detail can render previews
    const rowsToInsert = data.rows.map((row, i) => ({
      job_id: job.id,
      row_index: i,
      row_data: row,
      quantity: quantityColumn ? Math.max(1, Number(row[quantityColumn]) || 1) : 1,
    }))

    // Insert in batches of 500
    for (let i = 0; i < rowsToInsert.length; i += 500) {
      await supabase.from("print_job_rows").insert(rowsToInsert.slice(i, i + 500))
    }

    setLoading(false)
    router.push(`/jobs/${job.id}`)
  }

  const loadSampleTemplates = async () => {
    if (sampleTemplates.length > 0) { setShowSamplePicker(true); return }
    setLoadingSampleTemplates(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from("templates")
        .select("id, name, variables")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) setSampleTemplates(data)
    }
    setLoadingSampleTemplates(false)
    setShowSamplePicker(true)
  }

  const downloadSampleExcel = (tmpl: { name: string; variables: string[] }) => {
    const vars = tmpl.variables ?? []
    const headers = vars.length > 0 ? [...vars, "cantidad"] : ["campo1", "campo2", "cantidad"]
    const exampleRow = Object.fromEntries(headers.map((h) => [h, h === "cantidad" ? "1" : `ejemplo_${h}`]))
    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Etiquetas")
    XLSX.writeFile(wb, `plantilla_${tmpl.name.replace(/\s+/g, "_")}.xlsx`)
    setShowSamplePicker(false)
  }

  return (
    <DashboardLayout>
      <Header
        title="Cargar datos"
        description="Subí tu Excel o CSV para generar etiquetas en lote"
      />

      <div className="p-6 space-y-6">
        {/* Steps */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Subir archivo" },
            { n: 2, label: "Configurar" },
            { n: 3, label: "Confirmar" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
              )}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
              {loading ? (
                <div className="text-center space-y-2">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Leyendo archivo...</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Arrastrá tu archivo aquí</p>
                    <p className="text-sm text-muted-foreground mt-1">o hacé click para seleccionar</p>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Excel .xlsx</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Excel .xls</span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">CSV</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sample Excel download */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">¿No tenés el Excel todavía?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Descargá una plantilla con las columnas correctas para tu etiqueta</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); loadSampleTemplates() }}
                  disabled={loadingSampleTemplates}
                >
                  {loadingSampleTemplates
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    : <Download className="h-4 w-4" />}
                  Descargar plantilla Excel
                </Button>
              </div>

              {showSamplePicker && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Elegí la plantilla de etiqueta:</p>
                  {sampleTemplates.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tenés plantillas creadas. <button onClick={() => router.push("/templates/new")} className="text-primary underline">Crear una →</button></p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sampleTemplates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => downloadSampleExcel(t)}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <FileSpreadsheet className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {(t.variables ?? []).length > 0
                                ? (t.variables ?? []).join(", ")
                                : "Sin variables"}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* STEP 2: Configure */}
        {step === 2 && data && (
          <div className="space-y-6">
            {/* File info */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{data.fileName}</p>
                <p className="text-xs text-muted-foreground">{data.totalRows} filas · {data.columns.length} columnas detectadas</p>
              </div>
              <button onClick={() => { setData(null); setStep(1) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Columns detected */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Columnas detectadas</h3>
              <div className="flex flex-wrap gap-2">
                {data.columns.map((col) => (
                  <span key={col} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                    {`{{${col}}}`}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Usá estas variables en tu plantilla de etiqueta</p>
            </div>

            {/* Quantity column */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Columna de cantidad</h3>
              <p className="text-xs text-muted-foreground">
                ¿Qué columna indica cuántas etiquetas imprimir por fila?
              </p>
              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-muted-foreground">
                💡 Ejemplo: si la fila dice <strong className="text-foreground">producto = Milanesas</strong> y <strong className="text-foreground">cantidad = 10</strong>, se imprimen <strong className="text-foreground">10 etiquetas</strong> de Milanesas seguidas. Si no seleccionás ninguna columna, se imprime 1 etiqueta por fila.
              </div>
              <select
                value={quantityColumn}
                onChange={(e) => setQuantityColumn(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">1 etiqueta por fila (sin columna de cantidad)</option>
                {data.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Template selection */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Plantilla de etiqueta</h3>
              {templates.length === 0 ? (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">No tenés plantillas creadas.</p>
                  <Button variant="link" size="sm" onClick={() => router.push("/templates/new")}>
                    Crear una plantilla →
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {templates.map((t) => {
                    const missing = (t.variables ?? []).filter((v) => !data?.columns.includes(v))
                    const hasMissing = missing.length > 0
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          selectedTemplate === t.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5",
                          selectedTemplate === t.id ? "border-primary bg-primary" : "border-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.variables?.length > 0 && (
                            <p className="text-xs text-muted-foreground">Variables: {t.variables.join(", ")}</p>
                          )}
                          {selectedTemplate === t.id && hasMissing && (
                            <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Columnas faltantes en el Excel: <strong>{missing.join(", ")}</strong>. Estas variables quedarán vacías en las etiquetas.
                              </p>
                            </div>
                          )}
                          {selectedTemplate === t.id && !hasMissing && t.variables?.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 px-2 py-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                              <p className="text-xs text-green-600 dark:text-green-400">Todas las variables coinciden con el Excel.</p>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Data preview */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Vista previa de datos</h3>
                <button onClick={() => setPreviewRows(previewRows === 3 ? data.totalRows : 3)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Eye className="h-3 w-3" />
                  {previewRows === 3 ? "Ver todo" : "Ver menos"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {data.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.rows.slice(0, previewRows).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        {data.columns.map((col) => (
                          <td key={col} className="px-3 py-2 text-foreground">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.totalRows > previewRows && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando {previewRows} de {data.totalRows} filas
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <h3 className="text-lg font-semibold">Resumen del trabajo de impresión</h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{data.totalRows}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filas del Excel</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{totalLabels}</p>
                  <p className="text-xs text-muted-foreground mt-1">Etiquetas a imprimir</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {templates.find((t) => t.id === selectedTemplate)?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Plantilla</p>
                </div>
              </div>

              {quantityColumn && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Cantidad por fila desde columna: <strong>{quantityColumn}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep(2)}>Volver</Button>
              <Button onClick={handleCreateJob} disabled={loading} className="gap-2">
                <Printer className="h-4 w-4" />
                {loading ? "Creando trabajo..." : `Crear trabajo · ${totalLabels} etiquetas`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
