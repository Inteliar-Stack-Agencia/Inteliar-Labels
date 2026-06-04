"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  X,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedData {
  columns: string[]
  rows: Record<string, string>[]
}

// Mock uploaded data
const mockData: UploadedData = {
  columns: ["empresa", "plato", "cantidad", "codigo", "fecha"],
  rows: [
    { empresa: "Acme Corp", plato: "PRD-001", cantidad: "10", codigo: "ABC123", fecha: "2024-01-15" },
    { empresa: "Acme Corp", plato: "PRD-002", cantidad: "25", codigo: "DEF456", fecha: "2024-01-15" },
    { empresa: "Beta Inc", plato: "PRD-003", cantidad: "5", codigo: "GHI789", fecha: "2024-01-16" },
    { empresa: "Gamma Ltd", plato: "PRD-004", cantidad: "15", codigo: "JKL012", fecha: "2024-01-16" },
    { empresa: "Delta Co", plato: "PRD-005", cantidad: "30", codigo: "MNO345", fecha: "2024-01-17" },
  ],
}

const templateVariables = ["{{empresa}}", "{{plato}}", "{{codigo}}", "{{fecha}}"]

export default function UploadPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [data, setData] = useState<UploadedData | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".csv"))) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    // Simulate parsing - in real app, use xlsx or papaparse
    setTimeout(() => {
      setData(mockData)
      // Auto-map columns that match template variables
      const autoMappings: Record<string, string> = {}
      mockData.columns.forEach((col) => {
        const matchingVar = templateVariables.find(
          (v) => v.replace(/[{}]/g, "").toLowerCase() === col.toLowerCase()
        )
        if (matchingVar) {
          autoMappings[col] = matchingVar
        }
      })
      setColumnMappings(autoMappings)
    }, 500)
  }

  const totalLabels = data?.rows.reduce((sum, row) => sum + parseInt(row.cantidad || "1"), 0) || 0

  const handleGenerateLabels = () => {
    router.push("/preview")
  }

  return (
    <DashboardLayout>
      <Header
        title="Cargar datos"
        description="Importá datos desde archivos Excel o CSV"
      />

      <div className="p-6 space-y-6">
        {/* Upload Area */}
        {!data && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Soltá tu archivo acá
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                o hacé clic para buscar archivos Excel (.xlsx) o CSV
              </p>
            </div>
          </div>
        )}

        {/* File Info */}
        {uploadedFile && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <FileSpreadsheet className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-card-foreground">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.rows.length} filas, ${data.columns.length} columnas` : "Procesando..."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setUploadedFile(null)
                setData(null)
                setColumnMappings({})
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Data Preview & Column Mapping */}
        {data && (
          <>
            {/* Column Mapping */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-card-foreground">
                    Mapeo de columnas
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Asociá las columnas de tus datos con las variables del template
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                  <Check className="h-3.5 w-3.5" />
                  {Object.keys(columnMappings).length} columnas mapeadas
                </div>
              </div>

              <div className="divide-y divide-border">
                {data.columns.map((column) => (
                  <div
                    key={column}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-mono text-muted-foreground">
                        {column.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{column}</p>
                        <p className="text-xs text-muted-foreground">
                          Ejemplo: {data.rows[0]?.[column] || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <select
                        value={columnMappings[column] || ""}
                        onChange={(e) =>
                          setColumnMappings({
                            ...columnMappings,
                            [column]: e.target.value,
                          })
                        }
                        className="h-9 w-40 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Omitir columna</option>
                        {templateVariables.map((variable) => (
                          <option key={variable} value={variable}>
                            {variable}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Detection */}
            <div className="flex items-center gap-4 rounded-xl border border-warning/50 bg-warning/5 p-4">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Columna de cantidad detectada: &quot;cantidad&quot;
                </p>
                <p className="text-sm text-muted-foreground">
                  Cada fila generará la cantidad de etiquetas indicada en esta columna
                </p>
              </div>
              <span className="rounded-full bg-warning/20 px-3 py-1 text-sm font-medium text-warning">
                Total: {totalLabels} etiquetas
              </span>
            </div>

            {/* Data Preview Table */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-semibold text-card-foreground">
                  Vista previa de los datos
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      {data.columns.map((col) => (
                        <th key={col} className="px-6 py-3 font-medium">
                          {col}
                          {columnMappings[col] && (
                            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                              {columnMappings[col]}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.rows.map((row, idx) => (
                      <tr key={idx} className="text-sm">
                        {data.columns.map((col) => (
                          <td
                            key={col}
                            className="px-6 py-3 text-card-foreground"
                          >
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button size="lg" className="gap-2" onClick={handleGenerateLabels}>
                Generar etiquetas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
