"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Shown only in a support session opened from /admin ("Entrar como usuario").
// Makes it obvious that actions are being done on someone else's account.
export function SupportBanner() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const match = document.cookie.split("; ").find((c) => c.startsWith("soporte_modo="))
    if (match) setEmail(decodeURIComponent(match.split("=")[1]))
  }, [])

  if (!email) return null

  async function exit() {
    await createClient().auth.signOut()
    document.cookie = "soporte_modo=; path=/; max-age=0"
    window.location.href = "/auth/login"
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 bg-red-600 px-4 py-1.5 text-xs font-medium text-white">
      <span>Modo soporte: estás dentro de la cuenta de <strong>{email}</strong>. Lo que hagas se aplica a su cuenta.</span>
      <button onClick={exit} className="rounded bg-white/20 px-2 py-0.5 hover:bg-white/30">Salir</button>
    </div>
  )
}
