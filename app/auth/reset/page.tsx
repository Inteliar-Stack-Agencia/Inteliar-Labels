"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // The recovery link may carry a ?code= to exchange for a session.
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError("No se pudo actualizar. Volvé a pedir el link de recuperación desde el email.")
      return
    }
    setDone(true)
    setTimeout(() => { router.push("/dashboard"); router.refresh() }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Inteliar Labels</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
          <CardDescription>
            {done ? "¡Contraseña actualizada!" : "Elegí una nueva contraseña para tu cuenta"}
          </CardDescription>
        </CardHeader>

        {done ? (
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Te estamos redirigiendo al panel…</p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Repetir contraseña</Label>
                <PasswordInput
                  id="confirm"
                  autoComplete="new-password"
                  placeholder="Repetí la contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Guardando..." : "Guardar contraseña"}
              </Button>
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground text-center">
                Volver a iniciar sesión
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
export const dynamic = "force-dynamic"
