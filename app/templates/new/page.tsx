"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft,
  Save,
  Type,
  QrCode,
  Barcode,
  GripVertical,
  Trash2,
  Plus,
  Settings2,
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
  bold: boolean
}

// Tamaños predefinidos comunes para impresoras térmicas
const PRESET_SIZES = [
  { label: "100 × 50 mm (viandas)", width: 100, height: 50 },
  { label: "100 × 100 mm (cuadrada)", width: 100, height: 100 },
  { label: "80 × 40 mm (pequeña)", width: 80, height: 40 },
  { label: "150 × 100 mm (grande)", width: 150, height: 100 },
  { label: "60 × 40 mm (precio)", width: 60, height: 40 },
  { label: "Personalizado", width: 0, height: 0 },
]

const elementIcons = {
  text: Type,
  qr: QrCode,
  barcode: Barcode,
}

export default function TemplateEditorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [templateName, setTemplateName] = useState("Template sin título")
  const [widthMm, setWidthMm] = useState(100)
  const [heightMm, setHeightMm] = useState(50)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [cutBetweenLabels, setCutBetweenLabels] = useState(true)
  const [elements, setElements] = useState<LabelElement[]>([
    { id: "1", type: "text", content: "{{empresa}}", x: 10, y: 10, fontSize: 16, bold: true },
    { id: "2", type: "text", content: "{{plato}}", x: 10, y: 35, fontSize: 12, bold: false },
  ])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSizePanel, setShowSizePanel] = useState(true)

  const selectedElementData = elements.find((el) => el.id === selectedElement)

  // Escala para visualizar mm en pantalla (3px por mm)
  const SCALE = 3
  const canvasW = widthMm * SCALE
  const canvasH = heightMm * SCALE

  const applyPreset = (index: number) => {
    setSelectedPreset(index)
    const preset = PRESET_SIZES[index]
    if (preset.width > 0) {
      setWidthMm(preset.width)
      setHeightMm(preset.height)
    }
  }

  const addElement = (type: ElementType) => {
    const newElement: LabelElement = {
      id: Date.now().toString(),
      type,
      content: type === "text" ? "Nuevo texto" : `{{variable_${elements.length + 1}}}`,
      x: 20,
      y: 20,
      fontSize: 12,
      bold: false,
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

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const variables = elements
      .map((el) => {
        const matches = el.content.match(/\{\{(\w+)\}\}/g)
        return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : []
      })
      .flat()
      .filter((v, i, arr) => arr.indexOf(v) === i)

    const { error } = await supabase.from("templates").insert({
      user_id: user.id,
      name: templateName,
      width_mm: widthMm,
      height_mm: heightMm,
      canvas_data: { elements, cutBetweenLabels },
      variables,
    })

    setSaving(false)
    if (!error) router.push("/templates")
  }

  return (
    <DashboardLayout>
      {/* Top Bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <Link href="/templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSizePanel(!showSizePanel)}>
            <Settings2 className="h-4 w-4" />
            Tamaño
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar template"}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-3xl space-y-6">

            {/* Size Configuration Panel */}
            {showSizePanel && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Configuración de etiqueta</h3>

                {/* Presets */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-muted-foreground">Tamaño predefinido</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => applyPreset(i)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedPreset === i
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom dimensions */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ancho (mm)</label>
                    <input
                      type="number"
                      value={widthMm}
                      onChange={(e) => { setWidthMm(Number(e.target.value)); setSelectedPreset(5) }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      min={20} max={300}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Alto (mm)</label>
                    <input
                      type="number"
                      value={heightMm}
                      onChange={(e) => { setHeightMm(Number(e.target.value)); setSelectedPreset(5) }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      min={10} max={300}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground w-full text-center">
                      {widthMm} × {heightMm} mm
                    </div>
                  </div>
                </div>

                {/* Cut between labels */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Corte automático entre etiquetas</p>
                    <p className="text-xs text-muted-foreground">La impresora corta el papel después de cada etiqueta</p>
                  </div>
                  <button
                    onClick={() => setCutBetweenLabels(!cutBetweenLabels)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      cutBetweenLabels ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      cutBetweenLabels ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>
            )}

            {/* Toolbox */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Agregar:</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("text")}>
                <Type className="h-4 w-4" /> Texto
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("qr")}>
                <QrCode className="h-4 w-4" /> QR
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("barcode")}>
                <Barcode className="h-4 w-4" /> Código de barras
              </Button>
            </div>

            {/* Label Canvas */}
            <div className="flex justify-center">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{widthMm} mm</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded">Vista previa a escala</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-muted-foreground" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      {heightMm} mm
                    </span>
                  </div>
                  <div
                    className="relative border-2 border-dashed border-border bg-white shadow-lg"
                    style={{ width: `${canvasW}px`, height: `${canvasH}px`, minWidth: "200px", minHeight: "100px" }}
                    onClick={() => setSelectedElement(null)}
                  >
                    {/* Grid */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
                      backgroundSize: `${SCALE * 10}px ${SCALE * 10}px`,
                    }} />

                    {/* Elements */}
                    {elements.map((element) => {
                      const Icon = elementIcons[element.type]
                      return (
                        <div
                          key={element.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id) }}
                          className={cn(
                            "absolute cursor-pointer rounded border-2 px-1.5 py-1 transition-colors",
                            selectedElement === element.id
                              ? "border-primary bg-primary/10"
                              : "border-transparent hover:border-border"
                          )}
                          style={{ left: `${element.x * SCALE / 10}px`, top: `${element.y * SCALE / 10}px` }}
                        >
                          {selectedElement === element.id && (
                            <div className="absolute -top-5 left-0 flex items-center gap-1 rounded-t bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground whitespace-nowrap">
                              <GripVertical className="h-2.5 w-2.5" />
                              {element.type.toUpperCase()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Icon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span
                              className="text-gray-800"
                              style={{ fontSize: `${element.fontSize}px`, fontWeight: element.bold ? "bold" : "normal" }}
                            >
                              {element.content}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {elements.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="mx-auto h-6 w-6 text-gray-300" />
                          <p className="mt-1 text-xs text-gray-400">Agregá elementos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Usá {"{{variable}}"} para contenido dinámico desde Excel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 border-l border-border bg-card overflow-y-auto">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Propiedades</h2>
          </div>

          {selectedElementData ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                {(() => { const Icon = elementIcons[selectedElementData.type]; return <Icon className="h-4 w-4 text-muted-foreground" /> })()}
                <span className="text-sm font-medium capitalize">Elemento {selectedElementData.type}</span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contenido / Variable</label>
                <input
                  type="text"
                  value={selectedElementData.content}
                  onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Texto o {{variable}}"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Usá {"{{nombre_columna}}"} para datos dinámicos</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pos. X (mm)</label>
                  <input type="number" value={selectedElementData.x}
                    onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pos. Y (mm)</label>
                  <input type="number" value={selectedElementData.y}
                    onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tamaño de fuente (px)</label>
                <input type="number" value={selectedElementData.fontSize}
                  onChange={(e) => updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Negrita</label>
                <button
                  onClick={() => updateElement(selectedElementData.id, { bold: !selectedElementData.bold })}
                  className={cn("rounded px-3 py-1 text-xs font-bold border transition-colors",
                    selectedElementData.bold ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                  )}
                >B</button>
              </div>

              <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => deleteElement(selectedElementData.id)}>
                <Trash2 className="h-4 w-4" />
                Eliminar elemento
              </Button>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">Seleccioná un elemento para editar sus propiedades</p>
            </div>
          )}

          {/* Elements List */}
          <div className="border-t border-border">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Elementos ({elements.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {elements.map((element) => {
                const Icon = elementIcons[element.type]
                return (
                  <button key={element.id} onClick={() => setSelectedElement(element.id)}
                    className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      selectedElement === element.id ? "bg-sidebar-accent" : "hover:bg-muted/50"
                    )}>
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{element.content}</span>
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
