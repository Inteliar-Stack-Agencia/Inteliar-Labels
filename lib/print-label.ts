// Smart label printing: picks the right transport for the target printer.
//
// USB printers use the Windows driver (which usually does NOT interpret raw
// ZPL) so we render the labels to images and print them THROUGH the driver.
// TCP/network printers (Zebra etc.) get raw ZPL as before. If a template has
// barcodes/QR — which the image path can't render yet — we fall back to ZPL.

import type { CanvasData } from "./label-types"
import { generateZPL, prepareImages, type GenerateZPLOptions } from "./zpl"
import { renderLabelsToPngs, templateHasBarcodeOrQr } from "./label-image"
import {
  listPrinters,
  checkPrinterAgent,
  sendToPrinterAgent,
  sendImagesToPrinterAgent,
  type PrinterConfig,
  type PrintResult,
} from "./printer-agent-client"

interface Template {
  width_mm: number
  height_mm: number
  canvas_data: CanvasData
}

async function resolveTarget(printerId?: string): Promise<PrinterConfig | undefined> {
  const printers = await listPrinters().catch(() => [] as PrinterConfig[])
  if (printerId) return printers.find((p) => p.id === printerId)
  // No explicit printer: use the agent's default.
  try {
    const status = await checkPrinterAgent()
    if (status.defaultPrinter) return status.defaultPrinter
  } catch {
    /* ignore */
  }
  return printers[0]
}

export async function printLabels(
  template: Template,
  rows: Array<{ row_data: Record<string, string>; quantity: number }>,
  opts: GenerateZPLOptions & { printerId?: string; retries?: number } = {},
): Promise<PrintResult> {
  const target = await resolveTarget(opts.printerId)
  const useImage =
    target?.connection === "usb" && !templateHasBarcodeOrQr(template.canvas_data)

  if (useImage) {
    const images = await renderLabelsToPngs(template, rows, {
      startFromLabel: opts.startFromLabel,
      endAtLabel: opts.endAtLabel,
    })
    return sendImagesToPrinterAgent(images, template.width_mm, template.height_mm, {
      printerId: opts.printerId,
    })
  }

  // ZPL path (network printers, or templates with barcodes/QR)
  const imageCache = await prepareImages(template.canvas_data)
  const zpl = generateZPL(template, rows, { ...opts, imageCache })
  return sendToPrinterAgent(zpl, "zpl", {
    printerId: opts.printerId,
    retries: opts.retries ?? 2,
  })
}
