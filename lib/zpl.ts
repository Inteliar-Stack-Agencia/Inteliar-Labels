// ZPL generator for thermal label printers (Zebra, Honeywell, Sato, Citizen)
// All coordinates are in dots (203 dpi = ~8 dots/mm)

const DOTS_PER_MM = 8 // 203 dpi

function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}

function substituteVars(text: string, row: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => row[key] ?? "")
}

interface LabelElement {
  id: string
  type: "text" | "qr" | "barcode" | "image"
  content: string
  x: number
  y: number
  fontSize: number
  bold: boolean
  imgWidth?: number
  imgHeight?: number
}

interface Template {
  width_mm: number
  height_mm: number
  canvas_data: {
    elements: LabelElement[]
    cutBetweenLabels?: boolean
    cutEveryN?: number
  }
}

function fontSizeToZpl(fontSize: number): string {
  const h = Math.max(10, Math.round(fontSize * 3.5))
  const w = Math.round(h * 0.6)
  return `^A0N,${h},${w}`
}

function buildLabelZpl(
  template: Template,
  row: Record<string, string>,
  copies: number,
  cut: boolean
): string {
  const w = mmToDots(template.width_mm)
  const h = mmToDots(template.height_mm)
  const fields: string[] = []

  for (const el of template.canvas_data.elements) {
    const x = mmToDots(el.x)
    const y = mmToDots(el.y)
    const content = substituteVars(el.content, row)

    if (el.type === "text") {
      fields.push(`^FO${x},${y}${fontSizeToZpl(el.fontSize)}^FD${content}^FS`)
    } else if (el.type === "barcode") {
      const barH = mmToDots(8)
      fields.push(`^FO${x},${y}^BCN,${barH},Y,N,N^FD${content || "000"}^FS`)
    } else if (el.type === "qr") {
      fields.push(`^FO${x},${y}^BQN,2,4^FDMM,A${content || "0"}^FS`)
    } else if (el.type === "image") {
      fields.push(`^FO${x},${y}^A0N,14,10^FD[logo]^FS`)
    }
  }

  return [
    `^XA`,
    `^PW${w}`,
    `^LL${h}`,
    `^LH0,0`,
    `^CI28`,
    ...fields,
    `^PQ${copies}`,
    cut ? `^MCY` : `^MCN`,
    `^XZ`,
  ].join("\n")
}

export interface GenerateZPLOptions {
  startFromLabel?: number // 1-based, skip labels before this
}

export function generateZPL(
  template: Template,
  rows: Array<{ row_data: Record<string, string>; quantity: number }>,
  options: GenerateZPLOptions = {}
): string {
  const cutEveryN = template.canvas_data.cutEveryN ?? 1
  const doCut = template.canvas_data.cutBetweenLabels !== false
  const startFrom = options.startFromLabel ?? 1

  // Expand rows into flat label list (respecting quantity)
  const allLabels: Record<string, string>[] = []
  for (const { row_data, quantity } of rows) {
    for (let i = 0; i < Math.max(1, quantity); i++) {
      allLabels.push(row_data)
    }
  }

  // Skip labels before startFrom
  const labelsToPrint = allLabels.slice(startFrom - 1)

  const zplBlocks: string[] = []

  // Group into batches of cutEveryN
  for (let i = 0; i < labelsToPrint.length; i += cutEveryN) {
    const batch = labelsToPrint.slice(i, i + cutEveryN)

    // Each label in the batch as individual ZPL block (1 copy each), cut only at end of batch
    for (let j = 0; j < batch.length; j++) {
      const isLastInBatch = j === batch.length - 1
      zplBlocks.push(buildLabelZpl(template, batch[j], 1, doCut && isLastInBatch))
    }
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
