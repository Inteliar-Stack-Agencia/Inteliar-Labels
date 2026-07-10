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
const MAX_TURNS = 12

const SYSTEM_PROMPT = `Sos un asistente que ayuda a un usuario a diseñar, charlando, una etiqueta térmica para imprimir.

Tu trabajo es entender qué necesita etiquetar (rubro, qué datos van en la etiqueta, tamaño aproximado) y
proponer un diseño. Si la primera descripción ya tiene información suficiente (qué es, qué campos necesita),
proponé el diseño directamente sin hacer preguntas innecesarias. Si es muy vaga (ej: "quiero una etiqueta"),
hacé como máximo 1 o 2 preguntas cortas para entender el rubro y los datos antes de proponer el diseño.

Reglas del diseño:
- Las posiciones x, y son en milímetros desde la esquina superior izquierda
- Los textos con variables usan la sintaxis {{nombre_variable}} (minúsculas, sin espacios, guión bajo)
- Tipos de elemento: "text", "barcode", "qr" (no existe "logo" ni "image"; ignoralo o reemplazá por un texto de empresa)
- fontSize en puntos (10-24 típico, 16-20 para títulos)
- El campo "content" es el texto o variable que muestra el elemento
- Distribuí los elementos de forma lógica sin superposiciones
- Detectá automáticamente qué campos deberían ser variables ({{...}}) vs texto fijo
- Los elementos deben caber dentro de widthMm x heightMm

Respondé SIEMPRE con SOLO un JSON válido (sin explicaciones fuera del JSON), con una de estas dos formas:

Si necesitás preguntar algo antes de proponer el diseño:
{ "type": "question", "message": "tu pregunta corta acá" }

Si ya tenés información suficiente y proponés (o actualizás) el diseño:
{
  "type": "template",
  "message": "una frase corta explicando qué armaste o qué cambiaste",
  "widthMm": number,
  "heightMm": number,
  "elements": [
    { "id": "1", "type": "text" | "barcode" | "qr", "content": string, "x": number, "y": number, "fontSize": number, "bold": boolean }
  ]
}

Cuando el usuario pida cambios sobre un diseño que ya propusiste, respondé de nuevo con "type": "template"
incluyendo el diseño completo actualizado (no un diff).`

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

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

    const { allowed } = await checkRateLimit(supabaseAdmin, "ai-chat-template", user.id, DAILY_LIMIT, 24 * 60 * 60)
    if (!allowed) {
      return NextResponse.json({ error: `Límite diario de ${DAILY_LIMIT} generaciones con IA alcanzado. Probá de nuevo mañana.` }, { status: 429 })
    }

    const { messages } = (await req.json()) as { messages?: ChatMessage[] }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Conversación vacía" }, { status: 400 })
    }
    if (messages.length > MAX_TURNS * 2) {
      return NextResponse.json({ error: "Conversación demasiado larga. Empezá una nueva." }, { status: 400 })
    }

    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1536,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const textBlock = message.content.find((b) => b.type === "text")
    const rawText = textBlock && textBlock.type === "text" ? textBlock.text : ""
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim()

    let result
    try {
      result = JSON.parse(jsonText)
    } catch (parseErr) {
      console.error("AI chat-template: failed to parse model output:", rawText)
      throw parseErr
    }

    if (result.type === "template" && (!result.elements || !Array.isArray(result.elements))) {
      return NextResponse.json({ error: "Respuesta inválida del modelo" }, { status: 500 })
    }
    if (result.type !== "question" && result.type !== "template") {
      return NextResponse.json({ error: "Respuesta inválida del modelo" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("AI chat-template error:", err)
    return NextResponse.json({ error: "Error en la conversación con la IA" }, { status: 500 })
  }
}
