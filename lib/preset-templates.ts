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

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "food-catering",
    name: "Etiqueta de catering",
    description: "Empresa, plato, comensal, fecha y código de barras",
    emoji: "🍽️",
    widthMm: 100,
    heightMm: 50,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{empresa}}", x: 5, y: 5, fontSize: 16, bold: true },
        { id: "2", type: "text", content: "{{plato}}", x: 5, y: 20, fontSize: 13, bold: false },
        { id: "3", type: "text", content: "{{comensal}}", x: 5, y: 34, fontSize: 11, bold: false },
        { id: "4", type: "text", content: "Vto: {{hoy+3d}}", x: 60, y: 5, fontSize: 10, bold: false },
        { id: "5", type: "barcode", content: "{{codigo}}", x: 60, y: 20, fontSize: 10, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "food-frozen",
    name: "Alimento congelado",
    description: "Producto, peso, fecha de elaboración y vencimiento",
    emoji: "🧊",
    widthMm: 100,
    heightMm: 60,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{empresa}}", x: 5, y: 4, fontSize: 10, bold: false },
        { id: "2", type: "text", content: "{{producto}}", x: 5, y: 14, fontSize: 16, bold: true },
        { id: "3", type: "text", content: "Peso: {{peso}} g", x: 5, y: 30, fontSize: 12, bold: false },
        { id: "4", type: "text", content: "Elaborado: {{hoy}}", x: 5, y: 42, fontSize: 10, bold: false },
        { id: "5", type: "text", content: "Vence: {{hoy+30d}}", x: 5, y: 52, fontSize: 10, bold: false },
        { id: "6", type: "barcode", content: "{{codigo}}", x: 60, y: 28, fontSize: 10, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "price-tag",
    name: "Etiqueta de precio",
    description: "Producto, precio y código de barras EAN-13",
    emoji: "🏷️",
    widthMm: 60,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{producto}}", x: 4, y: 4, fontSize: 12, bold: true },
        { id: "2", type: "text", content: "${{precio}}", x: 4, y: 18, fontSize: 18, bold: true },
        { id: "3", type: "barcode", content: "{{ean}}", x: 4, y: 28, fontSize: 10, bold: false, barcodeType: "ean13" },
      ],
    },
  },
  {
    id: "shipping",
    name: "Etiqueta de envío",
    description: "Destinatario, dirección y número de seguimiento",
    emoji: "📦",
    widthMm: 100,
    heightMm: 60,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "PARA:", x: 5, y: 5, fontSize: 10, bold: false },
        { id: "2", type: "text", content: "{{destinatario}}", x: 5, y: 14, fontSize: 15, bold: true },
        { id: "3", type: "text", content: "{{direccion}}", x: 5, y: 28, fontSize: 11, bold: false },
        { id: "4", type: "text", content: "{{ciudad}}", x: 5, y: 39, fontSize: 11, bold: false },
        { id: "5", type: "barcode", content: "{{tracking}}", x: 5, y: 50, fontSize: 10, bold: false, barcodeType: "code128" },
        { id: "6", type: "text", content: "{{hoy}}", x: 72, y: 5, fontSize: 9, bold: false },
      ],
    },
  },
  {
    id: "blank",
    name: "En blanco",
    description: "Empezar desde cero",
    emoji: "✨",
    widthMm: 100,
    heightMm: 50,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [],
    },
  },
]
