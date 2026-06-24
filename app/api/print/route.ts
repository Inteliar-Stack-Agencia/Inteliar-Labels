// POST /api/print  — generate + send to local printer-agent (localhost:9638)
// GET  /api/print  — recent print history (in-memory, resets on redeploy)
//
// When Next.js is deployed to Vercel, the POST route can't reach localhost:9638.
// In that case, generate ZPL client-side with lib/zpl.ts and call
// lib/printer-agent-client.ts directly from the browser.

import { NextRequest, NextResponse } from 'next/server' 
import {
  generateBatchZPL,
  generateFieldBatchZPL,
  expandRows,
  type DataRow,
  type ElementTemplate
} from '@/lib/generators/zpl-field-generator'
import { generateBatchTSPL } from '@/lib/generators/tspl-generator'
import { getTemplateById } from '@/lib/generators/label-templates'
import { getPresetById } from '@/lib/generators/label-presets'

interface PrintHistoryEntry {
  id: number
  totalLabels: number
  timestamp: string
  status: 'printed' | 'error'
  message: string
  format?: string
  bytes?: number
}

// MVP: in-memory history — move to Supabase jobs table when ready
const printHistory: PrintHistoryEntry[] = []

export async function GET() {
  return NextResponse.json(printHistory.slice(-50).reverse())
}

export async function POST(request: NextRequest) {
  let body: {
    template?: ElementTemplate
    templateId?: string
    rows?: DataRow[]
    options?: { copies?: number }
    zpl?: string
    tspl?: string
    agentUrl?: string
    format?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  const { template, templateId, rows, options, zpl: rawZpl, tspl: rawTspl, agentUrl, format } = body

  try {
    let printData = rawZpl ?? rawTspl ?? ''
    let printType: 'zpl' | 'tspl' = rawTspl ? 'tspl' : 'zpl'
    let totalLabels = 0

    if (!printData && templateId && rows) {
      const tmpl = getTemplateById(templateId)
      if (!tmpl) return NextResponse.json({ error: `Template '${templateId}' no encontrado` }, { status: 404 })
      const preset = getPresetById(tmpl.presetId ?? 'single-40x25')
      const expanded = expandRows(rows)
      totalLabels = expanded.length

      if (format === 'tspl' && preset) {
        printData = generateBatchTSPL(tmpl, preset, expanded, options?.copies ?? 1)
        printType = 'tspl'
      } else if (preset) {
        const result = generateFieldBatchZPL(tmpl, preset, expanded, options?.copies ?? 1)
        printData = result.zpl
      }
    }

    if (!printData && template && rows) {
      const result = generateBatchZPL(template, rows)
      printData = result.zpl
      totalLabels = result.totalLabels
    }

    if (!printData) {
      return NextResponse.json({ error: 'Se requiere zpl, tspl, template+rows o templateId+rows' }, { status: 400 })
    }

    const printerAgentUrl = agentUrl ?? 'http://localhost:9638'
    const agentResponse = await fetch(`${printerAgentUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: printType, data: printData })
    })
    const agentResult = await agentResponse.json() as { success: boolean; message: string; labels?: number }

    const entry: PrintHistoryEntry = {
      id: printHistory.length + 1,
      totalLabels: totalLabels || agentResult.labels || 0,
      timestamp: new Date().toISOString(),
      status: agentResult.success ? 'printed' : 'error',
      message: agentResult.message,
      format: printType,
      bytes: printData.length
    }
    printHistory.push(entry)
    return NextResponse.json(entry)
  } catch (err) {
    const entry: PrintHistoryEntry = {
      id: printHistory.length + 1,
      totalLabels: 0,
      timestamp: new Date().toISOString(),
      status: 'error',
      message: `Printer agent no disponible: ${(err as Error).message}`
    }
    printHistory.push(entry)
    return NextResponse.json(entry, { status: 502 })
  }
}
