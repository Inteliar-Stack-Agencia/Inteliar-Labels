"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    setLoading(false)
    if (error) { setError("No se pudo enviar el email. Revisá la dirección e intentá de nuevo."); return }
    setSent(true)
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
          <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            {sent ? "Revisá tu email" : "Te enviamos un link para crear una nueva contraseña"}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Si <strong>{email}</strong> tiene una cuenta, te llegó un email con un link para
              restablecer tu contraseña. Revisá también el spam.
            </p>
            <Link href="/auth/login" className="text-sm text-primary hover:underline block">
              Volver a iniciar sesión
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperación"}
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
