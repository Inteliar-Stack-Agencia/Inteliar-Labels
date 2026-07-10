"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "lucide-react"
import { analytics } from "@/lib/analytics"

export default function RegisterPage() {
  const supabase = createClient()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [countryCode, setCountryCode] = useState("+54")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    analytics.registerStart()

    const whatsapp = `${countryCode}${phone.replace(/\D/g, "")}`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          whatsapp,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    analytics.registerComplete(email)

    // Fire-and-forget welcome email
    fetch("/api/auth/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {})

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>¡Revisá tu email!</CardTitle>
            <CardDescription>
              Te enviamos un link de confirmación a <strong>{email}</strong>.
              Hacé click en el link para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/auth/login">
              <Button variant="outline">Ir al login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
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
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Empezá gratis, sin tarjeta de crédito</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <div className="flex gap-2">
                <select
                  aria-label="Código de país"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+1">🇺🇸 +1</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9 11 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Te contactamos para ayudarte con la instalación y el soporte.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput
                id="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis · 15 días de trial"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Al registrarte aceptás los{" "}
              <Link href="/terminos" className="text-primary hover:underline">Términos y Condiciones</Link>
              {" "}y la{" "}
              <Link href="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tenés cuenta?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
export const dynamic = "force-dynamic"
