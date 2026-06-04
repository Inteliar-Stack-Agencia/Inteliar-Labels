"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Save,
  Type,
  QrCode,
  Barcode,
  GripVertical,
  Trash2,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ElementType = "text" | "qr" | "barcode"

interface LabelElement {
  id: string
  type: ElementType
  content: string
  x: number
  y: number
  fontSize: number
}

const elementIcons = {
  text: Type,
  qr: QrCode,
  barcode: Barcode,
}

const defaultElements: LabelElement[] = [
  { id: "1", type: "text", content: "{{empresa}}", x: 10, y: 10, fontSize: 14 },
  { id: "2", type: "qr", content: "{{plato}}", x: 150, y: 50, fontSize: 12 },
]

export default function TemplateEditorPage() {
  const [elements, setElements] = useState<LabelElement[]>(defaultElements)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("Template sin título")

  const selectedElementData = elements.find((el) => el.id === selectedElement)

  const addElement = (type: ElementType) => {
    const newElement: LabelElement = {
      id: Date.now().toString(),
      type,
      content: type === "text" ? "Nuevo texto" : `{{variable_${elements.length + 1}}}`,
      x: 50,
      y: 50,
      fontSize: 12,
    }
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id))
    if (selectedElement === id) setSelectedElement(null)
  }

  return (
    <DashboardLayout>
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/templates"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div className="h-6 w-px bg-border" />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent text-lg font-semibold text-foreground focus:outline-none"
          />
        </div>
        <Button size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Guardar template
        </Button>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-2xl">
            {/* Toolbox */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Agregar elemento:</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => addElement("text")}
              >
                <Type className="h-4 w-4" />
                Texto
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => addElement("qr")}
              >
                <QrCode className="h-4 w-4" />
                Código QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => addElement("barcode")}
              >
                <Barcode className="h-4 w-4" />
                Código de barras
              </Button>
            </div>

            {/* Label Preview Canvas */}
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg rounded-xl border-2 border-dashed border-border bg-background shadow-lg">
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, var(--border) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Elements */}
              {elements.map((element) => {
                const Icon = elementIcons[element.type]
                return (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={cn(
                      "absolute cursor-pointer rounded border-2 p-2 transition-colors",
                      selectedElement === element.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-border"
                    )}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span
                        className="text-foreground"
                        style={{ fontSize: `${element.fontSize}px` }}
                      >
                        {element.content}
                      </span>
                    </div>
                    {selectedElement === element.id && (
                      <div className="absolute -left-px -top-6 flex items-center gap-1 rounded-t bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <GripVertical className="h-3 w-3" />
                        {element.type.toUpperCase()}
                      </div>
                    )}
                  </div>
                )
              })}

              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Agregá elementos a tu etiqueta
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Hacé clic en los elementos para editar sus propiedades
            </p>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 border-l border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Propiedades</h2>
          </div>

          {selectedElementData ? (
            <div className="p-4 space-y-4">
              {/* Element Type */}
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                {(() => {
                  const Icon = elementIcons[selectedElementData.type]
                  return <Icon className="h-5 w-5 text-muted-foreground" />
                })()}
                <span className="text-sm font-medium text-foreground capitalize">
                  Elemento {selectedElementData.type}
                </span>
              </div>

              {/* Content */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Contenido / Variable
                </label>
                <input
                  type="text"
                  value={selectedElementData.content}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, { content: e.target.value })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Ingresá contenido o {{variable}}"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Usá la sintaxis {"{{variable}}"} para contenido dinámico
                </p>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Posición X
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.x}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { x: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Posición Y
                  </label>
                  <input
                    type="number"
                    value={selectedElementData.y}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { y: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Font Size (for text elements) */}
              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Tamaño de fuente
                </label>
                <input
                  type="number"
                  value={selectedElementData.fontSize}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Delete Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => deleteElement(selectedElementData.id)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar elemento
              </Button>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Seleccioná un elemento para editarlo
              </p>
            </div>
          )}

          {/* Elements List */}
          <div className="border-t border-border">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Elementos</h3>
            </div>
            <div className="divide-y divide-border">
              {elements.map((element) => {
                const Icon = elementIcons[element.type]
                return (
                  <button
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      selectedElement === element.id
                        ? "bg-sidebar-accent"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm text-foreground">
                      {element.content}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
