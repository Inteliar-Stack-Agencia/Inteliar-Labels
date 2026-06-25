// Excel Parser — ported from inteliar-printer-agent2/backend/src/services/excelParser.js
// Parses Excel/CSV buffers into { headers, rows } format (labelctl ExcelData pattern)
// Safe for server-side use in Next.js API routes.

import * as XLSX from 'xlsx'

export interface ExcelData {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  totalLabels: number
  sheetName: string
}

export function parseExcelBuffer(buffer: Buffer | ArrayBuffer): ExcelData {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('No sheets found')

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

  if (rawRows.length < 1) throw new Error('Empty sheet')

  const headers = (rawRows[0] as unknown[]).map(h => String(h ?? '').trim())

  const rows: Record<string, string>[] = []
  for (let r = 1; r < rawRows.length; r++) {
    const rawRow = rawRows[r] as unknown[]
    const record: Record<string, string> = {}
    let empty = true
    for (let i = 0; i < headers.length; i++) {
      if (!headers[i]) continue
      const val = rawRow?.[i]
      record[headers[i]] = val !== undefined && val !== null ? String(val).trim() : ''
      if (record[headers[i]] !== '') empty = false
    }
    if (!empty) rows.push(record)
  }

  let totalLabels = 0
  for (const row of rows) {
    totalLabels += parseInt(row.cantidad ?? row.Cantidad ?? row.qty ?? '1', 10)
  }

  return { headers, rows, totalRows: rows.length, totalLabels, sheetName }
}
