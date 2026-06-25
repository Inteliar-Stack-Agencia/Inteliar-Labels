// GET  /api/presets — list all label presets (builtin + custom)
// POST /api/presets — create a custom preset

import { NextRequest, NextResponse } from 'next/server'
import { getAllPresets, savePreset, type LabelPreset } from '@/lib/generators/label-presets'

export async function GET() {
  return NextResponse.json(getAllPresets())
}

export async function POST(request: NextRequest) {
  let body: LabelPreset
  try {
    body = await request.json() as LabelPreset
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  if (!body.id || !body.name) {
    return NextResponse.json({ error: 'id y name son requeridos' }, { status: 400 })
  }

  try {
    const preset = savePreset(body)
    return NextResponse.json(preset, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
