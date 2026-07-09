"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Support WhatsApp number (same number is used for other SaaS, so the prefilled
// message identifies the product and the user).
const SUPPORT_WHATSAPP = "5491165689145"

export function SupportButton() {
  const [href, setHref] = useState<string>("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = (user?.user_metadata ?? {}) as { full_name?: string; first_name?: string }
      const name = meta.full_name || meta.first_name || ""
      const email = user?.email ?? ""
      const who = [name, email && `(${email})`].filter(Boolean).join(" ")
      const msg =
        `Hola! 👋 Te escribo desde *Inteliar Labels* (sistema de impresión de etiquetas).\n` +
        (who ? `Soy ${who}.\n` : "") +
        `Necesito ayuda con: `
      setHref(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(msg)}`)
    })
  }, [])

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Soporte por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#20bd5a]"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Soporte</span>
    </a>
  )
}
