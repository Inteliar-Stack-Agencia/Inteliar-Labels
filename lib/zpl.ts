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
  }
}

// Map fontSize (px) to ZPL font size (A=9pt..Z=21pt, or use scalable ^A0)
function fontSizeToZpl(fontSize: number): string {
  // Use scalable font: ^A0N,height,width
  const h = Math.max(10, Math.round(fontSize * 3.5))
  const w = Math.round(h * 0.6)
  return `^A0N,${h},${w}`
}

export function generateZPL(
  template: Template,
  rows: Array<{ row_data: Record<string, string>; quantity: number }>
): string {
  const w = mmToDots(template.width_mm)
  const h = mmToDots(template.height_mm)
  const cut = template.canvas_data.cutBetweenLabels !== false

  const labels: string[] = []

  for (const { row_data, quantity } of rows) {
    const copies = Math.max(1, quantity)

    const fields: string[] = []

    for (const el of template.canvas_data.elements) {
      const x = mmToDots(el.x)
      const y = mmToDots(el.y)
      const content = substituteVars(el.content, row_data)

      if (el.type === "text") {
        const font = fontSizeToZpl(el.fontSize)
        const bold = el.bold ? "^FB" : ""
        fields.push(`^FO${x},${y}${font}^FD${content}^FS`)

      } else if (el.type === "barcode") {
        // Code 128 barcode
        const barH = mmToDots(8) // 8mm tall
        fields.push(`^FO${x},${y}^BCN,${barH},Y,N,N^FD${content || "000"}^FS`)

      } else if (el.type === "qr") {
        // QR code
        fields.push(`^FO${x},${y}^BQN,2,4^FDMM,A${content || "0"}^FS`)

      } else if (el.type === "image") {
        // Skip images in ZPL (would need bitmap conversion)
        fields.push(`^FO${x},${y}^A0N,14,10^FD[logo]^FS`)
      }
    }

    const zpl = [
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

    labels.push(zpl)
  }

  return labels.join("\n\n")
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
