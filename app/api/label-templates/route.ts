// GET  /api/label-templates — list all field-based templates (builtin + custom)
// POST /api/label-templates — create a custom field-based template
//
// These are labelctl-style field templates (templateId-based printing).
// The visual editor templates created in /templates are stored in Supabase.

import { NextRequest, NextResponse } from 'next/server'
import { getAllTemplates, saveTemplate, type FieldTemplate } from '@/lib/generators/label-templates'

export async function GET() {
  return NextResponse.json(getAllTemplates())
}

export async function POST(request: NextRequest) {
  let body: FieldTemplate
  try {
    body = await request.json() as FieldTemplate
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 })
  }

  if (!body.id || !body.name || !Array.isArray(body.fields)) {
    return NextResponse.json({ error: 'id, name y fields son requeridos' }, { status: 400 })
  }

  try {
    const template = saveTemplate(body)
    return NextResponse.json(template, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
