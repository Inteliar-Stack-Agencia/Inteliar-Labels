// Field-based Label Templates — ported from inteliar-printer-agent2/backend/src/services/labelTemplates.js
// Based on labelctl label_template.go

export interface LabelField {
  name: string
  type: 'text' | 'barcode' | 'qrcode'
  x: number
  y: number
  font: string
  fontSize: number
  height: number
  cellWidth: number
}

export interface FieldTemplate {
  id: string
  name: string
  presetId: string
  fields: LabelField[]
  builtin: boolean
}

const builtinTemplates: FieldTemplate[] = [
  {
    id: 'basic-barcode',
    name: 'Texto + Barcode',
    presetId: 'single-30x22',
    fields: [
      { name: 'descripcion', type: 'text',    x: 8,  y: 8,  font: '3', fontSize: 1, height: 0,  cellWidth: 0 },
      { name: 'codigo',      type: 'barcode', x: 8,  y: 48, font: '0', fontSize: 0, height: 40, cellWidth: 2 }
    ],
    builtin: true
  },
  {
    id: 'basic-qr',
    name: 'Texto + QR',
    presetId: 'single-30x22',
    fields: [
      { name: 'descripcion', type: 'text',   x: 8, y: 8,  font: '3', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'codigo',      type: 'qrcode', x: 8, y: 48, font: '0', fontSize: 0, height: 4, cellWidth: 0 }
    ],
    builtin: true
  },
  {
    id: 'product-label',
    name: 'Producto (desc + presentacion + barcode)',
    presetId: 'matrix-3x1-30x22',
    fields: [
      { name: 'descripcion',   type: 'text',    x: 0, y: 8,   font: '2', fontSize: 1, height: 0,  cellWidth: 0 },
      { name: 'presentacion',  type: 'text',    x: 0, y: 32,  font: '1', fontSize: 1, height: 0,  cellWidth: 0 },
      { name: 'codigo',        type: 'barcode', x: 0, y: 56,  font: '0', fontSize: 0, height: 40, cellWidth: 2 },
      { name: 'codigo',        type: 'text',    x: 0, y: 100, font: '1', fontSize: 1, height: 0,  cellWidth: 0 }
    ],
    builtin: true
  },
  {
    id: 'food-production',
    name: 'Produccion Alimentos',
    presetId: 'single-76x51',
    fields: [
      { name: 'empresa',      type: 'text',   x: 8,   y: 8,   font: '4', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'plato',        type: 'text',   x: 8,   y: 48,  font: '3', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'fecha',        type: 'text',   x: 8,   y: 88,  font: '2', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'vencimiento',  type: 'text',   x: 8,   y: 112, font: '2', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'lote',         type: 'text',   x: 8,   y: 140, font: '1', fontSize: 1, height: 0, cellWidth: 0 },
      { name: 'codigo',       type: 'qrcode', x: 260, y: 48,  font: '0', fontSize: 0, height: 5, cellWidth: 0 }
    ],
    builtin: true
  }
]

// MVP: in-memory custom templates. Move to Supabase when multi-tenant is needed.
let customTemplates: FieldTemplate[] = []

export function getAllTemplates(): FieldTemplate[] {
  return [...builtinTemplates, ...customTemplates]
}

export function getTemplateById(id: string): FieldTemplate | null {
  return builtinTemplates.find(t => t.id === id)
    ?? customTemplates.find(t => t.id === id)
    ?? null
}

export function saveTemplate(template: FieldTemplate): FieldTemplate {
  if (builtinTemplates.find(t => t.id === template.id)) {
    throw new Error('Cannot overwrite built-in template')
  }
  template.builtin = false
  const idx = customTemplates.findIndex(t => t.id === template.id)
  if (idx >= 0) {
    customTemplates[idx] = template
  } else {
    customTemplates.push(template)
  }
  return template
}

export function deleteTemplate(id: string): void {
  if (builtinTemplates.find(t => t.id === id)) {
    throw new Error('Cannot delete built-in template')
  }
  const idx = customTemplates.findIndex(t => t.id === id)
  if (idx < 0) throw new Error('Template not found')
  customTemplates.splice(idx, 1)
}

export function getRequiredVars(template: FieldTemplate): string[] {
  const seen = new Set<string>()
  const vars: string[] = []
  for (const f of template.fields) {
    if (!seen.has(f.name)) {
      seen.add(f.name)
      vars.push(f.name)
    }
  }
  return vars
}
