"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
  ImageIcon,
  Upload,
  Sparkles,
  X,
  Hash,
  Link2,
  Unlink2,
  Minus,
  Square,
  Circle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LabelElement, ElementType } from "@/lib/label-types"
import { PRESET_TEMPLATES } from "@/lib/preset-templates"
import { resolveDateVars, DATE_SHORTCUTS, isDateToken } from "@/lib/date-vars"

const PRESET_SIZES = [
  { label: "80 × 40 mm (catering / vianda)", width: 80, height: 40 },
  { label: "100 × 50 mm (almacén / logística)", width: 100, height: 50 },
  { label: "100 × 150 mm (envío / caja)", width: 100, height: 150 },
  { label: "50 × 30 mm (precio chico)", width: 50, height: 30 },
  { label: "100 × 100 mm (cuadrada)", width: 100, height: 100 },
  { label: "Personalizado", width: 0, height: 0 },
]

export default function NewTemplatePage() {
  const router = useRouter()
  const supabase = createClient()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [templateName, setTemplateName] = useState("Nueva plantilla")
  const [widthMm, setWidthMm] = useState(80)
  const [heightMm, setHeightMm] = useState(40)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [cutBetweenLabels, setCutBetweenLabels] = useState(true)
  const [cutEveryN, setCutEveryN] = useState(1)
  const [elements, setElements] = useState<LabelElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSizePanel, setShowSizePanel] = useState(true)
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiDescription, setAiDescription] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [lockAspect, setLockAspect] = useState(true)
  const [realSize, setRealSize] = useState(false)

  // Load a preset template when arriving via /templates/new?preset=<id>
  useEffect(() => {
    const presetId = new URLSearchParams(window.location.search).get("preset")
    if (!presetId) return
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId)
    if (!preset) return
    setTemplateName(preset.name)
    setWidthMm(preset.widthMm)
    setHeightMm(preset.heightMm)
    setCutBetweenLabels(preset.canvas.cutBetweenLabels !== false)
    setCutEveryN(preset.canvas.cutEveryN ?? 1)
    // Fresh ids so dragging/editing works independently
    setElements(preset.canvas.elements.map((el, i) => ({ ...el, id: `${Date.now()}-${i}` })))
    setShowSizePanel(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedElementData = elements.find((el) => el?.id === selectedElement)

  const SCALE = realSize ? 96 / 25.4 : 6
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
      content: type === "text" ? "Nuevo texto" : type === "serial" || type === "line" || type === "rect" || type === "ellipse" ? "" : `{{variable_${elements.length + 1}}}`,
      x: 20,
      y: 20,
      fontSize: type === "serial" ? 14 : 12,
      bold: false,
      lineWidth: type === "line" ? (widthMm - 8) * 10 : type === "rect" || type === "ellipse" ? 200 : undefined,
      lineHeight: type === "rect" || type === "ellipse" ? 100 : undefined,
      lineThickness: type === "line" || type === "rect" || type === "ellipse" ? 5 : undefined,
      ...(type === "barcode" ? { barcodeType: "code128" as const } : {}),
      ...(type === "serial" ? { serialStart: 1, serialIncrement: 1, serialDigits: 4, serialPrefix: "", serialSuffix: "" } : {}),
    }
    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setElements(elements.filter(Boolean).map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const deleteElement = (id: string) => {
    setElements(elements.filter((el) => el && el.id !== id))
    if (selectedElement === id) setSelectedElement(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Formato no soportado. Usá PNG, JPG o SVG.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("El archivo no puede superar los 5 MB.")
      return
    }

    setUploadError(null)
    setUploadingLogo(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }

      const ext = file.name.split(".").pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true })

      if (uploadErr) {
        const localUrl = URL.createObjectURL(file)
        insertImageElement(localUrl, file.name)
      } else {
        const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path)
        insertImageElement(publicUrl, file.name)
      }
    } catch {
      setUploadError("Error al subir la imagen. Intentá de nuevo.")
    }

    setUploadingLogo(false)
    if (logoInputRef.current) logoInputRef.current.value = ""
  }

  const insertImageElement = (imageUrl: string, name: string) => {
    const newElement: LabelElement = {
      id: Date.now().toString(),
      type: "image",
      content: name,
      x: 5,
      y: 5,
      fontSize: 12,
      bold: false,
      imageUrl,
      imgWidth: 200,
      imgHeight: 150,
    }
    setElements((prev) => [...prev, newElement])
    setSelectedElement(newElement.id)
  }

  const handleElementMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedElement(id)
    const el = elements.find((el) => el?.id === id)
    if (!el) return
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y }

    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = (ev.clientX - drag.startX) * 10 / SCALE
      const dy = (ev.clientY - drag.startY) * 10 / SCALE
      const newX = Math.max(0, Math.round(drag.origX + dx))
      const newY = Math.max(0, Math.round(drag.origY + dy))
      setElements((prev) => prev.map((el) => el.id === drag.id ? { ...el, x: newX, y: newY } : el))
    }

    const onMouseUp = () => {
      dragRef.current = null
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }, [elements, SCALE])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const el = elements.find((el) => el?.id === id)
    if (!el) return
    const startX = e.clientX
    const startY = e.clientY
    const origLineW = el.lineWidth ?? (el.type === "line" ? (widthMm - 8) * 10 : 200)
    const origLineH = el.lineHeight ?? 100
    const origImgW = el.imgWidth ?? 200
    const origImgH = el.imgHeight ?? 150

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) * 10 / SCALE
      const dy = (ev.clientY - startY) * 10 / SCALE
      if (el.type === "line") {
        setElements(prev => prev.map(e => e.id === id ? { ...e, lineWidth: Math.max(10, Math.round(origLineW + dx)) } : e))
      } else if (el.type === "rect" || el.type === "ellipse") {
        setElements(prev => prev.map(e => e.id === id ? { ...e, lineWidth: Math.max(10, Math.round(origLineW + dx)), lineHeight: Math.max(10, Math.round(origLineH + dy)) } : e))
      } else if (el.type === "image") {
        const newW = Math.max(10, Math.round(origImgW + dx))
        setElements(prev => prev.map(e => {
          if (e.id !== id) return e
          if (lockAspect) return { ...e, imgWidth: newW, imgHeight: Math.max(10, Math.round(newW * origImgH / origImgW)) }
          return { ...e, imgWidth: newW, imgHeight: Math.max(10, Math.round(origImgH + dy)) }
        }))
      }
    }
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }, [elements, SCALE, lockAspect, widthMm])

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch("/api/ai/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription, widthMm, heightMm }),
      })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error || "Error generando plantilla"); return }
      // AI returns x/y in mm; canvas stores in tenths-of-mm → multiply by 10
      const newElements: LabelElement[] = data.elements.map((el: LabelElement, i: number) => ({
        ...el,
        id: Date.now().toString() + i,
        x: Math.round((el.x ?? 0) * 10),
        y: Math.round((el.y ?? 0) * 10),
      }))
      setElements(newElements)
      if (data.widthMm) setWidthMm(data.widthMm)
      if (data.heightMm) setHeightMm(data.heightMm)
      setShowAiModal(false)
      setAiDescription("")
    } catch {
      setAiError("Error de conexión. Intentá de nuevo.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const variables = elements
      .filter(Boolean)
      .map((el) => {
        const matches = (el.content ?? "").match(/\{\{([^}]+)\}\}/g)
        return matches ? matches.map((m) => m.replace(/[{}]/g, "").trim()) : []
      })
      .flat()
      .filter((v) => !isDateToken(v))
      .filter((v, i, arr) => arr.indexOf(v) === i)

    const { error } = await supabase.from("templates").insert({
      user_id: user.id,
      name: templateName,
      width_mm: widthMm,
      height_mm: heightMm,
      canvas_data: { elements, cutBetweenLabels, cutEveryN },
      variables,
    })

    setSaving(false)
    if (!error) router.push("/templates")
  }

  const elementIcon = (type: ElementType) => {
    if (type === "text") return Type
    if (type === "qr") return QrCode
    if (type === "barcode") return Barcode
    if (type === "serial") return Hash
    if (type === "line") return Minus
    if (type === "rect") return Square
    if (type === "ellipse") return Circle
    return ImageIcon
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300"
            onClick={() => setShowAiModal(true)}
          >
            <Sparkles className="h-4 w-4" />
            Generar con IA
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSizePanel(!showSizePanel)}>
            <Settings2 className="h-4 w-4" />
            Tamaño
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Crear plantilla"}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-3xl space-y-6">

            {showSizePanel && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Configuración de etiqueta</h3>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ancho (mm)</label>
                    <input type="number" value={widthMm}
                      onChange={(e) => { setWidthMm(Number(e.target.value)); setSelectedPreset(5) }}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      min={20} max={300}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Alto (mm)</label>
                    <input type="number" value={heightMm}
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
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Corte automático</p>
                      <p className="text-xs text-muted-foreground">La impresora corta el papel entre lotes</p>
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
                  {cutBetweenLabels && (
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground whitespace-nowrap">Cortar cada</label>
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={cutEveryN}
                        onChange={(e) => setCutEveryN(Math.max(1, Number(e.target.value)))}
                        className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <label className="text-xs text-muted-foreground">etiquetas</label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Toolbox */}
            <div className="flex flex-wrap items-center gap-2">
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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("serial")}>
                <Hash className="h-4 w-4" /> Numeración
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("line")}>
                <Minus className="h-4 w-4" /> Línea
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("rect")}>
                <Square className="h-4 w-4" /> Rectángulo
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addElement("ellipse")}>
                <Circle className="h-4 w-4" /> Elipse
              </Button>
              <Button
                variant="outline" size="sm" className="gap-2"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "Subiendo..." : "Logo / Imagen"}
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {uploadError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {uploadError}
              </div>
            )}

            {/* Label Canvas */}
            <div className="flex justify-center">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{widthMm} mm</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                      {realSize ? "Tamaño real (aprox.)" : "Vista previa a escala"}
                    </span>
                    <button
                      onClick={() => setRealSize(!realSize)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border transition-colors",
                        realSize
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {realSize ? "Volver a escala" : "Tamaño real"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-muted-foreground" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      {heightMm} mm
                    </span>
                  </div>
                  <div
                    ref={canvasRef}
                    className="relative border-2 border-dashed border-border bg-white shadow-lg select-none"
                    style={{ width: `${canvasW}px`, height: `${canvasH}px`, minWidth: "200px", minHeight: "100px" }}
                    onClick={() => setSelectedElement(null)}
                  >
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
                      backgroundSize: `${SCALE * 10}px ${SCALE * 10}px`,
                    }} />

                    {elements.filter(Boolean).map((element) => (
                      <div
                        key={element.id}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "absolute cursor-grab active:cursor-grabbing rounded border-2 transition-colors",
                          selectedElement === element.id
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:border-border"
                        )}
                        style={
                          element.type === "text" && element.textAlign && element.textAlign !== "left"
                            ? { left: 0, top: `${element.y * SCALE / 10}px`, width: `${canvasW}px`, paddingLeft: `${2 * SCALE}px`, paddingRight: `${2 * SCALE}px` }
                            : { left: `${element.x * SCALE / 10}px`, top: `${element.y * SCALE / 10}px` }
                        }
                      >
                        {selectedElement === element.id && (
                          <div className="absolute -top-5 left-0 flex items-center gap-1 rounded-t bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground whitespace-nowrap">
                            <GripVertical className="h-2.5 w-2.5" />
                            {element.type.toUpperCase()}
                          </div>
                        )}
                        {element.type === "line" ? (
                          <div style={{ position: "relative" }}>
                            <div style={{
                              width: `${(element.lineWidth ?? (widthMm - 8) * 10) * SCALE / 10}px`,
                              height: `${Math.max(1, (element.lineThickness ?? 5) * SCALE / 10)}px`,
                              backgroundColor: "#333",
                            }} />
                            {selectedElement === element.id && (
                              <div onMouseDown={(e) => handleResizeMouseDown(e, element.id)} style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 8, height: 8, background: "white", border: "2px solid hsl(var(--primary))", borderRadius: 2, cursor: "ew-resize", zIndex: 10 }} />
                            )}
                          </div>
                        ) : element.type === "rect" ? (
                          <div style={{ position: "relative" }}>
                            <div style={{
                              width: `${(element.lineWidth ?? 200) * SCALE / 10}px`,
                              height: `${(element.lineHeight ?? 100) * SCALE / 10}px`,
                              border: `${Math.max(1, (element.lineThickness ?? 5) * SCALE / 10)}px solid #333`,
                              boxSizing: "border-box",
                            }} />
                            {selectedElement === element.id && (
                              <div onMouseDown={(e) => handleResizeMouseDown(e, element.id)} style={{ position: "absolute", right: -4, bottom: -4, width: 8, height: 8, background: "white", border: "2px solid hsl(var(--primary))", borderRadius: 2, cursor: "se-resize", zIndex: 10 }} />
                            )}
                          </div>
                        ) : element.type === "ellipse" ? (
                          <div style={{ position: "relative" }}>
                            <div style={{
                              width: `${(element.lineWidth ?? 200) * SCALE / 10}px`,
                              height: `${(element.lineHeight ?? 200) * SCALE / 10}px`,
                              border: `${Math.max(1, (element.lineThickness ?? 5) * SCALE / 10)}px solid #333`,
                              borderRadius: "50%",
                              boxSizing: "border-box",
                            }} />
                            {selectedElement === element.id && (
                              <div onMouseDown={(e) => handleResizeMouseDown(e, element.id)} style={{ position: "absolute", right: -4, bottom: -4, width: 8, height: 8, background: "white", border: "2px solid hsl(var(--primary))", borderRadius: 2, cursor: "se-resize", zIndex: 10 }} />
                            )}
                          </div>
                        ) : element.type === "image" && element.imageUrl ? (
                          <div style={{ position: "relative" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={element.imageUrl}
                              alt={element.content}
                              style={{
                                width: `${(element.imgWidth ?? 200) * SCALE / 10}px`,
                                height: `${(element.imgHeight ?? 150) * SCALE / 10}px`,
                                objectFit: "contain",
                                display: "block",
                              }}
                            />
                            {selectedElement === element.id && (
                              <div onMouseDown={(e) => handleResizeMouseDown(e, element.id)} style={{ position: "absolute", right: -4, bottom: -4, width: 8, height: 8, background: "white", border: "2px solid hsl(var(--primary))", borderRadius: 2, cursor: "se-resize", zIndex: 10 }} />
                            )}
                          </div>
                        ) : (
                          <div className="px-1.5 py-1" style={{ width: "100%" }}>
                            <span
                              className="text-gray-800"
                              style={{
                                fontSize: `${element.fontSize * SCALE / 3}px`,
                                fontWeight: element.bold ? "bold" : "normal",
                                textAlign: element.textAlign || "left",
                                display: "block",
                                width: "100%",
                                fontFamily: "'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif",
                                letterSpacing: "-0.03em",
                                lineHeight: 1.1,
                              }}
                            >
                              {element.type === "serial"
                                ? `${element.serialPrefix ?? ""}${String(element.serialStart ?? 1).padStart(element.serialDigits ?? 4, "0")}${element.serialSuffix ?? ""}`
                                : resolveDateVars(element.content ?? "")}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {elements.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="mx-auto h-6 w-6 text-gray-300" />
                          <p className="mt-1 text-xs text-gray-400">Agregá elementos arriba</p>
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
                {(() => { const Icon = elementIcon(selectedElementData.type); return <Icon className="h-4 w-4 text-muted-foreground" /> })()}
                <span className="text-sm font-medium capitalize">
                  {selectedElementData.type === "image" ? "Imagen / Logo" : `Elemento ${selectedElementData.type}`}
                </span>
              </div>

              {/* Image preview */}
              {selectedElementData.type === "image" && selectedElementData.imageUrl && (
                <div className="rounded-lg border border-border bg-muted/50 p-2 flex items-center justify-center" style={{ minHeight: 80 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedElementData.imageUrl}
                    alt="Logo"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              )}

              {/* Serial config */}
              {selectedElementData.type === "serial" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Número inicial</label>
                      <input type="number" value={selectedElementData.serialStart ?? 1}
                        onChange={(e) => updateElement(selectedElementData.id, { serialStart: Number(e.target.value) })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Incremento</label>
                      <input type="number" value={selectedElementData.serialIncrement ?? 1}
                        onChange={(e) => updateElement(selectedElementData.id, { serialIncrement: Number(e.target.value) })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Dígitos</label>
                      <input type="number" value={selectedElementData.serialDigits ?? 4}
                        onChange={(e) => updateElement(selectedElementData.id, { serialDigits: Number(e.target.value) })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={1} max={10}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Prefijo</label>
                      <input type="text" value={selectedElementData.serialPrefix ?? ""}
                        onChange={(e) => updateElement(selectedElementData.id, { serialPrefix: e.target.value })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="LOT-"
                      />
                    </div>
                  </div>
                  <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                    Vista previa: <strong>{`${selectedElementData.serialPrefix ?? ""}${String(selectedElementData.serialStart ?? 1).padStart(selectedElementData.serialDigits ?? 4, "0")}`}</strong>
                  </p>
                </div>
              )}

              {/* Line / Rect / Ellipse config */}
              {(selectedElementData.type === "line" || selectedElementData.type === "rect" || selectedElementData.type === "ellipse") && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Ancho (mm)</label>
                      <input type="number" value={+((selectedElementData.lineWidth ?? 200) / 10).toFixed(1)}
                        onChange={(e) => updateElement(selectedElementData.id, { lineWidth: Math.round(Number(e.target.value) * 10) })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={0.5} step={0.5}
                      />
                    </div>
                    {(selectedElementData.type === "rect" || selectedElementData.type === "ellipse") && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Alto (mm)</label>
                        <input type="number" value={+((selectedElementData.lineHeight ?? 100) / 10).toFixed(1)}
                          onChange={(e) => updateElement(selectedElementData.id, { lineHeight: Math.round(Number(e.target.value) * 10) })}
                          className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          min={0.5} step={0.5}
                        />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Grosor (mm)</label>
                      <input type="number" value={+((selectedElementData.lineThickness ?? 5) / 10).toFixed(2)}
                        onChange={(e) => updateElement(selectedElementData.id, { lineThickness: Math.round(Number(e.target.value) * 10) })}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={0.1} max={10} step={0.1}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Content field — hidden for images, serial, line, rect, ellipse */}
              {selectedElementData.type !== "image" && selectedElementData.type !== "serial" && selectedElementData.type !== "line" && selectedElementData.type !== "rect" && selectedElementData.type !== "ellipse" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contenido / Variable</label>
                  <input
                    type="text"
                    value={selectedElementData.content}
                    onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Texto o {{variable}}"
                  />
                  {/* Date shortcuts for text */}
                  {selectedElementData.type === "text" && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Fechas rápidas:</p>
                      <div className="flex flex-wrap gap-1">
                        {DATE_SHORTCUTS.map((s) => (
                          <button
                            key={s.variable}
                            title={s.description}
                            onClick={() => updateElement(selectedElementData.id, { content: selectedElementData.content + s.variable })}
                            className="rounded border border-border px-2 py-0.5 text-[10px] hover:border-primary hover:text-primary transition-colors"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Barcode type */}
                  {selectedElementData.type === "barcode" && (
                    <div className="mt-2">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de código</label>
                      <select
                        value={selectedElementData.barcodeType ?? "code128"}
                        onChange={(e) => updateElement(selectedElementData.id, { barcodeType: e.target.value as LabelElement["barcodeType"] })}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="code128">Code 128 (universal)</option>
                        <option value="ean13">EAN-13 (retail/alimentos)</option>
                        <option value="ean8">EAN-8 (pequeño)</option>
                        <option value="code39">Code 39 (industrial)</option>
                        <option value="datamatrix">Data Matrix (2D)</option>
                      </select>
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">Usá {"{{nombre_columna}}"} para datos del Excel</p>
                </div>
              )}

              {/* Position */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pos. X (mm)</label>
                  <input type="number" value={+(selectedElementData.x / 10).toFixed(1)}
                    onChange={(e) => updateElement(selectedElementData.id, { x: Math.round(Number(e.target.value) * 10) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    min={0} step={0.5}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pos. Y (mm)</label>
                  <input type="number" value={+(selectedElementData.y / 10).toFixed(1)}
                    onChange={(e) => updateElement(selectedElementData.id, { y: Math.round(Number(e.target.value) * 10) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    min={0} step={0.5}
                  />
                </div>
              </div>

              {/* Image size controls */}
              {selectedElementData.type === "image" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Tamaño (mm)</label>
                    <button
                      onClick={() => setLockAspect(!lockAspect)}
                      title={lockAspect ? "Proporción bloqueada" : "Proporción libre"}
                      className={cn(
                        "flex items-center gap-1 rounded px-1.5 py-1 text-[10px] border transition-colors",
                        lockAspect ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                      )}
                    >
                      {lockAspect ? <Link2 className="h-3 w-3" /> : <Unlink2 className="h-3 w-3" />}
                      {lockAspect ? "Proporcional" : "Libre"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] text-muted-foreground">Ancho (mm)</label>
                      <input type="number" value={+((selectedElementData.imgWidth ?? 200) / 10).toFixed(1)}
                        onChange={(e) => {
                          const w = Math.round(Number(e.target.value) * 10)
                          if (lockAspect) {
                            const ratio = (selectedElementData.imgHeight ?? 150) / (selectedElementData.imgWidth ?? 200)
                            updateElement(selectedElementData.id, { imgWidth: w, imgHeight: Math.max(5, Math.round(w * ratio)) })
                          } else {
                            updateElement(selectedElementData.id, { imgWidth: w })
                          }
                        }}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={0.5} step={0.5}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-muted-foreground">Alto (mm)</label>
                      <input type="number" value={+((selectedElementData.imgHeight ?? 150) / 10).toFixed(1)}
                        onChange={(e) => {
                          const h = Math.round(Number(e.target.value) * 10)
                          if (lockAspect) {
                            const ratio = (selectedElementData.imgWidth ?? 200) / (selectedElementData.imgHeight ?? 150)
                            updateElement(selectedElementData.id, { imgHeight: h, imgWidth: Math.max(5, Math.round(h * ratio)) })
                          } else {
                            updateElement(selectedElementData.id, { imgHeight: h })
                          }
                        }}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        min={0.5} step={0.5}
                      />
                    </div>
                  </div>
                </div>
              ) : selectedElementData.type !== "serial" && selectedElementData.type !== "line" && selectedElementData.type !== "rect" && selectedElementData.type !== "ellipse" ? (
                <>
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
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Alineación</label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((align) => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight
                        return (
                          <button key={align} onClick={() => updateElement(selectedElementData.id, { textAlign: align })}
                            className={cn("flex-1 flex items-center justify-center rounded border py-1.5 transition-colors",
                              (selectedElementData.textAlign || "left") === align ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                            )}>
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tamaño de fuente (px)</label>
                  <input type="number" value={selectedElementData.fontSize}
                    onChange={(e) => updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}

              {/* Replace image button */}
              {selectedElementData.type === "image" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="h-4 w-4" />
                  Reemplazar imagen
                </Button>
              )}

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
              {elements.filter(Boolean).map((element) => {
                const Icon = elementIcon(element.type)
                return (
                  <button key={element.id} onClick={() => setSelectedElement(element.id)}
                    className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      selectedElement === element.id ? "bg-sidebar-accent" : "hover:bg-muted/50"
                    )}>
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {element.type === "image" ? `🖼 ${element.content}` : element.content}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Generar plantilla con IA</h2>
              </div>
              <button
                onClick={() => { setShowAiModal(false); setAiError(null) }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Describí la etiqueta que necesitás y la IA la va a diseñar automáticamente con los elementos
              posicionados y las variables detectadas.
            </p>
            <textarea
              className="mb-1 h-32 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Ej: etiqueta para alimentos congelados con logo en la esquina, nombre del producto grande, fecha de vencimiento, peso en gramos y código de barras abajo"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              disabled={aiLoading}
            />
            <p className="mb-4 text-xs text-muted-foreground">
              Tamaño actual: {widthMm} × {heightMm} mm
            </p>
            {aiError && (
              <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{aiError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAiModal(false); setAiError(null) }} disabled={aiLoading}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-violet-600 hover:bg-violet-700"
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiDescription.trim()}
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? "Generando..." : "Generar plantilla"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
