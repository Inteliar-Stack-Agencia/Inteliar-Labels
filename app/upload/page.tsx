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

    const { error } = await supabase.from("print_jobs").insert({
      user_id: user.id,
      template_id: selectedTemplate,
      name: `${templateName} - ${data.fileName}`,
      status: "pending",
      total_labels: totalLabels,
      printed_labels: 0,
      source_file: data.fileName,
    })

    setLoading(false)
    if (!error) {
      router.push("/jobs")
    }
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
              <p className="text-xs text-muted-foreground">¿Qué columna indica cuántas etiquetas imprimir por fila?</p>
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
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                        selectedTemplate === t.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn("h-4 w-4 rounded-full border-2 flex-shrink-0",
                        selectedTemplate === t.id ? "border-primary bg-primary" : "border-muted-foreground"
                      )} />
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        {t.variables?.length > 0 && (
                          <p className="text-xs text-muted-foreground">Variables: {t.variables.join(", ")}</p>
                        )}
                      </div>
                    </button>
                  ))}
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
