// TSPL2 Generator — ported from inteliar-printer-agent2/backend/src/services/tsplGenerator.js
// Generates TSPL2 commands for TSC-compatible printers.
// Ported from labelctl tspl_renderer.go and batch.go

import { generatePresetHeader, type LabelPreset } from './label-presets'
import type { FieldTemplate, LabelField } from './label-templates'

export type DataRow = Record<string, string>

// Renders a single field (from labelctl label_template.go RenderField)
export function renderField(field: LabelField, data: DataRow, colOffset = 0): string {
  const value = data[field.name] ?? field.name
  const x = (field.x ?? 0) + colOffset
  const y = field.y ?? 0

  switch (field.type) {
    case 'barcode': {
      const h = field.height || 40
      const cw = field.cellWidth || 2
      return `BARCODE ${x},${y},"128",${h},1,0,${cw},${cw},"${value}"\r\n`
    }
    case 'qrcode': {
      const cellSize = field.height || 4
      return `QRCODE ${x},${y},L,${cellSize},A,0,"${value}"\r\n`
    }
    default: {
      const font = field.font || '2'
      const size = field.fontSize || 1
      return `TEXT ${x},${y},"${font}",0,${size},${size},"${escTSPL(value)}"\r\n`
    }
  }
}

// Renders all fields for one label (from labelctl label_template.go Render)
export function renderTemplate(template: FieldTemplate, data: DataRow, colOffset = 0): string {
  let result = ''
  for (const field of template.fields) {
    result += renderField(field, data, colOffset)
  }
  return result
}

// Generates full TSPL2 batch (from labelctl batch.go generateLocal)
export function generateBatchTSPL(
  template: FieldTemplate,
  preset: LabelPreset,
  rows: DataRow[],
  copies = 1
): string {
  const cols = preset.columns ?? 1
  const colOffsets = preset.colOffsets ?? [0]

  let tspl = ''
  tspl += generatePresetHeader(preset)

  for (let i = 0; i < rows.length; i += cols) {
    tspl += 'CLS\r\n'
    for (let c = 0; c < cols && (i + c) < rows.length; c++) {
      const row = rows[i + c]
      const colOffset = colOffsets[c] ?? 0
      tspl += renderTemplate(template, row, colOffset)
    }
    tspl += `PRINT ${copies}\r\n`
  }

  return sanitizeTSPL(tspl)
}

// Normalizes line endings and strips BOM (from labelctl batch.go sanitizeTSPL)
export function sanitizeTSPL(tspl: string): string {
  tspl = tspl.replace(/^﻿/, '')
  tspl = tspl.replace(/^[\s\r\n]+/, '')
  tspl = tspl.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n')
  if (!tspl.endsWith('\r\n')) tspl += '\r\n'
  return tspl
}

function escTSPL(s: string): string {
  if (!s) return ''
  s = s.replace(/\\/g, '\\\\')
  s = s.replace(/"/g, "'")
  if (s.length > 60) s = s.substring(0, 57) + '...'
  return s
}
