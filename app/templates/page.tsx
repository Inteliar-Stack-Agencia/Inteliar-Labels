"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  FileStack,
  Download,
  Upload,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { PRESET_TEMPLATES } from "@/lib/preset-templates"
import { usePlanLimits } from "@/lib/use-plan-limits"
import { Lock, Sparkles } from "lucide-react"
import { AiChatTemplateModal } from "@/components/dashboard/ai-chat-template-modal"

interface Template {
  id: string
  name: string
  description: string | null
  width_mm: number
  height_mm: number
  variables: string[] | null
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const planLimits = usePlanLimits()
  const importInputRef = useRef<HTMLInputElement>(null)
  const [showAiChat, setShowAiChat] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("templates")
        .select("id, name, description, width_mm, height_mm, variables, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setTemplates(data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    try {
      await supabase.from("templates").delete().eq("id", id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch {
      // silent
    }
  }

  async function handleDuplicate(template: Template) {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Re-fetch the full row so we also copy the design (canvas_data)
      const { data: full } = await supabase
        .from("templates")
        .select("*")
        .eq("id", template.id)
        .single()
      const { data } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: `${template.name} (copia)`,
          description: full?.description ?? template.description,
          width_mm: template.width_mm,
          height_mm: template.height_mm,
          variables: template.variables,
          canvas_data: full?.canvas_data ?? null,
        })
        .select()
        .single()
      if (data) setTemplates((prev) => [data, ...prev])
    } catch {
      // silent
    }
  }

  async function handleExportExcel(template: Template) {
    const XLSX = await import("xlsx")
    const variableColumns = template.variables && template.variables.length > 0 ? template.variables : ["dato"]
    // "cantidad" is auto-detected by /upload as the copies-per-row column
    // (see useSavedList's cantCol lookup) — include it so users know it's
    // supported without having to discover it themselves.
    const columns = [...variableColumns, "cantidad"]
    const exampleRow = Object.fromEntries([
      ...variableColumns.map((c) => [c, `ejemplo ${c}`]),
      ["cantidad", 1],
    ])
    const worksheet = XLSX.utils.json_to_sheet([exampleRow])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")
    const safeName = template.name.replace(/[^\w\-\. ]+/g, "").trim() || "plantilla"
    XLSX.writeFile(workbook, `${safeName}.xlsx`)
  }

  async function handleExportAll() {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("templates")
        .select("name, description, width_mm, height_mm, variables, canvas_data")
        .eq("user_id", user.id)
      const backup = {
        app: "inteliar-label",
        type: "templates-backup",
        version: 1,
        exported_at: new Date().toISOString(),
        templates: data ?? [],
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `inteliar-plantillas-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const supabase = createClient()
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const items = Array.isArray(parsed) ? parsed : parsed.templates
      if (!Array.isArray(items) || items.length === 0) {
        alert("El archivo no contiene plantillas válidas.")
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const rows = items.map((t: any) => ({
        user_id: user.id,
        name: t.name ? `${t.name} (importada)` : "Plantilla importada",
        description: t.description ?? null,
        width_mm: t.width_mm ?? 80,
        height_mm: t.height_mm ?? 40,
        variables: t.variables ?? [],
        canvas_data: t.canvas_data ?? null,
      }))
      const { data } = await supabase.from("templates").insert(rows).select()
      if (data) setTemplates((prev) => [...data, ...prev])
      alert(`Se importaron ${data?.length ?? 0} plantilla(s).`)
    } catch {
      alert("No se pudo leer el archivo. Asegurate de que sea un backup de Inteliar Label.")
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Templates"
        description="Gestioná tus templates de etiquetas"
        actions={
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
            <Button size="sm" variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleExportAll} disabled={templates.length === 0}>
              <Download className="h-4 w-4" />
              Backup
            </Button>
            {planLimits.canCreateTemplate ? (
              <Link href="/templates/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nueva plantilla
                </Button>
              </Link>
            ) : (
              <a href="/#pricing">
                <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                  <Lock className="h-4 w-4" />
                  Trial vencido · Ver planes
                </Button>
              </a>
            )}
          </div>
        }
      />

      <div className="p-6">
        {/* Trial banner */}
        {!planLimits.loading && (planLimits.plan === "trial" || planLimits.plan === "expired") && (
          <div className={cn(
            "mb-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm",
            planLimits.trialExpired
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-border bg-muted/40 text-muted-foreground"
          )}>
            <span>
              {planLimits.trialExpired
                ? "Tu período de prueba de 15 días venció."
                : `Trial gratuito · ${planLimits.trialDaysLeft} día${planLimits.trialDaysLeft !== 1 ? "s" : ""} restante${planLimits.trialDaysLeft !== 1 ? "s" : ""}`}
            </span>
            <a href="/#pricing" className="font-medium underline underline-offset-2 whitespace-nowrap">
              {planLimits.trialExpired ? "Activar licencia" : "Ver planes"}
            </a>
          </div>
        )}

        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando…" : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-2 transition-colors",
                viewMode === "list"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Cargando templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <FileStack className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No tenés templates todavía</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Creá tu primera plantilla de etiquetas para comenzar
            </p>
            <Link href="/templates/new">
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Nueva plantilla
              </Button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative rounded-xl border border-border bg-card transition-all hover:border-primary"
              >
                {/* Preview Area */}
                <div className="flex h-40 items-center justify-center border-b border-border bg-muted/30">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background">
                    <FileStack className="h-10 w-10 text-muted-foreground" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-card-foreground truncate">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {template.width_mm} × {template.height_mm} mm
                      </p>
                      {template.variables && template.variables.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {template.variables.length} variable{template.variables.length !== 1 ? "s" : ""}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Creado: {formatDate(template.created_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/templates/${template.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportExcel(template)}>
                          <Download className="mr-2 h-4 w-4" />
                          Exportar planilla
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Dimensiones</th>
                  <th className="px-6 py-3 font-medium">Variables</th>
                  <th className="px-6 py-3 font-medium">Creado</th>
                  <th className="px-6 py-3 font-medium sr-only">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="group transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <FileStack className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-card-foreground">
                          {template.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {template.width_mm} × {template.height_mm} mm
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {template.variables ? template.variables.length : 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/templates/${template.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportExcel(template)}>
                              <Download className="mr-2 h-4 w-4" />
                              Exportar planilla
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Plantillas predeterminadas */}
        <div className="mt-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">¿Qué querés etiquetar?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Elegí una plantilla base y la personalizás en segundos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
              onClick={() => setShowAiChat(true)}
            >
              <Sparkles className="h-4 w-4" />
              Armar plantilla charlando con la IA
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRESET_TEMPLATES.map((preset) => (
              <Link
                key={preset.id}
                href={`/templates/new?preset=${preset.id}`}
                className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                  {preset.emoji}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-card-foreground group-hover:text-primary">
                    {preset.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {preset.widthMm} × {preset.heightMm} mm
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {showAiChat && <AiChatTemplateModal onClose={() => setShowAiChat(false)} />}
    </DashboardLayout>
  )
}
