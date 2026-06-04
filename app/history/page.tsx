"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  FileStack,
  Printer,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HistoryEntry {
  id: string
  type: "print" | "template" | "upload"
  action: string
  details: string
  timestamp: string
  status?: "success" | "error"
  user: string
}

const mockHistory: HistoryEntry[] = [
  {
    id: "1",
    type: "print",
    action: "Trabajo de impresión completado",
    details: "150 etiquetas impresas con Etiqueta de Producto A",
    timestamp: "2024-01-18 14:35",
    status: "success",
    user: "Juan Pérez",
  },
  {
    id: "2",
    type: "upload",
    action: "Datos cargados",
    details: "productos_lote_01.xlsx - 500 filas",
    timestamp: "2024-01-18 14:30",
    status: "success",
    user: "Juan Pérez",
  },
  {
    id: "3",
    type: "template",
    action: "Template creado",
    details: "Nuevo template: Etiqueta de Envío v2",
    timestamp: "2024-01-18 13:15",
    status: "success",
    user: "Ana García",
  },
  {
    id: "4",
    type: "print",
    action: "Trabajo de impresión fallido",
    details: "Conexión perdida con Zebra ZD420",
    timestamp: "2024-01-18 12:30",
    status: "error",
    user: "Juan Pérez",
  },
  {
    id: "5",
    type: "print",
    action: "Trabajo de impresión completado",
    details: "200 etiquetas impresas con Etiqueta de Código de Barras",
    timestamp: "2024-01-18 10:05",
    status: "success",
    user: "Ana García",
  },
  {
    id: "6",
    type: "template",
    action: "Template modificado",
    details: "Actualizado: Etiqueta de Producto A",
    timestamp: "2024-01-17 16:00",
    status: "success",
    user: "Juan Pérez",
  },
  {
    id: "7",
    type: "print",
    action: "Trabajo de impresión completado",
    details: "320 etiquetas impresas con Etiqueta de Inventario",
    timestamp: "2024-01-17 15:30",
    status: "success",
    user: "Ana García",
  },
  {
    id: "8",
    type: "upload",
    action: "Datos cargados",
    details: "actualizacion_inventario.csv - 1200 filas",
    timestamp: "2024-01-17 14:00",
    status: "success",
    user: "Juan Pérez",
  },
]

const typeIcons = {
  print: Printer,
  template: FileStack,
  upload: Tag,
}

const typeColors = {
  print: "bg-primary/10 text-primary",
  template: "bg-chart-3/10 text-chart-3",
  upload: "bg-success/10 text-success",
}

export default function HistoryPage() {
  const [dateFilter, setDateFilter] = useState("all")
  const [templateFilter, setTemplateFilter] = useState("all")

  return (
    <DashboardLayout>
      <Header
        title="Historial"
        description="Registro completo de actividad"
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">Todos los tipos</option>
              <option value="print">Trabajos de impresión</option>
              <option value="template">Templates</option>
              <option value="upload">Cargas</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            Mostrando {mockHistory.length} entradas
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {mockHistory.map((entry, index) => {
              const Icon = typeIcons[entry.type]
              const isLast = index === mockHistory.length - 1

              return (
                <div key={entry.id} className="flex gap-4 p-6">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        typeColors[entry.type]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast && (
                      <div className="mt-2 h-full w-px bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-card-foreground">
                            {entry.action}
                          </p>
                          {entry.status && (
                            <span
                              className={cn(
                                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                entry.status === "success"
                                  ? "bg-success/10 text-success"
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {entry.status === "success" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {entry.status === "success" ? "éxito" : "error"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.details}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {entry.timestamp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          por {entry.user}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Load More */}
        <div className="mt-6 flex justify-center">
          <Button variant="outline">Cargar más</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
