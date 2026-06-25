// ZPL Field-based Generator — ported from inteliar-printer-agent2/backend/src/services/zplGenerator.js
// Handles field-based (labelctl-style) and element-based (visual editor) ZPL generation.
// For visual-editor ZPL using the Konva canvas schema, see lib/zpl.ts instead.

import type { LabelPreset } from './label-presets'
import type { FieldTemplate, LabelField } from './label-templates'

export type DataRow = Record<string, string>

export interface ElementField {
  type: string
  value?: string
  x?: number
  y?: number
  fontSize?: number
  height?: number
  width?: number
  strokeWidth?: number
}

export interface ElementTemplate {
  elements?: ElementField[]
  width?: number
  height?: number
}

export interface BatchResult {
  zpl: string
  totalLabels: number
  labels: string[]
}

// ── Variable replacement ──

export function applyTemplate(template: string, data: DataRow): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const value = data[key.trim()]
    return value !== undefined ? String(value) : ''
  })
}

// ── Row expansion by quantity column ──

export function expandRows(rows: DataRow[]): DataRow[] {
  const expanded: DataRow[] = []
  for (const row of rows) {
    const qty = parseInt(row.cantidad ?? row.Cantidad ?? row.qty ?? '1', 10)
    for (let i = 0; i < qty; i++) {
      expanded.push({ ...row })
    }
  }
  return expanded
}

// ── Element-based ZPL rendering (visual editor, simpler schema than lib/zpl.ts) ──

function elementToZPL(element: ElementField, data: DataRow): string {
  const value = element.value ? applyTemplate(element.value, data) : ''
  const x = element.x ?? 0
  const y = element.y ?? 0
  const fontSize = element.fontSize ?? 30

  switch (element.type) {
    case 'text':
      return `^FO${x},${y}^A0N,${fontSize},${fontSize}^FD${escapeZPL(value)}^FS`
    case 'barcode':
      return `^FO${x},${y}^BCN,${element.height ?? 100},Y,N,N^FD${value}^FS`
    case 'qr':
    case 'qrcode':
      return `^FO${x},${y}^BQN,2,${element.height ?? 5}^FDQA,${value}^FS`
    case 'line':
      return `^FO${x},${y}^GB${element.width ?? 200},${element.height ?? 2},${element.height ?? 2}^FS`
    case 'rect':
      return `^FO${x},${y}^GB${element.width ?? 100},${element.height ?? 100},${element.strokeWidth ?? 2}^FS`
    default:
      return ''
  }
}

export function generateLabelZPL(template: ElementTemplate, data: DataRow, options: { width?: number; height?: number } = {}): string {
  const labelWidth = options.width ?? template.width ?? 400
  const labelHeight = options.height ?? template.height ?? 300

  let zpl = '^XA\n'
  zpl += `^PW${labelWidth}\n`
  zpl += `^LL${labelHeight}\n`

  for (const element of template.elements ?? []) {
    const line = elementToZPL(element, data)
    if (line) zpl += line + '\n'
  }

  zpl += '^PQ1\n'
  zpl += '^XZ'
  return zpl
}

export function generateBatchZPL(template: ElementTemplate, rows: DataRow[], options: { width?: number; height?: number } = {}): BatchResult {
  const expanded = expandRows(rows)
  const labels = expanded.map(row => generateLabelZPL(template, row, options))
  return { zpl: labels.join('\n'), totalLabels: labels.length, labels }
}

// ── Field-based ZPL rendering (labelctl-style) ──

function fieldToZPL(field: LabelField, data: DataRow, colOffset = 0): string {
  const value = data[field.name] ?? field.name
  const x = (field.x ?? 0) + colOffset
  const y = field.y ?? 0

  switch (field.type) {
    case 'text': {
      const fontSize = (field.fontSize || 1) * 24
      return `^FO${x},${y}^A0N,${fontSize},${fontSize}^FD${escapeZPL(value)}^FS`
    }
    case 'barcode': {
      const h = field.height || 40
      return `^FO${x},${y}^BCN,${h},Y,N,N^FD${value}^FS`
    }
    case 'qrcode': {
      const cellSize = field.height || 4
      return `^FO${x},${y}^BQN,2,${cellSize}^FDQA,${value}^FS`
    }
    default:
      return ''
  }
}

// Generates field-based ZPL batch (labelctl-style, with multi-column support)
export function generateFieldBatchZPL(
  template: FieldTemplate,
  preset: LabelPreset,
  rows: DataRow[],
  copies = 1
): BatchResult {
  const cols = preset.columns ?? 1
  const colOffsets = preset.colOffsets ?? [0]
  const labels: string[] = []

  // Convert preset mm to dots (203 DPI = 8 dots/mm)
  const widthDots = Math.round((preset.totalWidth ?? 40) * 8)
  const heightDots = Math.round((preset.labelHeight ?? 25) * 8)

  for (let i = 0; i < rows.length; i += cols) {
    let zpl = '^XA\n'
    zpl += `^PW${widthDots}\n`
    zpl += `^LL${heightDots}\n`

    for (let c = 0; c < cols && (i + c) < rows.length; c++) {
      const row = rows[i + c]
      const colOffset = colOffsets[c] ?? 0
      for (const field of template.fields ?? []) {
        const line = fieldToZPL(field, row, colOffset)
        if (line) zpl += line + '\n'
      }
    }

    zpl += `^PQ${copies}\n`
    zpl += '^XZ'
    labels.push(zpl)
  }

  return { zpl: labels.join('\n'), totalLabels: rows.length, labels }
}

// ── Auto expiry date ──

export function addExpiry(
  rows: DataRow[],
  daysToAdd = 3,
  dateField = 'fecha',
  expiryField = 'vencimiento'
): DataRow[] {
  return rows.map(row => {
    if (row[dateField] && !row[expiryField]) {
      const parts = String(row[dateField]).split('/')
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear()
        const date = new Date(year, month, day)
        date.setDate(date.getDate() + daysToAdd)
        row[expiryField] = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
      }
    }
    return row
  })
}

// ── ZPL Escaping ──

function escapeZPL(s: string): string {
  if (!s) return ''
  s = s.replace(/\\/g, '\\\\')
  s = s.replace(/\^/g, '\\^')
  s = s.replace(/~/g, '\\~')
  if (s.length > 200) s = s.substring(0, 197) + '...'
  return s
}
