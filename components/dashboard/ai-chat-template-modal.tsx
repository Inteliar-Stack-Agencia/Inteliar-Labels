"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, X, Send, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LabelElement } from "@/lib/label-types"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface TemplateProposal {
  widthMm: number
  heightMm: number
  elements: LabelElement[]
  summary: string
}

export const AI_CHAT_TEMPLATE_STORAGE_KEY = "ai_chat_template_draft"

const PREVIEW_SCALE = 4 // px per mm

function TemplatePreview({ proposal }: { proposal: TemplateProposal }) {
  const width = proposal.widthMm * PREVIEW_SCALE
  const height = proposal.heightMm * PREVIEW_SCALE
  return (
    <div className="flex justify-center py-3">
      <div
        className="relative border-2 border-dashed border-border bg-white shadow-sm"
        style={{ width, height, minWidth: 120, minHeight: 60 }}
      >
        {proposal.elements.map((el) => {
          const left = (el.x / 10) * PREVIEW_SCALE
          const top = (el.y / 10) * PREVIEW_SCALE
          if (el.type === "barcode") {
            return (
              <div key={el.id} className="absolute" style={{ left, top }}>
                <div className="flex gap-[1px]">
                  {[...Array(16)].map((_, j) => (
                    <div key={j} className={j % 3 === 0 ? "w-[2px] bg-neutral-500" : "w-[2px] bg-neutral-900"} style={{ height: 16 }} />
                  ))}
                </div>
              </div>
            )
          }
          if (el.type === "qr") {
            return (
              <div
                key={el.id}
                className="absolute h-6 w-6"
                style={{
                  left, top,
                  backgroundImage: "repeating-linear-gradient(0deg, #171717 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, #171717 0 3px, transparent 3px 6px)",
                  backgroundBlendMode: "multiply",
                  outline: "1px solid #171717",
                }}
              />
            )
          }
          return (
            <span
              key={el.id}
              className="absolute whitespace-nowrap text-neutral-800"
              style={{
                left, top,
                fontSize: Math.max(8, el.fontSize * PREVIEW_SCALE / 3),
                fontWeight: el.bold ? "bold" : "normal",
              }}
            >
              {el.content}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function AiChatTemplateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposal, setProposal] = useState<TemplateProposal | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const next = [...messages, { role: "user" as const, content: text.trim() }]
    setMessages(next)
    setInput("")
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error en la conversación")
        setMessages(next.slice(0, -1)) // roll back the user message so they can retry
        return
      }
      if (data.type === "question") {
        setMessages([...next, { role: "assistant", content: data.message }])
        setProposal(null)
      } else {
        setMessages([...next, { role: "assistant", content: data.message || "Acá tenés una propuesta de diseño." }])
        // AI returns x/y in mm; canvas stores positions in tenths-of-mm → multiply by 10
        const elements: LabelElement[] = data.elements.map((el: LabelElement, i: number) => ({
          ...el,
          id: `${Date.now()}-${i}`,
          x: Math.round((el.x ?? 0) * 10),
          y: Math.round((el.y ?? 0) * 10),
        }))
        setProposal({ widthMm: data.widthMm ?? 80, heightMm: data.heightMm ?? 40, elements, summary: data.message ?? "" })
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.")
      setMessages(next.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function handleUseTemplate() {
    if (!proposal) return
    sessionStorage.setItem(AI_CHAT_TEMPLATE_STORAGE_KEY, JSON.stringify(proposal))
    router.push("/templates/new?ai=chat")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-xl border border-border bg-card shadow-2xl" style={{ height: "min(640px, 90vh)" }}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold">Armar plantilla charlando con la IA</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Contame qué querés etiquetar — por ejemplo: "etiquetas para tortas caseras, con nombre del
              producto, ingredientes, fecha de elaboración y vencimiento". La IA te va a proponer un diseño y
              podés pedirle cambios hasta que quede como querés.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground"
              }>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                Pensando…
              </div>
            </div>
          )}
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        {proposal && (
          <div className="border-t border-border px-5 py-3">
            <TemplatePreview proposal={proposal} />
            <Button size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700" onClick={handleUseTemplate}>
              <Check className="h-4 w-4" />
              Usar esta plantilla y abrir en el editor
            </Button>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              O seguí charlando abajo para pedirle ajustes.
            </p>
          </div>
        )}

        <form
          className="flex items-end gap-2 border-t border-border p-4"
          onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
        >
          <textarea
            autoFocus
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            disabled={loading}
            placeholder="Escribí acá… (Enter para enviar, Shift+Enter para nueva línea)"
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
