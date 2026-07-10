"use client"

import { Sparkles, MessageCircle, Wand2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analytics } from "@/lib/analytics"

const CHAT_EXAMPLE = [
  { from: "user" as const, text: "Etiquetas para tortas caseras: nombre, ingredientes, fecha de elaboración y vencimiento" },
  { from: "ai" as const, text: "Armé el diseño con esos 4 campos. ¿Agrego también el peso o el precio?" },
  { from: "user" as const, text: "Sí, el precio" },
  { from: "ai" as const, text: "Listo, agregado abajo a la derecha en negrita." },
]

export function AiTemplateSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-violet-500/5 to-transparent">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-sm text-violet-400 mb-4">
            <Sparkles className="w-4 h-4" />
            Único en el mercado
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Diseñá tu etiqueta charlando con la IA
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Nada de arrastrar cajitas a ciegas. Contale a la IA qué querés etiquetar — el rubro, qué datos
            necesitás — y te arma el diseño completo, con las variables ya detectadas. Le podés pedir cambios
            hasta que quede exactamente como lo necesitás.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-foreground/90">Se lo describís en lenguaje natural, sin saber nada de diseño</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wand2 className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-foreground/90">Detecta sola qué campos deberían salir de tu Excel</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-foreground/90">Le pedís ajustes hasta que el diseño te cierre, y lo abrís editable en el dashboard</span>
            </li>
          </ul>
          <Button size="lg" className="gap-2 group" asChild>
            <a href="/auth/register" onClick={() => analytics.ctaClick("ai_template")}>
              Probar gratis 15 días
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-foreground">Armar plantilla charlando con la IA</span>
          </div>
          <div className="p-4 space-y-3">
            {CHAT_EXAMPLE.map((m, i) => (
              <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={
                  m.from === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground"
                }>
                  {m.text}
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-3.5 py-2.5 text-xs text-violet-400 font-medium">
                ✓ Plantilla lista — abrir en el editor
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
