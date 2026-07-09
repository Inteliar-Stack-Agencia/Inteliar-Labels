import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { checkRateLimit } from "@/lib/rate-limit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DAILY_LIMIT = 20

const SYSTEM_PROMPT = `Eres un experto en diseño de etiquetas térmicas.
El usuario te describe la etiqueta que necesita y vos generás un JSON con los elementos posicionados en el canvas.

Reglas:
- Las posiciones x, y son en milímetros desde la esquina superior izquierda
- Los textos con variables usan la sintaxis {{nombre_variable}} (minúsculas, sin espacios, guión bajo)
- Tipos de elemento: "text", "barcode", "qr" (no existe "logo" ni "image"; ignoralo o reemplazá por un texto de empresa)
- fontSize en puntos (10-24 típico, 16-20 para títulos)
- El campo "content" es el texto o variable que muestra el elemento
- Distribuí los elementos de forma lógica sin superposiciones
- Detectá automáticamente qué campos deberían ser variables ({{...}}) vs texto fijo
- Los elementos deben caber dentro de widthMm x heightMm

Respondé SOLO con JSON válido, sin explicaciones, con esta estructura exacta:
{
  "widthMm": number,
  "heightMm": number,
  "elements": [
    {
      "id": "1",
      "type": "text" | "barcode" | "qr",
      "content": string,
      "x": number,
      "y": number,
      "fontSize": number,
      "bold": boolean
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { allowed } = await checkRateLimit(supabaseAdmin, "ai-generate-template", user.id, DAILY_LIMIT, 24 * 60 * 60)
    if (!allowed) {
      return NextResponse.json({ error: `Límite diario de ${DAILY_LIMIT} generaciones con IA alcanzado. Probá de nuevo mañana.` }, { status: 429 })
    }

    const { description, widthMm, heightMm } = await req.json()

    if (!description?.trim()) {
      return NextResponse.json({ error: "Descripción requerida" }, { status: 400 })
    }

    const userMessage = `Diseñá una etiqueta térmica de ${widthMm ?? 100}mm x ${heightMm ?? 50}mm para: ${description}`

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : ""

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()

    const result = JSON.parse(jsonText)

    if (!result.elements || !Array.isArray(result.elements)) {
      return NextResponse.json({ error: "Respuesta inválida del modelo" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("AI generate-template error:", err)
    return NextResponse.json({ error: "Error generando plantilla" }, { status: 500 })
  }
}
