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
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { PRESET_TEMPLATES } from "@/lib/preset-templates"
import { renderLabelToPng } from "@/lib/label-image"
import { analytics } from "@/lib/analytics"
import { IMPORT_HANDOFF_KEY, type ImportHandoff } from "@/lib/import-handoff"

interface ParsedData {
  columns: string[]
  rows: Record<string, string>[]
  fileName: string
  totalRows: number
}

const DAY_NAMES_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

function detectDayColumn(columns: string[]): string | null {
  return columns.find((c) => ["dia", "día", "day", "weekday"].includes(c.toLowerCase().trim())) ?? null
}

function normalizeDay(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

// Unaccented, in getDay() order (0 = domingo) — used to match weekday columns
// regardless of accents/case in the Excel header.
const WEEKDAY_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

/**
 * Detects a "wide" weekly format: one column per weekday (LUNES, MARTES...)
 * instead of a single "Día" column with one row per day. Common when a
 * client keeps one weekly file with a column per day's value per person.
 * Returns the matched columns in weekday order, or [] if fewer than 2 match
 * (a single stray column named like a day isn't worth the extra UI).
 */
function detectWeekdayColumns(columns: string[]): string[] {
  const matches = columns
    .map((col) => ({ col, index: WEEKDAY_KEYS.indexOf(normalizeDay(col)) }))
    .filter((m) => m.index !== -1)
    .sort((a, b) => a.index - b.index)
  return matches.length >= 2 ? matches.map((m) => m.col) : []
}

/** Matches the casing style of an existing column, so a suggested variable
 * name (e.g. "del_dia") reads consistently next to columns like "LUNES". */
function matchCase(sample: string, text: string): string {
  if (sample === sample.toUpperCase()) return text.toUpperCase()
  if (sample === sample.toLowerCase()) return text.toLowerCase()
  return text
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
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set())
  const [suggestedMatch, setSuggestedMatch] = useState<{ name: string; matched: number; total: number } | null>(null)
  const [filterColumn, setFilterColumn] = useState<string>("")
  const [filterValue, setFilterValue] = useState<string>("")
  const [weekdayColumns, setWeekdayColumns] = useState<string[]>([])
  const [weekdayVarName, setWeekdayVarName] = useState<string>("")
  const [weekdaySource, setWeekdaySource] = useState<string>("")

  useEffect(() => {
    loadSavedLists()

    // Handoff from /integraciones (Tiendanube / Mercado Libre import)
    const params = new URLSearchParams(window.location.search)
    if (params.get("imported")) {
      window.history.replaceState({}, "", window.location.pathname)
      try {
        const raw = sessionStorage.getItem(IMPORT_HANDOFF_KEY)
        sessionStorage.removeItem(IMPORT_HANDOFF_KEY)
        if (raw) {
          const handoff: ImportHandoff = JSON.parse(raw)
          setData(handoff)
          setExcludedRows(new Set())
          applyDayColumnDefault(handoff.columns, handoff.rows)
          applyWeekdayColumnsDefault(handoff.columns)
          setStep(2)
          loadTemplates(handoff.columns)
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the file has a "día"/"day" column, default the filter to today's
  // weekday when that value actually appears in the data — matches the
  // BarTender-style workflow where the same weekly file is filtered by
  // day before printing, instead of requiring a separate file per day.
  const applyDayColumnDefault = (columns: string[], rows: Record<string, string>[]) => {
    const dayCol = detectDayColumn(columns)
    if (!dayCol) {
      setFilterColumn("")
      setFilterValue("")
      return
    }
    setFilterColumn(dayCol)
    const todayName = DAY_NAMES_ES[new Date().getDay()]
    const values = rows.map((r) => String(r[dayCol] ?? "").trim())
    const todayMatch = values.find((v) => v.toLowerCase() === todayName)
    setFilterValue(todayMatch ?? "")
  }

  // If the file has one column per weekday (LUNES, MARTES...) instead of a
  // single "Día" column, there's no one column a template can point to.
  // Detect that shape and offer a synthetic variable whose value is picked
  // from today's (or a chosen) weekday column, so the template only needs
  // one placeholder instead of one per day.
  const applyWeekdayColumnsDefault = (columns: string[]) => {
    const cols = detectWeekdayColumns(columns)
    setWeekdayColumns(cols)
    if (cols.length === 0) {
      setWeekdayVarName("")
      setWeekdaySource("")
      return
    }
    const todayKey = WEEKDAY_KEYS[new Date().getDay()]
    const todayCol = cols.find((c) => normalizeDay(c) === todayKey)
    setWeekdaySource(todayCol ?? cols[0])
    setWeekdayVarName(matchCase(cols[0], "del_dia"))
  }

  const withWeekdayVar = (row: Record<string, string>) =>
    weekdayVarName && weekdaySource
      ? { ...row, [weekdayVarName]: row[weekdaySource] ?? "" }
      : row

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
        // Some Excel builds (seen with an unlicensed/non-activated copy) save
        // a stale "!ref" dimension — e.g. "A1:B1" — that doesn't cover all the
        // actual cells in the sheet. SheetJS trusts that declared range and
        // silently drops everything outside it, so a 13-row file can come
        // back as "1 row detected" even though the real cell data is present.
        // Recompute the true range from the actual cell addresses before
        // parsing, instead of trusting the file's own (possibly wrong) range.
        const cellAddresses = Object.keys(sheet).filter((k) => k[0] !== "!")
        if (cellAddresses.length > 0) {
          const range = cellAddresses.reduce(
            (acc, addr) => {
              const { r, c } = XLSX.utils.decode_cell(addr)
              return {
                s: { r: Math.min(acc.s.r, r), c: Math.min(acc.s.c, c) },
                e: { r: Math.max(acc.e.r, r), c: Math.max(acc.e.c, c) },
              }
            },
            { s: { r: Infinity, c: Infinity }, e: { r: -Infinity, c: -Infinity } }
          )
          sheet["!ref"] = XLSX.utils.encode_range(range)
        }
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

        applyDayColumnDefault(columns, jsonData)
        applyWeekdayColumnsDefault(columns)

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

    // Auto-suggest the template whose variables best match the Excel columns.
    // Rank by match RATIO (matched/total) first, not raw matched count — a
    // template needing just {{plato}} and getting it is a better fit than
    // one needing {{plato}} + {{comensal}} and only getting plato, even
    // though both have "matched = 1". Raw count only breaks ties between
    // equally-proportioned matches.
    if (columns && columns.length > 0) {
      const cols = columns.map((c) => c.toLowerCase().trim())
      let best: { id: string; name: string; matched: number; total: number; ratio: number } | null = null
      for (const t of tmpl) {
        const vars = (t.variables ?? []).map((v: string) => v.toLowerCase().trim())
        if (vars.length === 0) continue
        const matched = vars.filter((v: string) => cols.includes(v)).length
        const ratio = matched / vars.length
        if (!best || ratio > best.ratio || (ratio === best.ratio && matched > best.matched)) {
          best = { id: t.id, name: t.name, matched, total: vars.length, ratio }
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

  const filterValues = data && filterColumn
    ? Array.from(new Set(data.rows.map((r) => String(r[filterColumn] ?? "").trim()).filter(Boolean)))
    : []

  const matchesFilter = (row: Record<string, string>) => {
    if (filterColumn && filterValue && String(row[filterColumn] ?? "").trim() !== filterValue) return false
    // Wide weekly format: not every diner has a meal every day, so printing
    // "lunes" should skip rows with an empty cell in that day's column
    // instead of generating a blank label for them.
    if (weekdaySource && String(row[weekdaySource] ?? "").trim() === "") return false
    return true
  }

  const visibleRows = data ? data.rows.filter((row) => matchesFilter(row)).map(withWeekdayVar) : []
  const includedRows = data
    ? data.rows.filter((row, i) => !excludedRows.has(i) && matchesFilter(row)).map(withWeekdayVar)
    : []
  const includedCount = includedRows.length

  // Render a preview image of the first label once the user reaches the confirm step.
  useEffect(() => {
    if (step !== 3 || !selectedTemplate || includedRows.length === 0) return
    let cancelled = false
    setPreviewImgUrl(null)
    setPreviewError(null)
    ;(async () => {
      const { data: tmpl, error } = await supabase
        .from("templates")
        .select("width_mm, height_mm, canvas_data")
        .eq("id", selectedTemplate)
        .single()
      if (cancelled) return
      if (error || !tmpl) {
        setPreviewError("No se pudo generar la vista previa.")
        return
      }
      try {
        const url = await renderLabelToPng(tmpl, includedRows[0])
        if (!cancelled) setPreviewImgUrl(url)
      } catch {
        if (!cancelled) setPreviewError("No se pudo generar la vista previa.")
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedTemplate])

  // When none of the user's own templates matched, suggest the closest
  // built-in preset (e.g. the ML shipping/product presets) as a starting point.
  const matchingPresetId = (() => {
    if (!data?.columns) return null
    const cols = data.columns.map((c) => c.toLowerCase().trim())
    let best: { id: string; matched: number } | null = null
    for (const p of PRESET_TEMPLATES) {
      const vars = Array.from(
        new Set(
          p.canvas.elements.flatMap((el) => [...el.content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1].toLowerCase()))
        )
      )
      if (vars.length === 0) continue
      const matched = vars.filter((v) => cols.includes(v)).length
      if (matched > 0 && (!best || matched > best.matched)) {
        best = { id: p.id, matched }
      }
    }
    return best?.id ?? null
  })()

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

    if (error || !job) {
      setLoading(false)
      alert(`No se pudo crear el trabajo de impresión${error ? `: ${error.message}` : ""}. Probá de nuevo o contactanos si persiste.`)
      return
    }

    // Only include rows the user kept selected and that pass the active
    // column filter (re-indexed sequentially)
    const rowsToInsert = data.rows
      .filter((row, i) => !excludedRows.has(i) && matchesFilter(row))
      .map((row, i) => ({
        job_id: job.id,
        row_index: i,
        row_data: withWeekdayVar(row),
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
    applyDayColumnDefault(list.columns, list.rows)
    applyWeekdayColumnsDefault(list.columns)
    setStep(2)
    loadTemplates(list.columns)
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
    analytics.excelDownloaded()
    setShowSamplePicker(false)
  }

  return (
    <>
    <DashboardLayout>
      <Header
        title="Cargar datos"
        description="Subí tu Excel o CSV para generar etiquetas en lote"
      />

      <div className="p-6 space-y-6">
        <a
          href="/integraciones"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-foreground">¿Preferís importar directo desde Tiendanube o Mercado Libre?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Traé tus productos o pedidos sin pasar por Excel</p>
          </div>
          <span className="text-sm font-medium text-primary flex-shrink-0">Ir a Integraciones →</span>
        </a>
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
                size="default"
                className="gap-2 flex-shrink-0"
                onClick={handleSaveList}
                disabled={savingList}
              >
                {savingList
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  : <FileSpreadsheet className="h-4 w-4" />}
                Guardar lista frecuente
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
                {weekdayVarName && weekdaySource && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {`{{${weekdayVarName}}}`} · según el día
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Usá estas variables en tu plantilla de etiqueta</p>
            </div>

            {weekdayColumns.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Menú semanal detectado ({weekdayColumns.join(", ")})</h3>
                <p className="text-xs text-muted-foreground">
                  Tu Excel tiene una columna por día en vez de una sola columna &quot;Día&quot;. No hace falta poner
                  las {weekdayColumns.length} columnas en la plantilla: elegí un nombre de variable acá y usala una
                  sola vez — el sistema la completa con el valor de la columna del día que elijas.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">Nombre de la variable</label>
                    <input
                      type="text"
                      value={weekdayVarName}
                      onChange={(e) => setWeekdayVarName(e.target.value.trim())}
                      placeholder="del_dia"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">Día a imprimir</label>
                    <select
                      value={weekdaySource}
                      onChange={(e) => setWeekdaySource(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {weekdayColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {weekdayVarName && (
                  <p className="text-xs text-primary">
                    En la plantilla usá <strong>{`{{${weekdayVarName}}}`}</strong> — hoy va a mostrar el valor de <strong>{weekdaySource}</strong>.
                  </p>
                )}
                {weekdaySource && (
                  <p className="text-xs text-muted-foreground">
                    Se van a imprimir <strong className="text-foreground">{visibleRows.length} de {data.totalRows}</strong> comensales
                    — los que tienen algo cargado en <strong>{weekdaySource}</strong>. Las filas vacías ese día se saltean solas.
                  </p>
                )}
              </div>
            )}

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
              {!suggestedMatch && data?.columns && matchingPresetId && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                  <p className="text-foreground">
                    Ninguna de tus plantillas coincide con estas columnas. Tenemos una plantilla lista para este formato.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => {
                      if (data) {
                        sessionStorage.setItem(IMPORT_HANDOFF_KEY, JSON.stringify(data))
                      }
                      router.push(`/templates/new?preset=${matchingPresetId}&returnTo=upload`)
                    }}
                  >
                    Usar plantilla sugerida
                  </Button>
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

            {data.columns.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-semibold">Filtrar por columna</h3>
                <p className="text-xs text-muted-foreground">
                  Si tu Excel tiene una sola planilla con todo (por ejemplo, con una columna "Día"), elegí qué valor mostrar antes de imprimir — como cuando en BarTender filtrás por día.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={filterColumn}
                    onChange={(e) => { setFilterColumn(e.target.value); setFilterValue("") }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Sin filtro (mostrar todas las filas)</option>
                    {data.columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    disabled={!filterColumn}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    <option value="">Todos los valores</option>
                    {filterValues.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                {filterColumn && filterValue && (
                  <p className="text-xs text-primary">
                    Mostrando solo filas donde <strong>{filterColumn} = {filterValue}</strong> ({visibleRows.length} de {data.totalRows})
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Vista previa de datos</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Destildá las filas que no querés imprimir esta vez —
                    <strong className="text-foreground"> {includedCount} de {visibleRows.length} seleccionadas</strong>
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
                    {data.rows
                      .map((row, i) => ({ row, i }))
                      .filter(({ row }) => matchesFilter(row))
                      .slice(0, previewRows)
                      .map(({ row, i }) => {
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
              {visibleRows.length > previewRows && (
                <p className="text-xs text-muted-foreground text-center">
                  Mostrando {previewRows} de {visibleRows.length} filas — tocá <strong>Ver todo</strong> para elegir cuáles imprimir
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
              <div>
                <h4 className="text-sm font-semibold mb-2">Vista previa de impresión</h4>
                {previewError && <p className="text-xs text-destructive">{previewError}</p>}
                {!previewError && !previewImgUrl && (
                  <div className="flex items-center justify-center h-32 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {previewImgUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={previewImgUrl}
                      alt="Vista previa de la etiqueta"
                      className="border border-border rounded-lg bg-white max-w-full"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <p className="text-xs text-muted-foreground">Así se va a imprimir la primera etiqueta (con los datos de la primera fila seleccionada)</p>
                  </div>
                )}
              </div>
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
