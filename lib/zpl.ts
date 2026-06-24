// ZPL generator for thermal label printers (Zebra, Honeywell, Sato, Citizen)
import type { LabelElement, CanvasData } from "./label-types"
import { resolveDateVars } from "./date-vars"

const DOTS_PER_MM = 8 // 203 dpi ≈ 8 dots/mm
// el.x, el.y, lineWidth, lineHeight, lineThickness, imgWidth, imgHeight
// are stored in tenths-of-mm (0.1mm units) by the canvas editor (SCALE=3px/mm, stored as px*10/SCALE)
const CANVAS_SCALE = 3 // screen px per mm — matches the editor's SCALE constant

// Convert tenths-of-mm to printer dots
function tenthMmToDots(tenthMm: number): number {
  return Math.round(tenthMm * DOTS_PER_MM / 10)
}

// Convert mm to printer dots (for fixed physical sizes like barcode height)
function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}

// fontSize is stored in screen pixels (displayed as ${fontSize}px in editor at CANVAS_SCALE px/mm)
function fontSizeToDots(fontSize: number): number {
  return Math.round(fontSize * DOTS_PER_MM / CANVAS_SCALE)
}

// Allow spaces and any char inside {{ }} — user-defined variable names may have spaces
function substituteVars(text: string, row: Record<string, string>): string {
  const withData = text.replace(/\{\{([^}]+)\}\}/g, (_, key) => row[key.trim()] ?? "")
  return resolveDateVars(withData)
}

function fontSizeToZpl(fontSize: number): string {
  const h = Math.max(10, fontSizeToDots(fontSize))
  const w = Math.round(h * 0.6)
  return `^A0N,${h},${w}`
}

function serialValue(el: LabelElement, labelIndex: number): string {
  const start = el.serialStart ?? 1
  const inc = el.serialIncrement ?? 1
  const digits = el.serialDigits ?? 4
  const prefix = el.serialPrefix ?? ""
  const suffix = el.serialSuffix ?? ""
  const num = start + labelIndex * inc
  return `${prefix}${String(num).padStart(digits, "0")}${suffix}`
}

function buildLabelZpl(
  widthMm: number,
  heightMm: number,
  canvasData: CanvasData,
  row: Record<string, string>,
  labelIndex: number,
  cut: boolean
): string {
  const w = mmToDots(widthMm)
  const h = mmToDots(heightMm)
  const fields: string[] = []

  for (const el of canvasData.elements) {
    // el.x and el.y are in tenths-of-mm (0.1mm) — convert to printer dots
    const x = tenthMmToDots(el.x)
    const y = tenthMmToDots(el.y)

    if (el.type === "serial") {
      const val = serialValue(el, labelIndex)
      fields.push(`^FO${x},${y}${fontSizeToZpl(el.fontSize)}^FD${val}^FS`)
      continue
    }

    const content = substituteVars(el.content, row)

    if (el.type === "text") {
      fields.push(`^FO${x},${y}${fontSizeToZpl(el.fontSize)}^FD${content}^FS`)

    } else if (el.type === "barcode") {
      const barH = mmToDots(8)
      const bt = el.barcodeType ?? "code128"
      if (bt === "ean13") {
        fields.push(`^FO${x},${y}^BEN,${barH},Y,N^FD${content}^FS`)
      } else if (bt === "ean8") {
        fields.push(`^FO${x},${y}^B8N,${barH},Y,N^FD${content}^FS`)
      } else if (bt === "code39") {
        fields.push(`^FO${x},${y}^B3N,N,${barH},Y,N^FD${content}^FS`)
      } else if (bt === "datamatrix") {
        fields.push(`^FO${x},${y}^BXN,4,200^FD${content}^FS`)
      } else {
        fields.push(`^FO${x},${y}^BCN,${barH},Y,N,N^FD${content || "000"}^FS`)
      }

    } else if (el.type === "qr") {
      fields.push(`^FO${x},${y}^BQN,2,4^FDMM,A${content || "0"}^FS`)

    } else if (el.type === "image") {
      fields.push(`^FO${x},${y}^A0N,14,10^FD[logo]^FS`)

    } else if (el.type === "line") {
      const lw = tenthMmToDots(el.lineWidth ?? (widthMm * 10 - 80)) // default: label width - 8mm
      const thickness = Math.max(1, tenthMmToDots(el.lineThickness ?? 5)) // 0.5mm default
      fields.push(`^FO${x},${y}^GB${lw},${thickness},${thickness}^FS`)

    } else if (el.type === "rect") {
      const rw = tenthMmToDots(el.lineWidth ?? 200)  // 20mm default
      const rh = tenthMmToDots(el.lineHeight ?? 100) // 10mm default
      const thickness = Math.max(1, tenthMmToDots(el.lineThickness ?? 5)) // 0.5mm default
      fields.push(`^FO${x},${y}^GB${rw},${rh},${thickness}^FS`)

    } else if (el.type === "ellipse") {
      const ew = tenthMmToDots(el.lineWidth ?? 200)  // 20mm default
      const eh = tenthMmToDots(el.lineHeight ?? 200) // 20mm default
      const thickness = Math.max(1, tenthMmToDots(el.lineThickness ?? 5)) // 0.5mm default
      fields.push(`^FO${x},${y}^GE${ew},${eh},${thickness},B^FS`)
    }
  }

  return [
    `^XA`,
    `^PW${w}`,
    `^LL${h}`,
    `^LH0,0`,
    `^CI28`,
    ...fields,
    `^PQ1`,
    cut ? `^MCY` : `^MCN`,
    `^XZ`,
  ].join("\n")
}

export interface GenerateZPLOptions {
  startFromLabel?: number
}

export function generateZPL(
  template: { width_mm: number; height_mm: number; canvas_data: CanvasData },
  rows: Array<{ row_data: Record<string, string>; quantity: number }>,
  options: GenerateZPLOptions = {}
): string {
  const cutEveryN = template.canvas_data.cutEveryN ?? 1
  const doCut = template.canvas_data.cutBetweenLabels !== false
  const startFrom = options.startFromLabel ?? 1

  const allLabels: Record<string, string>[] = []
  for (const { row_data, quantity } of rows) {
    for (let i = 0; i < Math.max(1, quantity); i++) {
      allLabels.push(row_data)
    }
  }

  const labelsToPrint = allLabels.slice(startFrom - 1)
  const zplBlocks: string[] = []

  for (let i = 0; i < labelsToPrint.length; i++) {
    const globalIndex = (startFrom - 1) + i
    const isLastInBatch = ((i + 1) % cutEveryN === 0) || (i === labelsToPrint.length - 1)
    zplBlocks.push(buildLabelZpl(
      template.width_mm,
      template.height_mm,
      template.canvas_data,
      labelsToPrint[i],
      globalIndex,
      doCut && isLastInBatch
    ))
  }

  return zplBlocks.join("\n\n")
}

export function downloadZPL(zplContent: string, filename: string) {
  const blob = new Blob([zplContent], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
