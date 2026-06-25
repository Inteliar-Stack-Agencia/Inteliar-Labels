// POST /api/generate
// Generates ZPL or TSPL2 label commands from a template + data rows.
// Supports two modes:
//   1. templateId (field-based, labelctl-style) — use lib/generators/
//   2. template (element-based, Repo2 visual editor schema) — use lib/generators/zpl-field-generator
// For the Next.js Konva visual editor, generation happens client-side via lib/zpl.ts

import { NextRequest, NextResponse } from 'next/server'
import {
  generateBatchZPL,
  generateFieldBatchZPL,
  addExpiry,
  expandRows,
  type ElementTemplate,
  type DataRow
} from '@/lib/generators/zpl-field-generator'
import { generateBatchTSPL } from '@/lib/generators/tspl-generator'
import { getTemplateById } from '@/lib/generators/label-templates'
import { getPresetById } from '@/lib/generators/label-presets'

export async function POST(request: NextRequest) {
  let body: {
    template?: ElementTemplate
    templateId?: string
    rows?: DataRow[]
    options?: { autoExpiry?: boolean; expiryDays?: number; copies?: number; width?: number; height?: number }
    format?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { template, templateId, rows, options, format } = body

  if (!rows || !Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows es requerido (array)' }, { status: 400 })
  }

  try {
    let processedRows = rows
    if (options?.autoExpiry) {
      processedRows = addExpiry([...rows], options.expiryDays ?? 3)
    }
    const expanded = expandRows(processedRows)

    // Mode 1: field-based template (labelctl style)
    if (templateId) {
      const tmpl = getTemplateById(templateId)
      if (!tmpl) {
        return NextResponse.json({ error: `Template '${templateId}' no encontrado` }, { status: 404 })
      }
      const preset = getPresetById(tmpl.presetId ?? 'single-40x25')
      if (!preset) {
        return NextResponse.json({ error: `Preset '${tmpl.presetId}' no encontrado` }, { status: 404 })
      }

      if (format === 'tspl') {
        const tspl = generateBatchTSPL(tmpl, preset, expanded, options?.copies ?? 1)
        return NextResponse.json({
          format: 'tspl',
          totalLabels: expanded.length,
          commands: tspl,
          preview: tspl.substring(0, 2000)
        })
      }

      const result = generateFieldBatchZPL(tmpl, preset, expanded, options?.copies ?? 1)
      return NextResponse.json({
        format: 'zpl',
        totalLabels: result.totalLabels,
        zpl: result.zpl,
        preview: result.labels.slice(0, 3)
      })
    }

    // Mode 2: element-based template
    if (template) {
      const result = generateBatchZPL(template, processedRows, { width: options?.width, height: options?.height })
      return NextResponse.json({
        format: 'zpl',
        totalLabels: result.totalLabels,
        zpl: result.zpl,
        preview: result.labels.slice(0, 3)
      })
    }

    return NextResponse.json({ error: 'template o templateId es requerido' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Error generando comandos: ' + (err as Error).message },
      { status: 500 }
    )
  }
}
