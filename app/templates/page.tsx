"use client"

import { useState } from "react"
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
  QrCode,
  Barcode,
  Type,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  preview: "qr" | "barcode" | "text"
  lastUsed: string
  createdAt: string
}

const mockTemplates: Template[] = [
  { id: "1", name: "Etiqueta de Producto A", preview: "qr", lastUsed: "hace 2 horas", createdAt: "2024-01-15" },
  { id: "2", name: "Etiqueta de Envío", preview: "barcode", lastUsed: "Ayer", createdAt: "2024-01-10" },
  { id: "3", name: "Etiqueta de Código de Barras", preview: "barcode", lastUsed: "hace 3 días", createdAt: "2024-01-05" },
  { id: "4", name: "Etiqueta QR", preview: "qr", lastUsed: "hace 1 semana", createdAt: "2023-12-20" },
  { id: "5", name: "Etiqueta de Inventario", preview: "text", lastUsed: "hace 2 semanas", createdAt: "2023-12-15" },
  { id: "6", name: "Etiqueta de Precio", preview: "text", lastUsed: "hace 1 mes", createdAt: "2023-11-30" },
]

const previewIcons = {
  qr: QrCode,
  barcode: Barcode,
  text: Type,
}

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <DashboardLayout>
      <Header
        title="Templates"
        description="Gestioná tus templates de etiquetas"
        actions={
          <Link href="/templates/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear template
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* View Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {mockTemplates.length} templates
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

        {/* Templates Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mockTemplates.map((template) => {
              const PreviewIcon = previewIcons[template.preview]
              return (
                <div
                  key={template.id}
                  className="group relative rounded-xl border border-border bg-card transition-all hover:border-primary"
                >
                  {/* Preview Area */}
                  <div className="flex h-40 items-center justify-center border-b border-border bg-muted/30">
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-background">
                      <PreviewIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-card-foreground">
                          {template.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Último uso: {template.lastUsed}
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
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Nombre</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Último uso</th>
                  <th className="px-6 py-3 font-medium">Creado</th>
                  <th className="px-6 py-3 font-medium sr-only">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockTemplates.map((template) => {
                  const PreviewIcon = previewIcons[template.preview]
                  return (
                    <tr
                      key={template.id}
                      className="group transition-colors hover:bg-muted/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <PreviewIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-card-foreground">
                            {template.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground capitalize">
                        {template.preview}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {template.lastUsed}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {template.createdAt}
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
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
