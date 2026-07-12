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
    description: "Empresa, plato, comensal, fecha de elaboración, vencimiento, lote y alérgenos",
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
        { id: "4", type: "text", content: "Elab: {{hoy}}", x: 40, y: 250, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Vto: {{hoy+3d}}", x: 440, y: 250, fontSize: 8, bold: false },
        { id: "6", type: "text", content: "Lote: {{lote}}", x: 40, y: 280, fontSize: 7, bold: false },
        { id: "7", type: "text", content: "Alérgenos: {{alergenos}}", x: 40, y: 310, fontSize: 7, bold: false },
      ],
    },
  },
  {
    id: "food-frozen",
    name: "Alimento congelado",
    description: "Producto, peso, fecha de elaboración, vencimiento, lote y alérgenos",
    emoji: "🧊",
    widthMm: 80,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{empresa}}", x: 40, y: 30, fontSize: 9, bold: false },
        { id: "2", type: "text", content: "{{producto}}", x: 40, y: 90, fontSize: 14, bold: true },
        { id: "3", type: "text", content: "Peso: {{peso}} g", x: 40, y: 170, fontSize: 10, bold: false },
        { id: "4", type: "text", content: "Elab: {{hoy}}", x: 40, y: 230, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Vto: {{hoy+30d}}", x: 440, y: 230, fontSize: 8, bold: false },
        { id: "6", type: "text", content: "Lote: {{lote}}", x: 40, y: 260, fontSize: 7, bold: false },
        { id: "7", type: "text", content: "Alérgenos: {{alergenos}}", x: 40, y: 290, fontSize: 7, bold: false },
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
    id: "mercadolibre-product",
    name: "Producto Mercado Libre",
    description: "Nombre, SKU, cantidad, precio y número de orden — para pedidos importados de ML",
    emoji: "🛍️",
    widthMm: 60,
    heightMm: 40,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{nombre}}", x: 30, y: 25, fontSize: 11, bold: true },
        { id: "2", type: "text", content: "SKU: {{sku}}", x: 30, y: 100, fontSize: 8, bold: false },
        { id: "3", type: "text", content: "${{precio}}", x: 350, y: 90, fontSize: 14, bold: true },
        { id: "4", type: "text", content: "Cant: {{cantidad}}", x: 30, y: 140, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Orden: {{nro_orden}}", x: 30, y: 180, fontSize: 7, bold: false },
        { id: "6", type: "barcode", content: "{{sku}}", x: 30, y: 240, fontSize: 7, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "mercadolibre-shipping",
    name: "Envío Mercado Libre (control interno)",
    description: "Destinatario, dirección, localidad, provincia, CP y número de orden — para el packing check, no reemplaza la etiqueta oficial de Mercado Envíos",
    emoji: "📦",
    widthMm: 80,
    heightMm: 50,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{destinatario}}", x: 30, y: 25, fontSize: 12, bold: true },
        { id: "2", type: "text", content: "{{direccion}}", x: 30, y: 90, fontSize: 9, bold: false },
        { id: "3", type: "text", content: "{{localidad}}, {{provincia}}", x: 30, y: 140, fontSize: 9, bold: false },
        { id: "4", type: "text", content: "CP: {{cp}}", x: 30, y: 190, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Tel: {{telefono}}", x: 30, y: 230, fontSize: 8, bold: false },
        { id: "6", type: "text", content: "Orden: {{nro_orden}}", x: 30, y: 280, fontSize: 7, bold: false },
      ],
    },
  },
  {
    id: "tiendanube-shipping",
    name: "Envío Tiendanube (control interno)",
    description: "Destinatario, dirección, localidad, provincia, CP, método de envío y número de orden — remito de control interno, no reemplaza la etiqueta oficial de Envío Nube",
    emoji: "📦",
    widthMm: 80,
    heightMm: 50,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{destinatario}}", x: 30, y: 25, fontSize: 12, bold: true },
        { id: "2", type: "text", content: "{{direccion}}", x: 30, y: 90, fontSize: 9, bold: false },
        { id: "3", type: "text", content: "{{localidad}}, {{provincia}}", x: 30, y: 140, fontSize: 9, bold: false },
        { id: "4", type: "text", content: "CP: {{cp}}", x: 30, y: 190, fontSize: 8, bold: false },
        { id: "5", type: "text", content: "Tel: {{telefono}}", x: 30, y: 230, fontSize: 8, bold: false },
        { id: "6", type: "text", content: "{{metodo_envio}}", x: 30, y: 270, fontSize: 7, bold: false },
        { id: "7", type: "text", content: "Orden: {{nro_orden}}", x: 30, y: 300, fontSize: 7, bold: false },
      ],
    },
  },
  {
    id: "product-sku",
    name: "Producto con SKU",
    description: "Nombre, SKU, código de barras del SKU y precio — ideal para inventario",
    emoji: "📋",
    widthMm: 50,
    heightMm: 30,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        { id: "1", type: "text", content: "{{producto}}", x: 30, y: 20, fontSize: 10, bold: true },
        { id: "2", type: "text", content: "SKU: {{sku}}", x: 30, y: 90, fontSize: 8, bold: false },
        { id: "3", type: "text", content: "${{precio}}", x: 320, y: 80, fontSize: 13, bold: true },
        { id: "4", type: "barcode", content: "{{sku}}", x: 30, y: 150, fontSize: 7, bold: false, barcodeType: "code128" },
      ],
    },
  },
  {
    id: "shipping",
    name: "Etiqueta de envío",
    description: "Destinatario, remitente, código 2D y seguimiento — estilo courier",
    emoji: "📦",
    widthMm: 100,
    heightMm: 150,
    canvas: {
      cutBetweenLabels: true,
      cutEveryN: 1,
      elements: [
        // Outer border
        { id: "border", type: "rect", content: "", x: 20, y: 20, fontSize: 12, bold: false, lineWidth: 960, lineHeight: 1460, lineThickness: 4 },

        // ── Header: service (left) + big zone code (right) ──
        { id: "svc1", type: "text", content: "{{servicio}}", x: 50, y: 55, fontSize: 15, bold: true },
        { id: "zone", type: "text", content: "{{zona}}", x: 560, y: 40, fontSize: 24, bold: true },
        { id: "route", type: "text", content: "{{ruta}}", x: 560, y: 120, fontSize: 16, bold: true },
        { id: "div1", type: "line", content: "", x: 40, y: 175, fontSize: 12, bold: false, lineWidth: 920, lineThickness: 8 },

        // ── 2D code + SHIP FROM ──
        { id: "qr", type: "qr", content: "{{tracking}}", x: 50, y: 200, fontSize: 10, bold: false },
        { id: "from-lbl", type: "text", content: "SHIP FROM:", x: 320, y: 200, fontSize: 7, bold: false },
        { id: "from-name", type: "text", content: "{{remitente}}", x: 320, y: 235, fontSize: 10, bold: true },
        { id: "from-addr", type: "text", content: "{{dir_remitente}}", x: 320, y: 275, fontSize: 9, bold: false },
        { id: "from-city", type: "text", content: "{{ciudad_remitente}}", x: 320, y: 310, fontSize: 9, bold: false },
        { id: "div2", type: "line", content: "", x: 40, y: 370, fontSize: 12, bold: false, lineWidth: 920, lineThickness: 4 },

        // ── SHIP TO ──
        { id: "to-lbl", type: "text", content: "SHIP TO:", x: 50, y: 400, fontSize: 9, bold: true },
        { id: "to-name", type: "text", content: "{{destinatario}}", x: 50, y: 440, fontSize: 16, bold: true },
        { id: "to-addr", type: "text", content: "{{direccion}}", x: 50, y: 500, fontSize: 12, bold: false },
        { id: "to-city", type: "text", content: "{{ciudad}}", x: 50, y: 550, fontSize: 12, bold: false },
        { id: "to-dest", type: "text", content: "{{destino}}", x: 50, y: 620, fontSize: 24, bold: true },
        { id: "div3", type: "line", content: "", x: 40, y: 740, fontSize: 12, bold: false, lineWidth: 920, lineThickness: 10 },

        // ── Service + weight ──
        { id: "svc2", type: "text", content: "{{servicio}}", x: 50, y: 775, fontSize: 12, bold: true },
        { id: "weight", type: "text", content: "{{peso}} LBS", x: 720, y: 775, fontSize: 12, bold: true },

        // ── Tracking barcode ──
        { id: "barcode", type: "barcode", content: "{{tracking}}", x: 70, y: 850, fontSize: 10, bold: false, barcodeType: "code128" },
        { id: "track-num", type: "text", content: "{{tracking}}", x: 50, y: 1320, fontSize: 11, bold: true, textAlign: "center" },
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
