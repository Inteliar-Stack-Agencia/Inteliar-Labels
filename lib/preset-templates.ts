// Pre-built label templates for common use cases
import type { LabelElement, CanvasData } from "./label-types"

export interface PresetTemplate {
  id: string
  name: string
  description: string
  emoji: string
  widthMm: number
  heightMm: number
  canvas: CanvasData
}

// All x, y, lineWidth, lineHeight, lineThickness values are in tenths-of-mm (0.1mm units)
// e.g. x: 50 = 5mm from left edge
export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "food-catering",
    name: "Catering / Vianda",
    description: "Empresa, plato, comensal, fecha de elaboración y vencimiento",
    emoji: "🍽️",
    widthMm: 80,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{empresa}}", x: 40, y: 30, fontSize: 10, bold: true },
        { id: "2", type: "text", content: "{{plato}}", x: 40, y: 90, fontSize: 13, bold: true },
        { id: "3", type: "text", content: "{{comensal}}", x: 40, y: 190, fontSize: 10, bold: false },
        { id: "4", type: "text", content: "Elab: {{hoy}}", x: 40, y: 280, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Vto: {{hoy+3d}}", x: 440, y: 280, fontSize: 8, bold: false },
      ],
    },
  },
  {
    id: "food-frozen",
    name: "Alimento congelado",
    description: "Producto, peso, fecha de elaboración y vencimiento",
    emoji: "🧊",
    widthMm: 80,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{empresa}}", x: 40, y: 30, fontSize: 9, bold: false },
        { id: "2", type: "text", content: "{{producto}}", x: 40, y: 90, fontSize: 14, bold: true },
        { id: "3", type: "text", content: "Peso: {{peso}} g", x: 40, y: 200, fontSize: 10, bold: false },
        { id: "4", type: "text", content: "Elab: {{hoy}}", x: 40, y: 280, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Vto: {{hoy+30d}}", x: 440, y: 280, fontSize: 8, bold: false },
      ],
    },
  },
  {
    id: "price-tag",
    name: "Etiqueta de precio",
    description: "Producto, precio y código de barras",
    emoji: "🏷️",
    widthMm: 50,
    heightMm: 30,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{producto}}", x: 40, y: 30, fontSize: 10, bold: true },
        { id: "2", type: "text", content: "${{precio}}", x: 40, y: 100, fontSize: 14, bold: true },
        { id: "3", type: "barcode", content: "{{codigo}}", x: 40, y: 190, fontSize: 8, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "shipping",
    name: "Etiqueta de envío",
    description: "Destinatario, dirección y número de seguimiento",
    emoji: "📦",
    widthMm: 100,
    heightMm: 150,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "PARA:", x: 50, y: 50, fontSize: 10, bold: false },
        { id: "2", type: "text", content: "{{destinatario}}", x: 50, y: 110, fontSize: 16, bold: true },
        { id: "3", type: "text", content: "{{direccion}}", x: 50, y: 280, fontSize: 12, bold: false },
        { id: "4", type: "text", content: "{{ciudad}}", x: 50, y: 380, fontSize: 12, bold: false },
        { id: "5", type: "barcode", content: "{{tracking}}", x: 50, y: 600, fontSize: 10, bold: false, barcodeType: "code128" },
        { id: "6", type: "text", content: "{{hoy}}", x: 700, y: 50, fontSize: 9, bold: false },
      ],
    },
  },
  {
    id: "warehouse",
    name: "Almacén / Depósito",
    description: "Producto, lote, fecha y código de barras interno",
    emoji: "🏭",
    widthMm: 100,
    heightMm: 50,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{producto}}", x: 50, y: 40, fontSize: 14, bold: true },
        { id: "2", type: "text", content: "Lote: {{lote}}", x: 50, y: 160, fontSize: 11, bold: false },
        { id: "3", type: "text", content: "Fecha: {{hoy}}", x: 50, y: 250, fontSize: 10, bold: false },
        { id: "4", type: "barcode", content: "{{codigo}}", x: 550, y: 80, fontSize: 10, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "blank",
    name: "En blanco",
    description: "Empezar desde cero",
    emoji: "✨",
    widthMm: 80,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [],
    },
  },
]
