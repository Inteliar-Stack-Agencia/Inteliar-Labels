"use client"

import { useState, useCallback, useEffect } from "react"
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
  ShoppingBag,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { PRESET_TEMPLATES } from "@/lib/preset-templates"
import { analytics } from "@/lib/analytics"

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
  const [savedLists, setSavedLists] = useState<{ id: string; name: string; file_name: string | null; row_count: number; columns: string[]; rows: Record<string, string>[]; created_at: string }[]>([])
  const [savingList, setSavingList] = useState(false)
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set())
  const [suggestedMatch, setSuggestedMatch] = useState<{ name: string; matched: number; total: number } | null>(null)

  // Tiendanube import
  const [showTNModal, setShowTNModal] = useState(false)
  const [tnUrl, setTnUrl] = useState("")
  const [tnLoading, setTnLoading] = useState(false)
  const [tnError, setTnError] = useState("")
  const [tnLastSync, setTnLastSync] = useState<{ url: string; syncedAt: string; total: number } | null>(null)

  useEffect(() => {
    // Load last TN sync from localStorage
    try {
      const raw = localStorage.getItem("tn_last_sync")
      if (raw) setTnLastSync(JSON.parse(raw))
    } catch {}
    loadSavedLists()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        setExcludedRows(new Set())

        const cantCol = columns.find((c) =>
          ["cantidad", "quantity", "cant", "qty", "copias", "copies"].includes(c.toLowerCase())
        )
        if (cantCol) setQuantityColumn(cantCol)

        setStep(2)
        loadTemplates(columns)
      } catch {
        setError("No se pudo leer el archivo. Asegurate de subir un Excel (.xlsx, .xls) o CSV válido.")
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTemplates = async (columns?: string[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: tmpl } = await supabase
      .from("templates")
      .select("id, name, variables")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (!tmpl) return
    setTemplates(tmpl)

    // Auto-suggest the template whose variables best match the Excel columns
    if (columns && columns.length > 0) {
      const cols = columns.map((c) => c.toLowerCase().trim())
      let best: { id: string; name: string; matched: number; total: number } | null = null
      for (const t of tmpl) {
        const vars = (t.variables ?? []).map((v) => v.toLowerCase().trim())
        if (vars.length === 0) continue
        const matched = vars.filter((v) => cols.includes(v)).length
        if (!best || matched > best.matched) {
          best = { id: t.id, name: t.name, matched, total: vars.length }
        }
      }
      // Only suggest if at least one variable matches
      if (best && best.matched > 0) {
        setSelectedTemplate(best.id)
        setSuggestedMatch({ name: best.name, matched: best.matched, total: best.total })
      } else {
        setSuggestedMatch(null)
      }
    }
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

  const includedRows = data ? data.rows.filter((_, i) => !excludedRows.has(i)) : []
  const includedCount = includedRows.length

  const totalLabels = includedRows.reduce((sum, row) => {
    const qty = quantityColumn ? Number(row[quantityColumn]) || 1 : 1
    return sum + qty
  }, 0)

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

    // Only include rows the user kept selected (re-indexed sequentially)
    const rowsToInsert = data.rows
      .filter((_, i) => !excludedRows.has(i))
      .map((row, i) => ({
        job_id: job.id,
        row_index: i,
        row_data: row,
        quantity: quantityColumn ? Math.max(1, Number(row[quantityColumn]) || 1) : 1,
      }))

    for (let i = 0; i < rowsToInsert.length; i += 500) {
      await supabase.from("print_job_rows").insert(rowsToInsert.slice(i, i + 500))
    }

    setLoading(false)
    router.push(`/jobs/${job.id}`)
  }

  const loadSavedLists = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: lists } = await supabase
      .from("saved_lists")
      .select("id, name, file_name, row_count, columns, rows, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
    if (lists) setSavedLists(lists)
  }

  const handleSaveList = async () => {
    if (!data) return
    const name = window.prompt("Nombre para esta lista (ej: Productos góndola):", data.fileName?.replace(/\.[^.]+$/, "") ?? "")
    if (!name) return
    setSavingList(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingList(false); return }
    await supabase.from("saved_lists").insert({
      user_id: user.id,
      name,
      file_name: data.fileName,
      columns: data.columns,
      rows: data.rows,
      row_count: data.totalRows,
    })
    setSavingList(false)
    await loadSavedLists()
    alert("Lista guardada. La vas a encontrar al subir datos la próxima vez.")
  }

  const useSavedList = (list: typeof savedLists[number]) => {
    setData({
      columns: list.columns,
      rows: list.rows,
      fileName: list.file_name ?? list.name,
      totalRows: list.row_count,
    })
    setExcludedRows(new Set())
    const cantCol = list.columns.find((c) =>
      ["cantidad", "quantity", "cant", "qty", "copias", "copies"].includes(c.toLowerCase())
    )
    if (cantCol) setQuantityColumn(cantCol)
    setStep(2)
    loadTemplates(list.columns)
  }

  const importFromTiendanube = async () => {
    if (!tnUrl.trim()) { setTnError("Ingresá la URL de tu tienda."); return }
    setTnLoading(true)
    setTnError("")
    try {
      const res = await fetch("/api/tiendanube/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: tnUrl.trim() }),
      })
      const result = await res.json()
      if (!res.ok) {
        setTnError(result.error || "Error al importar productos.")
        return
      }
      const syncInfo = { url: tnUrl.trim(), syncedAt: new Date().toISOString(), total: result.total }
      localStorage.setItem("tn_last_sync", JSON.stringify(syncInfo))
      setTnLastSync(syncInfo)
      analytics.tiendanubeConnected(result.total)
      setData({ columns: result.columns, rows: result.rows, fileName: `Tiendanube · ${tnUrl.trim()}`, totalRows: result.total })
      setExcludedRows(new Set())
      setQuantityColumn("cantidad")
      setShowTNModal(false)
      setTnUrl("")
      setStep(2)
      loadTemplates(result.columns)
    } catch {
      setTnError("No se pudo conectar con Tiendanube.")
    } finally {
      setTnLoading(false)
    }
  }

  const deleteSavedList = async (id: string) => {
    await supabase.from("saved_lists").delete().eq("id", id)
    setSavedLists((prev) => prev.filter((l) => l.id !== id))
  }

  const loadSampleTemplates = async () => {
    if (sampleTemplates.length > 0) { setShowSamplePicker(true); return }
    setLoadingSampleTemplates(true)

    // Extract variables from preset templates
    const presetItems = PRESET_TEMPLATES.filter((p) => p.id !== "blank").map((p) => ({
      id: `preset:${p.id}`,
      name: `${p.emoji} ${p.name} (predeterminada)`,
      variables: Array.from(new Set(
        p.canvas.elements
          .flatMap((el) => [...(el.content ?? "").matchAll(/\{\{(\w+)(?:\+[^}]*)?\}\}/g)].map((m) => m[1]))
          .filter((v) => !["hoy"].includes(v))
      )),
    }))

    const { data: { user } } = await supabase.auth.getUser()
    let userItems: { id: string; name: string; variables: string[] }[] = []
    if (user) {
      const { data } = await supabase
        .from("templates")
        .select("id, name, variables")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) userItems = data
    }

    setSampleTemplates([...userItems, ...presetItems])
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
    <>
    {/* Tiendanube import modal */}
    {showTNModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#14cce4]" />
              Importar desde Tiendanube
            </h3>
            <button onClick={() => { setShowTNModal(false); setTnError("") }} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Pegá la URL de tu tienda y traemos todos los productos automáticamente.
          </p>
          <input
            type="text"
            placeholder="mitienda.mitiendanube.com"
            value={tnUrl}
            onChange={(e) => { setTnUrl(e.target.value); setTnError("") }}
            onKeyDown={(e) => e.key === "Enter" && importFromTiendanube()}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-1"
          />
          {tnError && <p className="text-xs text-destructive mt-1 mb-2">{tnError}</p>}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => { setShowTNModal(false); setTnError("") }}>
              Cancelar
            </Button>
            <Button className="flex-1 gap-2" onClick={importFromTiendanube} disabled={tnLoading}>
              {tnLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {tnLoading ? "Importando..." : "Importar productos"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Solo funciona con tiendas públicas. Para tiendas privadas, usá el ID numérico de tu tienda.
          </p>
        </div>
      </div>
    )}
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

            {/* Tiendanube import */}
            <div className="rounded-xl border border-border bg-card p-4">
              {tnLastSync ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-[#14cce4]" />
                        Tiendanube conectada
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{tnLastSync.url}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {tnLastSync.total} productos
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tnLastSync.syncedAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      disabled={tnLoading}
                      onClick={async () => {
                        setTnUrl(tnLastSync.url)
                        setTnError("")
                        setTnLoading(true)
                        try {
                          const res = await fetch("/api/tiendanube/products", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ storeUrl: tnLastSync.url }),
                          })
                          const result = await res.json()
                          if (!res.ok) { setError(result.error || "Error al sincronizar."); return }
                          const syncInfo = { url: tnLastSync.url, syncedAt: new Date().toISOString(), total: result.total }
                          localStorage.setItem("tn_last_sync", JSON.stringify(syncInfo))
                          setTnLastSync(syncInfo)
                          analytics.tiendanubeSynced(result.total)
                          setData({ columns: result.columns, rows: result.rows, fileName: `Tiendanube · ${tnLastSync.url}`, totalRows: result.total })
                          setExcludedRows(new Set())
                          setQuantityColumn("cantidad")
                          setStep(2)
                          loadTemplates(result.columns)
                        } catch { setError("No se pudo sincronizar.") }
                        finally { setTnLoading(false) }
                      }}
                    >
                      {tnLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Sincronizar ahora
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowTNModal(true)}>
                      Cambiar tienda
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-[#14cce4]" />
                      Importar desde Tiendanube
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Traé tus productos directo sin pasar por Excel</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={() => setShowTNModal(true)}>
                    <ShoppingBag className="h-4 w-4" />
                    Conectar tienda
                  </Button>
                </div>
              )}
            </div>

            {/* Saved lists */}
            {savedLists.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Tus listas guardadas</p>
                <p className="text-xs text-muted-foreground mt-0.5">Reusá una lista que ya cargaste antes — la podés editar antes de imprimir</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {savedLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary transition-colors"
                    >
                      <FileSpreadsheet className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <button onClick={() => useSavedList(list)} className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{list.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {list.row_count} filas · {list.columns.length} columnas
                        </p>
                      </button>
                      <button
                        onClick={() => deleteSavedList(list.id)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        title="Eliminar lista"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
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
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{data.fileName}</p>
                <p className="text-xs text-muted-foreground">{data.totalRows} filas · {data.columns.length} columnas detectadas</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 flex-shrink-0"
                onClick={handleSaveList}
                disabled={savingList}
              >
                {savingList
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : <FileSpreadsheet className="h-4 w-4" />}
                Guardar lista
              </Button>
              <button onClick={() => { setData(null); setStep(1) }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

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

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Plantilla de etiqueta</h3>
              {suggestedMatch && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-foreground">
                    Sugerimos <strong>{suggestedMatch.name}</strong> — coincide con {suggestedMatch.matched} de {suggestedMatch.total} variables de tu Excel. Ya la seleccionamos, podés cambiarla.
                  </p>
                </div>
              )}
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

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Vista previa de datos</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Destildá las filas que no querés imprimir esta vez —
                    <strong className="text-foreground"> {includedCount} de {data.totalRows} seleccionadas</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setExcludedRows(new Set())} className="text-xs text-primary hover:underline">Todas</button>
                  <button
                    onClick={() => setExcludedRows(new Set(data.rows.map((_, i) => i)))}
                    className="text-xs text-primary hover:underline"
                  >Ninguna</button>
                  <button onClick={() => setPreviewRows(previewRows === 3 ? data.totalRows : 3)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Eye className="h-3 w-3" />
                    {previewRows === 3 ? "Ver todo" : "Ver menos"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 w-8"></th>
                      {data.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.rows.slice(0, previewRows).map((row, i) => {
                      const excluded = excludedRows.has(i)
                      return (
                        <tr
                          key={i}
                          className={cn("hover:bg-muted/50 cursor-pointer", excluded && "opacity-40")}
                          onClick={() => setExcludedRows((prev) => {
                            const next = new Set(prev)
                            if (next.has(i)) next.delete(i); else next.add(i)
                            return next
                          })}
                        >
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={!excluded} readOnly className="accent-primary" />
                          </td>
                          {data.columns.map((col) => (
                            <td key={col} className={cn("px-3 py-2 text-foreground", excluded && "line-through")}>{row[col]}</td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {data.totalRows > previewRows && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando {previewRows} de {data.totalRows} filas — tocá <strong>Ver todo</strong> para elegir cuáles imprimir
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(3)} disabled={!selectedTemplate || includedCount === 0} className="gap-2">
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
                  <p className="text-3xl font-bold text-foreground">{includedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Filas seleccionadas{includedCount !== data.totalRows ? ` (de ${data.totalRows})` : ""}
                  </p>
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
    </>
  )
}
