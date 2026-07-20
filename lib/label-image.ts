// Renders a label (template + data row) to a PNG image at print resolution.
// Used for printers whose Windows driver does not interpret raw ZPL (e.g. the
// Honeywell/Seagull graphics drivers): the agent prints the image through the
// driver — exactly like the Windows test page — so it works on any printer.
//
// Geometry mirrors lib/zpl.ts exactly so the printed image matches the ZPL
// output: 8 dots/mm (203 dpi), positions in tenths-of-mm, fontSize in screen px
// at 3px/mm. Unlike ZPL we keep accents (á, é, ñ) since the image renders UTF-8.

import type { CanvasData, LabelElement } from "./label-types"
import { resolveDateVars, isDateToken } from "./date-vars"

const DOTS_PER_MM = 8 // 203 dpi
const CANVAS_SCALE = 3 // editor px per mm (fontSize is in these px)

function tenthMmToDots(tenthMm: number): number {
  return Math.round((tenthMm * DOTS_PER_MM) / 10)
}
function mmToDots(mm: number): number {
  return Math.round(mm * DOTS_PER_MM)
}
function fontDots(fontSize: number): number {
  return Math.max(10, Math.round((fontSize * DOTS_PER_MM) / CANVAS_SCALE))
}

function substituteVars(text: string, row: Record<string, string>): string {
  const withData = text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = String(key).trim()
    if (isDateToken(trimmedKey)) return match
    return trimmedKey in row ? row[trimmedKey] ?? "" : match
  })
  return resolveDateVars(withData)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo cargar la imagen del logo"))
    img.src = src
  })
}

/**
 * Render one label to a PNG data URL at 203 dpi.
 */
export async function renderLabelToPng(
  template: { width_mm: number; height_mm: number; canvas_data: CanvasData },
  row: Record<string, string>,
): Promise<string> {
  const w = mmToDots(template.width_mm)
  const h = mmToDots(template.height_mm)
  const margin = mmToDots(1)
  const blockW = Math.max(1, w - 2 * margin)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo crear el canvas")

  // White background (thermal paper)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = "#000000"
  ctx.strokeStyle = "#000000"
  ctx.textBaseline = "top"

  // Images first so text sits on top
  const elements = template.canvas_data.elements ?? []
  for (const el of elements) {
    if (el.type === "image" && el.imageUrl) {
      try {
        const img = await loadImage(el.imageUrl)
        const x = tenthMmToDots(el.x)
        const y = tenthMmToDots(el.y)
        const bw = tenthMmToDots(el.imgWidth ?? 300)
        const bh = tenthMmToDots(el.imgHeight ?? 200)
        // object-contain inside the box
        const scale = Math.min(bw / img.width, bh / img.height)
        const dw = img.width * scale
        const dh = img.height * scale
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, x + (bw - dw) / 2, y + (bh - dh) / 2, dw, dh)
      } catch {
        // skip logo if it can't load
      }
    }
  }

  for (const el of elements) {
    const x = tenthMmToDots(el.x)
    const y = tenthMmToDots(el.y)
    const align = el.textAlign ?? "left"

    if (el.type === "text" || el.type === "serial") {
      const content =
        el.type === "serial"
          ? serialValue(el, Number(row.__labelIndex ?? 0))
          : substituteVars(el.content, row)
      const fd = fontDots(el.fontSize)
      // Match the editor preview and printer's condensed bitmap font (ZPL ^A0)
      // by using Arial Narrow with slight negative letter-spacing. Regular
      // Arial is noticeably wider, which can wrap a line that fit in the
      // preview/ZPL output into two lines and shift it into elements below.
      ctx.font = `${el.bold ? "bold " : ""}${fd}px "Arial Narrow", Arial, sans-serif`
      // NOTE: previously applied a small negative ctx.letterSpacing here to
      // match the ZPL condensed-font width more closely. Removed — some
      // canvas engines apply letter-spacing symmetrically around each glyph,
      // which shifted (and on left-aligned text, clipped) the first
      // character. Arial Narrow alone gets close enough to the ZPL width
      // without that risk.
      ctx.fillStyle = "#000000"
      // Extra safety inset on the right: thermal heads often don't print the
      // last 1-2mm at the edge, which clipped the final letter of long lines.
      const safety = mmToDots(2)
      if (el.boxWidth != null) {
        // Align INSIDE the element's own box, anchored at x.
        const bw = Math.max(1, tenthMmToDots(el.boxWidth))
        if (align === "center") {
          ctx.textAlign = "center"
          wrapText(ctx, content, x + bw / 2, y, bw, fd)
        } else if (align === "right") {
          ctx.textAlign = "right"
          wrapText(ctx, content, x + bw, y, bw, fd)
        } else {
          ctx.textAlign = "left"
          wrapText(ctx, content, x, y, bw, fd)
        }
      } else if (align === "center") {
        ctx.textAlign = "center"
        wrapText(ctx, content, margin + blockW / 2, y, blockW - 2 * safety, fd)
      } else if (align === "right") {
        ctx.textAlign = "right"
        wrapText(ctx, content, margin + blockW - safety, y, blockW - safety, fd)
      } else {
        ctx.textAlign = "left"
        wrapText(ctx, content, x, y, w - x - margin - safety, fd)
      }
    } else if (el.type === "line") {
      const lw = tenthMmToDots(el.lineWidth ?? template.width_mm * 10 - 80)
      const th = Math.max(2, tenthMmToDots(el.lineThickness ?? 5))
      ctx.fillRect(x, y, lw, th)
    } else if (el.type === "rect") {
      const rw = tenthMmToDots(el.lineWidth ?? 200)
      const rh = tenthMmToDots(el.lineHeight ?? 100)
      const th = Math.max(1, tenthMmToDots(el.lineThickness ?? 5))
      ctx.lineWidth = th
      ctx.strokeRect(x + th / 2, y + th / 2, rw - th, rh - th)
    } else if (el.type === "ellipse") {
      const ew = tenthMmToDots(el.lineWidth ?? 200)
      const eh = tenthMmToDots(el.lineHeight ?? 100)
      const th = Math.max(1, tenthMmToDots(el.lineThickness ?? 5))
      ctx.lineWidth = th
      ctx.beginPath()
      ctx.ellipse(x + ew / 2, y + eh / 2, (ew - th) / 2, (eh - th) / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    // barcode / qr: not yet rendered as image — handled by ZPL path
  }

  thresholdToBlackAndWhite(ctx, w, h)
  return canvas.toDataURL("image/png")
}

// Thermal heads are effectively 1-bit (burn or don't burn a dot). Antialiased
// grey edges from canvas text/shape rendering print as faint smudges instead
// of clean lines, and can make barcodes unreadable. Snap every pixel to pure
// black or white so the printed result matches what a real ZPL bitmap looks
// like.
function thresholdToBlackAndWhite(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const THRESHOLD = 200 // 0-255; anything darker than this becomes solid black
  for (let i = 0; i < d.length; i += 4) {
    const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114)
    const v = gray < THRESHOLD ? 0 : 255
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
}

// Simple word-wrap up to 3 lines, matching ^FB...,3 behaviour in the ZPL path.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = String(text).split(/\s+/)
  let line = ""
  let lines: string[] = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines = lines.slice(0, 3)
  // Compact line spacing (0.95) so wrapped lines read as one element instead of
  // looking like two separate lines with a big gap between them.
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * Math.round(lineHeight * 0.95)))
}

function serialValue(el: LabelElement, labelIndex: number): string {
  const start = el.serialStart ?? 1
  const inc = el.serialIncrement ?? 1
  const digits = el.serialDigits ?? 0
  const prefix = el.serialPrefix ?? ""
  const suffix = el.serialSuffix ?? ""
  const num = start + labelIndex * inc
  return `${prefix}${String(num).padStart(digits, "0")}${suffix}`
}

/**
 * Returns true if the template can be faithfully rendered as an image.
 * Barcodes/QR are not yet supported by the image path (they need real codes),
 * so callers should fall back to ZPL when these are present.
 */
export function templateHasBarcodeOrQr(canvasData: CanvasData): boolean {
  return (canvasData.elements ?? []).some((el) => el.type === "barcode" || el.type === "qr")
}

/**
 * Render an array of label rows (respecting quantity) to PNG data URLs.
 */
export async function renderLabelsToPngs(
  template: { width_mm: number; height_mm: number; canvas_data: CanvasData },
  rows: Array<{ row_data: Record<string, string>; quantity: number }>,
  opts: { startFromLabel?: number; endAtLabel?: number } = {},
): Promise<string[]> {
  const flat: Record<string, string>[] = []
  for (const { row_data, quantity } of rows) {
    for (let i = 0; i < Math.max(1, quantity); i++) flat.push(row_data)
  }
  const start = (opts.startFromLabel ?? 1) - 1
  const end = opts.endAtLabel ?? flat.length
  const slice = flat.slice(start, end)

  const images: string[] = []
  for (let i = 0; i < slice.length; i++) {
    images.push(await renderLabelToPng(template, { ...slice[i], __labelIndex: String(start + i) }))
  }
  return images
}
