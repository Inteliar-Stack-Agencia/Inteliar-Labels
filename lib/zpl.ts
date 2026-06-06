// ZPL generator for thermal label printers (Zebra, Honeywell, Sato, Citizen)
import type { LabelElement, CanvasData } from "./label-types"
import { resolveDateVars } from "./date-vars"

const DOTS_PER_MM = 8 // 203 dpi

function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}

function substituteVars(text: string, row: Record<string, string>): string {
  const withData = text.replace(/\{\{(\w+)\}\}/g, (_, key) => row[key] ?? "")
  return resolveDateVars(withData)
}

function fontSizeToZpl(fontSize: number): string {
  const h = Math.max(10, Math.round(fontSize * 3.5))
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
    const x = mmToDots(el.x)
    const y = mmToDots(el.y)

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
        // code128 default
        fields.push(`^FO${x},${y}^BCN,${barH},Y,N,N^FD${content || "000"}^FS`)
      }

    } else if (el.type === "qr") {
      fields.push(`^FO${x},${y}^BQN,2,4^FDMM,A${content || "0"}^FS`)

    } else if (el.type === "image") {
      fields.push(`^FO${x},${y}^A0N,14,10^FD[logo]^FS`)

    } else if (el.type === "line") {
      const lw = mmToDots(el.lineWidth ?? 30)
      const thickness = mmToDots(el.lineThickness ?? 0.5)
      // ^GB width, height, thickness — for a horizontal line height=thickness
      fields.push(`^FO${x},${y}^GB${lw},${thickness},${thickness}^FS`)

    } else if (el.type === "rect") {
      const rw = mmToDots(el.lineWidth ?? 20)
      const rh = mmToDots(el.lineHeight ?? 10)
      const thickness = mmToDots(el.lineThickness ?? 0.5)
      fields.push(`^FO${x},${y}^GB${rw},${rh},${thickness}^FS`)

    } else if (el.type === "ellipse") {
      const ew = mmToDots(el.lineWidth ?? 20)
      const eh = mmToDots(el.lineHeight ?? 20)
      const thickness = mmToDots(el.lineThickness ?? 0.5)
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

  // Expand rows into flat label list
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
