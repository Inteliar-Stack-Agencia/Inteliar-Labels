"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import {
  Printer,
  User,
  Wifi,
  Monitor,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface PrinterRow {
  id: string
  name: string
  model: string | null
  connection_type: string
  ip_address: string | null
  port: number | null
  is_default: boolean
}

type SettingsTab = "printers" | "account"

const emptyForm = {
  name: "",
  model: "",
  connection_type: "tcp",
  ip_address: "",
  port: "",
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>("printers")
  const [printers, setPrinters] = useState<PrinterRow[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? "")
      setUserId(user.id)

      const { data } = await supabase
        .from("printers")
        .select("id, name, model, connection_type, ip_address, port, is_default")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setPrinters(data ?? [])
    } catch {
      // silent
    } finally {
      setLoadingPrinters(false)
    }
  }

  async function handleDeletePrinter(id: string) {
    const supabase = createClient()
    try {
      await supabase.from("printers").delete().eq("id", id)
      setPrinters((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // silent
    }
  }

  async function handleSetDefault(id: string) {
    const supabase = createClient()
    try {
      // unset all
      await supabase.from("printers").update({ is_default: false }).eq("user_id", userId)
      // set chosen
      await supabase.from("printers").update({ is_default: true }).eq("id", id)
      setPrinters((prev) =>
        prev.map((p) => ({ ...p, is_default: p.id === id }))
      )
    } catch {
      // silent
    }
  }

  async function handleAddPrinter(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.name) return
    setSaving(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("printers")
        .insert({
          user_id: user.id,
          name: addForm.name,
          model: addForm.model || null,
          connection_type: addForm.connection_type,
          ip_address: addForm.ip_address || null,
          port: addForm.port ? parseInt(addForm.port) : null,
          is_default: printers.length === 0,
        })
        .select()
        .single()
      if (data) setPrinters((prev) => [data, ...prev])
      setAddForm(emptyForm)
      setShowAddForm(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Configuración"
        description="Gestioná tus impresoras y tu cuenta"
      />

      <div className="p-6">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 space-y-1">
            <button
              onClick={() => setActiveTab("printers")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "printers"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Printer className="h-4 w-4" />
              Impresoras
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "account"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Cuenta
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-3xl">
            {activeTab === "printers" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Configuración de impresoras
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Configurá tus impresoras de etiquetas
                    </p>
                  </div>
                  <Button size="sm" className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="h-4 w-4" />
                    Agregar impresora
                  </Button>
                </div>

                {/* Add Printer Form */}
                {showAddForm && (
                  <form
                    onSubmit={handleAddPrinter}
                    className="rounded-xl border border-primary bg-card p-6 space-y-4"
                  >
                    <h3 className="font-semibold text-card-foreground">Nueva impresora</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={addForm.name}
                          onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                          placeholder="Ej: Zebra ZD420"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Modelo
                        </label>
                        <input
                          type="text"
                          value={addForm.model}
                          onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                          placeholder="Ej: ZD420"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          Tipo de conexión
                        </label>
                        <select
                          value={addForm.connection_type}
                          onChange={(e) => setAddForm({ ...addForm, connection_type: e.target.value })}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="tcp">Red (TCP/IP)</option>
                          <option value="usb">USB</option>
                        </select>
                      </div>
                      {addForm.connection_type === "tcp" && (
                        <>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Dirección IP
                            </label>
                            <input
                              type="text"
                              value={addForm.ip_address}
                              onChange={(e) => setAddForm({ ...addForm, ip_address: e.target.value })}
                              placeholder="192.168.1.100"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Puerto
                            </label>
                            <input
                              type="number"
                              value={addForm.port}
                              onChange={(e) => setAddForm({ ...addForm, port: e.target.value })}
                              placeholder="9100"
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowAddForm(false); setAddForm(emptyForm) }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "Guardando…" : "Guardar impresora"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Printer List */}
                {loadingPrinters ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Cargando impresoras…
                  </div>
                ) : printers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                    <Printer className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No tenés impresoras configuradas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {printers.map((printer) => (
                      <div
                        key={printer.id}
                        className={cn(
                          "rounded-xl border bg-card p-6",
                          printer.is_default ? "border-primary" : "border-border"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-lg",
                                printer.connection_type === "tcp"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {printer.connection_type === "tcp" ? (
                                <Wifi className="h-6 w-6" />
                              ) : (
                                <Monitor className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-card-foreground">
                                  {printer.name}
                                </h3>
                                {printer.is_default && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    Predeterminada
                                  </span>
                                )}
                              </div>
                              {printer.model && (
                                <p className="text-xs text-muted-foreground">
                                  Modelo: {printer.model}
                                </p>
                              )}
                              {printer.connection_type === "tcp" && printer.ip_address && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  IP: {printer.ip_address}{printer.port ? `:${printer.port}` : ""}
                                </p>
                              )}
                              <div className="mt-2">
                                <span className="text-xs text-muted-foreground">
                                  Conexión {printer.connection_type === "tcp" ? "de red (TCP/IP)" : "USB"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!printer.is_default && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(printer.id)}
                              >
                                Predeterminar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeletePrinter(printer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Configuración de la cuenta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Información de tu cuenta
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                        {userEmail ? userEmail[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{userEmail}</p>
                        <p className="text-sm text-muted-foreground">Tu correo electrónico</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          readOnly
                          className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          El correo no puede modificarse desde aquí.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold text-foreground">Sesión</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cerrá tu sesión en este dispositivo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                  </Button>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
                  <h3 className="font-semibold text-destructive">
                    Zona de peligro
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Eliminá permanentemente tu cuenta y todos los datos asociados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Eliminar cuenta
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
