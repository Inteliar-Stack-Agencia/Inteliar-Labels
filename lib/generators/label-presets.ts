// Label Presets — ported from inteliar-printer-agent2/backend/src/services/labelPresets.js
// Defines reusable label layout configurations (based on labelctl presets.go)

export interface LabelPreset {
  id: string
  name: string
  columns: number
  labelWidth: number   // mm
  labelHeight: number  // mm
  gapRow: number       // mm gap between rows
  gapCol: number       // dots gap between columns
  totalWidth: number   // mm total media width
  direction: string
  speed: number
  density: number
  colOffsets: number[] // x positions in dots per column
  builtin: boolean
}

const builtinPresets: LabelPreset[] = [
  {
    id: 'single-40x25',
    name: 'Individual 40x25mm',
    columns: 1,
    labelWidth: 40,
    labelHeight: 25,
    gapRow: 3,
    gapCol: 0,
    totalWidth: 40,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8],
    builtin: true
  },
  {
    id: 'single-30x22',
    name: 'Individual 30x22mm',
    columns: 1,
    labelWidth: 30,
    labelHeight: 22,
    gapRow: 3,
    gapCol: 0,
    totalWidth: 30,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8],
    builtin: true
  },
  {
    id: 'matrix-3x1-30x22',
    name: '3 por fila 30x22mm (96mm total)',
    columns: 3,
    labelWidth: 30,
    labelHeight: 22,
    gapRow: 3,
    gapCol: 272,
    totalWidth: 96,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8, 280, 552],
    builtin: true
  },
  {
    id: 'single-76x51',
    name: 'Individual 3"x2" (76x51mm)',
    columns: 1,
    labelWidth: 76.2,
    labelHeight: 50.8,
    gapRow: 3,
    gapCol: 0,
    totalWidth: 76.2,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8],
    builtin: true
  },
  {
    id: 'single-40x12',
    name: 'Individual 40x12mm',
    columns: 1,
    labelWidth: 40,
    labelHeight: 12,
    gapRow: 2,
    gapCol: 0,
    totalWidth: 40,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8],
    builtin: true
  },
  {
    id: 'single-50x30',
    name: 'Individual 50x30mm',
    columns: 1,
    labelWidth: 50,
    labelHeight: 30,
    gapRow: 3,
    gapCol: 0,
    totalWidth: 50,
    direction: '0,0',
    speed: 4,
    density: 8,
    colOffsets: [8],
    builtin: true
  }
]

// MVP: in-memory custom presets. Move to Supabase when multi-tenant is needed.
let customPresets: LabelPreset[] = []

export function getAllPresets(): LabelPreset[] {
  return [...builtinPresets, ...customPresets]
}

export function getPresetById(id: string): LabelPreset | null {
  return builtinPresets.find(p => p.id === id)
    ?? customPresets.find(p => p.id === id)
    ?? null
}

export function savePreset(preset: LabelPreset): LabelPreset {
  if (builtinPresets.find(p => p.id === preset.id)) {
    throw new Error('Cannot overwrite built-in preset')
  }
  preset.builtin = false
  const idx = customPresets.findIndex(p => p.id === preset.id)
  if (idx >= 0) {
    customPresets[idx] = preset
  } else {
    customPresets.push(preset)
  }
  return preset
}

export function deletePreset(id: string): void {
  if (builtinPresets.find(p => p.id === id)) {
    throw new Error('Cannot delete built-in preset')
  }
  const idx = customPresets.findIndex(p => p.id === id)
  if (idx < 0) throw new Error('Preset not found')
  customPresets.splice(idx, 1)
}

function fmtFloat(f: number): string {
  return f === Math.floor(f) ? String(f) : f.toFixed(1)
}

// Generates TSPL2 header commands for a preset (from labelctl presets.go)
export function generatePresetHeader(preset: LabelPreset): string {
  let cmds = ''
  cmds += `SIZE ${fmtFloat(preset.totalWidth)} mm, ${fmtFloat(preset.labelHeight)} mm\r\n`
  cmds += `GAP ${fmtFloat(preset.gapRow)} mm, 0 mm\r\n`
  cmds += `DIRECTION ${preset.direction}\r\n`
  cmds += `SPEED ${preset.speed}\r\n`
  cmds += `DENSITY ${preset.density}\r\n`
  cmds += `SET TEAR ON\r\n`
  cmds += `CLS\r\n`
  return cmds
}
