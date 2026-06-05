"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

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
      const { data } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: `${template.name} (copia)`,
          description: template.description,
          width_mm: template.width_mm,
          height_mm: template.height_mm,
          variables: template.variables,
        })
        .select()
        .single()
      if (data) setTemplates((prev) => [data, ...prev])
    } catch {
      // silent
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Templates"
        description="Gestioná tus templates de etiquetas"
        actions={
          <Link href="/templates/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva plantilla
            </Button>
          </Link>
        }
      />

      <div className="p-6">
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
      </div>
    </DashboardLayout>
  )
}
